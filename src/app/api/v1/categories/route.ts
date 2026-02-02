import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const LIMIT = 60;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function clientIp(req: Request) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function GET(request: Request) {
  const meta = requestMeta(request);
  const rl = rateLimit(`categories:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, meta),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const [areas, subcatOficios, subcatProfesiones, counts] = await Promise.all([
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: null, active: true },
        select: { id: true, name: true, slug: true, groupId: true, backgroundUrl: true, description: true, active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { groupId: 'oficios', parentCategoryId: { not: null }, active: true },
        include: { parent: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: { groupId: 'profesiones', active: true },
        orderBy: { name: 'asc' },
      }),
      prisma.service.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        where: { professional: { status: 'active' } },
      }),
    ]);

    const countMap = new Map<string, number>();
    counts.forEach((c) => countMap.set(c.categoryId, c._count.categoryId));

    const subcategoriesOficios = subcatOficios.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      group: sub.groupId,
      areaId: sub.parentCategoryId,
      areaSlug: sub.parent?.slug ?? null,
      image: sub.backgroundUrl,
      description: sub.description,
      active: sub.active,
      professionalCount: countMap.get(sub.id) || 0,
    }));

    const subcategoriesProfesiones = subcatProfesiones.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      group: sub.groupId,
      areaId: null,
      areaSlug: null,
      image: sub.backgroundUrl,
      description: sub.description,
      active: sub.active,
      professionalCount: countMap.get(sub.id) || 0,
    }));

    const areasWithCounts = areas.map((area) => {
      const subs = subcategoriesOficios.filter((s) => s.areaSlug === area.slug);
      const professionalCount = subs.reduce((sum, s) => sum + s.professionalCount, 0);
      const subcategoryCount = subs.length;
      return {
        id: area.id,
        name: area.name,
        slug: area.slug,
        group: area.groupId,
        image: area.backgroundUrl,
        description: area.description,
        active: area.active,
        subcategoryCount,
        professionalCount,
      };
    });

    return NextResponse.json(
      ok(
        {
          areas: areasWithCounts,
          subcategoriesOficios,
          subcategoriesProfesiones,
        },
        meta
      ),
      { headers: rateLimitHeaders(rl) }
    );
  } catch (error) {
    console.error('Error obteniendo categorías (v1):', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener categorías', undefined, meta),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
