import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const categoria = searchParams.get('categoria') || undefined; // slug de subcategoría
    const grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;
    const location = searchParams.get('location') || undefined; // filtro por ubicación
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const sortBy = (searchParams.get('sortBy') || 'recent') as 'name' | 'rating' | 'recent';

    const where: Prisma.ProfessionalWhereInput = {};

    if (grupo) {
      where.professionalGroup = grupo; 
    }

    if (categoria) {
      where.services = {
        some: {
          category: { slug: categoria }
        }
      };
    }

    if (location && location !== 'all') {
      const locationFilter: Prisma.ProfessionalWhereInput = {
        OR: [
          // Profesionales que tienen esta ubicación en su lista de serviceLocations
          { serviceLocations: { has: location } },
          // Profesionales que trabajan en toda la región
          { serviceLocations: { has: 'all-region' } },
          // Profesionales cuya ubicación principal coincide (fallback)
          { location: location }
        ]
      };

      where.AND = Array.isArray(where.AND) 
        ? [...where.AND, locationFilter]
        : [locationFilter];
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
        ]
      };

      where.AND = Array.isArray(where.AND) 
        ? [...where.AND, searchFilter]
        : [searchFilter];
    }

    let orderBy: Prisma.ProfessionalOrderByWithRelationInput   = { createdAt: 'desc' };
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
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, verified: true } },
          services: {
            take: 1,
            orderBy: { createdAt: 'asc' },
            include: { category: { select: { name: true } } }
          }
        },
      })
    ]);

    const data = rows.map((p) => ({
      id: p.id,
      user: { name: `${p.user.firstName} ${p.user.lastName}`.trim() },
      bio: p.bio,
      verified: p.verified || p.user.verified,
      primaryCategory: { name: p.services[0]?.category?.name ?? undefined },
      location: p.location ?? undefined,
      rating: p.rating ?? 0,
      reviewCount: p.reviewCount ?? 0,
      ProfilePicture: p.ProfilePicture ?? undefined,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Get professionals error:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener profesionales' },
      { status: 500 }
    );
  }
}