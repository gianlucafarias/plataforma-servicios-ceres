import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const LIMIT = 120;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function GET(request: NextRequest) {
  const metaBase = requestMeta(request);
  const { searchParams } = new URL(request.url);

  const rl = rateLimit(`professionals:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const q = searchParams.get('q') || undefined;
    const categoria = searchParams.get('categoria') || undefined; // slug de subcategoría
    const grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;
    const location = searchParams.get('location') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const sortBy = (searchParams.get('sortBy') || 'recent') as 'name' | 'rating' | 'recent';

    const where: Prisma.ProfessionalWhereInput = {
      status: 'active',
    };

    if (grupo) {
      where.professionalGroup = grupo;
    }

    if (categoria) {
      where.services = {
        some: {
          category: { slug: categoria },
        },
      };
    }

    if (location && location !== 'all') {
      const locationFilter: Prisma.ProfessionalWhereInput = {
        OR: [
          { serviceLocations: { has: location } },
          { serviceLocations: { has: 'all-region' } },
          { location: location },
        ],
      };

      where.AND = Array.isArray(where.AND) ? [...where.AND, locationFilter] : [locationFilter];
    }

    if (q) {
      const searchFilter: Prisma.ProfessionalWhereInput = {
        OR: [
          { bio: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { user: { firstName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          { user: { lastName: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          { services: { some: { title: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
          { services: { some: { description: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
          { services: { some: { category: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } } } },
        ],
      };

      where.AND = Array.isArray(where.AND) ? [...where.AND, searchFilter] : [searchFilter];
    }

    let orderBy: Prisma.ProfessionalOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'name') {
      orderBy = { user: { firstName: 'asc' } };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const [total, rows] = await Promise.all([
      prisma.professional.count({ where }),
      prisma.professional.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          bio: true,
          verified: true,
          rating: true,
          reviewCount: true,
          location: true,
          ProfilePicture: true,
          whatsapp: true,
          serviceLocations: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              verified: true,
              image: true,
              location: true,
              phone: true,
            },
          },
          services: {
            take: 1,
            orderBy: { createdAt: 'asc' },
            include: { category: { select: { name: true } } },
          },
        },
      }),
    ]);

    const data = rows.map((p) => ({
      id: p.id,
      user: { name: `${p.user.firstName} ${p.user.lastName}`.trim() },
      bio: p.bio,
      verified: p.verified || p.user.verified,
      primaryCategory: { name: p.services[0]?.category?.name ?? undefined },
      location: p.location ?? p.user.location ?? undefined,
      rating: p.rating ?? 0,
      reviewCount: p.reviewCount ?? 0,
      ProfilePicture: p.ProfilePicture || p.user.image || undefined,
      whatsapp: p.whatsapp || undefined,
      phone: p.user.phone || undefined,
      serviceLocations: p.serviceLocations ?? [],
    }));

    const meta = {
      ...metaBase,
      pagination: {
        page,
        pageSize,
        total,
      },
    };

    return NextResponse.json(ok(data, meta), {
      headers: rateLimitHeaders(rl),
    });
  } catch (error) {
    console.error('Get professionals v1 error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al obtener profesionales', undefined, metaBase),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
