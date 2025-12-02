import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const status = searchParams.get('status') as 'active' | 'pending' | 'suspended' | null;
    const search = searchParams.get('search') || undefined;
    const grupo = searchParams.get('grupo') as 'oficios' | 'profesiones' | null;

    const where: Prisma.ProfessionalWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (grupo) {
      where.professionalGroup = grupo;
    }

    if (search) {
      where.OR = [
        { bio: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { user: { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        { user: { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } } },
        { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    const [total, professionals] = await Promise.all([
      prisma.professional.count({ where }),
      prisma.professional.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              verified: true,
              createdAt: true
            }
          },
          services: {
            take: 3,
            include: {
              category: { select: { name: true, slug: true } }
            }
          },
          _count: {
            select: { services: true, reviews: true }
          }
        },
      })
    ]);

    const data = professionals.map((p) => ({
      id: p.id,
      userId: p.userId,
      name: `${p.user.firstName} ${p.user.lastName}`.trim(),
      email: p.user.email,
      phone: p.user.phone,
      bio: p.bio,
      status: p.status,
      verified: p.verified,
      professionalGroup: p.professionalGroup,
      experienceYears: p.experienceYears,
      rating: p.rating,
      reviewCount: p.reviewCount,
      serviceCount: p._count.services,
      location: p.location,
      serviceLocations: p.serviceLocations,
      ProfilePicture: p.ProfilePicture,
      whatsapp: p.whatsapp,
      instagram: p.instagram,
      facebook: p.facebook,
      linkedin: p.linkedin,
      website: p.website,
      portfolio: p.portfolio,
      CV: p.CV,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      services: p.services.map(s => ({
        id: s.id,
        title: s.title,
        category: s.category.name
      }))
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
    console.error('Error obteniendo profesionales (admin):', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener profesionales' },
      { status: 500 }
    );
  }
}