import { NextRequest, NextResponse } from 'next/server';
import { Prisma, CategoryGroupId } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { AREAS_OFICIOS, SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES } from '@/lib/taxonomy';
import { prisma } from '@/lib/prisma';
import { ok, fail, requestMeta } from '@/lib/api-response';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit-memory';

const RL_LIST = { limit: 200, windowMs: 5 * 60 * 1000 }; // 200 req / 5 min por IP
const RL_POST = { limit: 40, windowMs: 10 * 60 * 1000 }; // 40 req / 10 min por IP

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function GET(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(`services:list:${clientIp(request)}`, RL_LIST.limit, RL_LIST.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const q = (searchParams.get('q') || '').trim();

    let grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;
    const subcategoriaSlug = searchParams.get('subcategoria');
    let categoriaSlug = searchParams.get('categoria') || null;
    const location = searchParams.get('location') || null;

    const where: Prisma.ServiceWhereInput = {
      available: true,
      professional: {
        status: 'active',
        user: { verified: true },
      },
    };

    if (subcategoriaSlug) {
      categoriaSlug = subcategoriaSlug;
    }

    if (q && !categoriaSlug) {
      const normalized = q.toLowerCase();
      const allTaxonomy = [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES];
      const matched = allTaxonomy.find(
        (subcat) =>
          subcat.name.toLowerCase().includes(normalized) ||
          subcat.slug.toLowerCase().includes(normalized)
      );

      if (matched) {
        categoriaSlug = matched.slug;
        if (!grupo) {
          grupo = matched.group as 'oficios' | 'profesiones';
        }
      }
    }

    if (grupo) {
      const groupEnum = grupo === 'oficios' ? CategoryGroupId.oficios : CategoryGroupId.profesiones;
      const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
      where.professional = {
        ...baseProfessional,
        professionalGroup: groupEnum,
      };
    }

    if (categoriaSlug) {
      const areaMatch = AREAS_OFICIOS.find((area) => area.slug === categoriaSlug);

      if (areaMatch) {
        const subSlugs = SUBCATEGORIES_OFICIOS.filter((sub) => sub.areaSlug === areaMatch.slug).map(
          (sub) => sub.slug
        );

        where.category = subSlugs.length > 0 ? { slug: { in: subSlugs } } : { slug: categoriaSlug };
      } else {
        where.category = { slug: categoriaSlug };
      }
    }

    if (location && location !== 'all') {
      const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
      where.professional = {
        ...baseProfessional,
        OR: [
          { serviceLocations: { has: location } },
          { serviceLocations: { has: 'all-region' } },
          { location: location },
        ],
      };
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        {
          professional: {
            user: {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        include: {
          category: { select: { name: true } },
          professional: {
            select: {
              id: true,
              location: true,
              verified: true,
              rating: true,
              reviewCount: true,
              ProfilePicture: true,
              whatsapp: true,
              user: { select: { firstName: true, lastName: true, verified: true, location: true, phone: true } },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
    ]);

    const data = services.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      priceRange: s.priceRange,
      professional: {
        id: s.professional.id,
        location: s.professional.location ?? s.professional.user.location ?? null,
        whatsapp: s.professional.whatsapp ?? null,
        phone: s.professional.user.phone ?? null,
        user: {
          name: `${s.professional.user.firstName} ${s.professional.user.lastName}`.trim(),
          location: s.professional.user.location ?? null,
        },
        rating: s.professional.rating ?? 0,
        reviewCount: s.professional.reviewCount ?? 0,
        verified: s.professional.verified,
        ProfilePicture: s.professional.ProfilePicture ?? null,
      },
      category: { name: s.category.name },
    }));

    const meta = {
      ...metaBase,
      pagination: { page, pageSize: limit, total },
    };

    return NextResponse.json(ok(data, meta), { headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('List services v1 error:', error);

    const message =
      error instanceof Error && error.message
        ? `Error al obtener servicios. Detalle: ${error.message}`
        : 'Error al obtener servicios';

    return NextResponse.json(fail('fetch_failed', message, undefined, metaBase), {
      status: 500,
      headers: rateLimitHeaders(rl),
    });
  }
}

export async function POST(request: NextRequest) {
  const metaBase = requestMeta(request);
  const rl = rateLimit(`services:create:${clientIp(request)}`, RL_POST.limit, RL_POST.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      fail('rate_limited', 'Demasiadas solicitudes. Intenta más tarde.', undefined, metaBase),
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        fail('unauthorized', 'No autorizado', undefined, metaBase),
        { status: 401, headers: rateLimitHeaders(rl) }
      );
    }

    const body = await request.json();
    const { title, description, categorySlug, priceRange } = body as {
      title: string;
      description: string;
      categorySlug: string;
      priceRange?: string;
    };

    if (!title || !description || !categorySlug) {
      return NextResponse.json(
        fail('invalid_body', 'Faltan campos requeridos', undefined, metaBase),
        { status: 400, headers: rateLimitHeaders(rl) }
      );
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
    });
    if (!professional) {
      return NextResponse.json(
        fail('no_professional', 'Perfil profesional no encontrado', undefined, metaBase),
        { status: 404, headers: rateLimitHeaders(rl) }
      );
    }

    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      const allTaxonomy = [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES];
      const match = allTaxonomy.find((c) => c.slug === categorySlug);
      if (match) {
        category = await prisma.category.create({
          data: {
            name: match.name,
            description: match.name,
            slug: match.slug,
            active: true,
            group: { connect: { id: match.group } },
          },
        });
      } else {
        return NextResponse.json(
          fail('category_not_found', 'Categoría no encontrada', undefined, metaBase),
          { status: 404, headers: rateLimitHeaders(rl) }
        );
      }
    }

    const created = await prisma.service.create({
      data: {
        professionalId: professional.id,
        categoryId: category.id,
        categoryGroup: professional.professionalGroup ?? null,
        title,
        description,
        priceRange: priceRange || '',
        available: true,
      },
      include: {
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(ok(created, metaBase), { status: 201, headers: rateLimitHeaders(rl) });
  } catch (error) {
    console.error('POST /api/v1/services error:', error);
    return NextResponse.json(
      fail('server_error', 'Error al crear servicio', undefined, metaBase),
      { status: 500, headers: rateLimitHeaders(rl) }
    );
  }
}
