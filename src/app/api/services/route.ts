import { NextRequest, NextResponse } from 'next/server';
import { Prisma, CategoryGroupId } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES } from '@/lib/taxonomy';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const q = (searchParams.get('q') || '').trim();

    const grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;
    const categoriaSlug = searchParams.get('categoria') || null;
    const location = searchParams.get('location') || null;

    const where: Prisma.ServiceWhereInput = {
      available: true,
      professional: { 
        status: 'active',
        user: { verified: true },
      },
    };

    // Filtrar por grupo del profesional (oficios/profesiones)
    if (grupo) {
      const groupEnum = grupo === 'oficios' ? CategoryGroupId.oficios : CategoryGroupId.profesiones;
      const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
      where.professional = {
        ...baseProfessional,
        professionalGroup: groupEnum,
      };
    }

    // Filtrar por categoría específica
    if (categoriaSlug) {
      where.category = { slug: categoriaSlug };
    }

    // Filtrar por ubicación del profesional
    if (location && location !== 'all') {
      const baseProfessional = (where.professional as Prisma.ProfessionalWhereInput) || {};
      where.professional = {
        ...baseProfessional,
        OR: [
          // Profesionales que tienen esta ubicación en su lista de serviceLocations
          { serviceLocations: { has: location } },
          // Profesionales que trabajan en toda la región
          { serviceLocations: { has: 'all-region' } },
          // Profesionales cuya ubicación principal coincide (fallback)
          { location: location }
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
              user: { select: { firstName: true, lastName: true, verified: true, location: true } },
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

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List services error:', error);
    return NextResponse.json(
      { success: false, error: 'fetch_failed', message: 'Error al obtener servicios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, categorySlug, priceRange } = body as {
      title: string; description: string; categorySlug: string; priceRange?: string;
    };

    if (!title || !description || !categorySlug) {
      return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
    });
    if (!professional) {
      return NextResponse.json({ success: false, error: 'no_professional' }, { status: 404 });
    }

    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      // Intento de autocreación desde taxonomy como fallback
      const allTaxonomy = [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES];
      const match = allTaxonomy.find((c) => c.slug === categorySlug);
      if (match) {
        // match.group es 'oficios' | 'profesiones', coincide con CategoryGroup.id
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
        return NextResponse.json({ success: false, error: 'category_not_found' }, { status: 404 });
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

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('POST /api/services error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}