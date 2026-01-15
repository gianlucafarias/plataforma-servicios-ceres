import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/users
 * Lista usuarios con filtros y paginación
 * Query params: page, limit, role, search, verified
 */
export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const role = searchParams.get('role') as 'citizen' | 'professional' | 'admin' | null;
    const verified = searchParams.get('verified');
    const search = searchParams.get('search') || undefined;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (verified !== null && verified !== undefined) {
      where.verified = verified === 'true';
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          phone: true,
          role: true,
          verified: true,
          emailVerifiedAt: true,
          birthDate: true,
          location: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              contactRequests: true,
              reviews: true,
            }
          },
          professional: {
            select: {
              id: true,
              status: true,
              verified: true,
            }
          }
        },
      })
    ]);

    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: u.name,
      phone: u.phone,
      role: u.role,
      verified: u.verified,
      emailVerifiedAt: u.emailVerifiedAt,
      birthDate: u.birthDate,
      location: u.location,
      image: u.image,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      professional: u.professional,
      stats: {
        contactRequests: u._count.contactRequests,
        reviews: u._count.reviews,
        hasProfessional: u.professional !== null,
      }
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
    console.error('Error obteniendo usuarios (admin):', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
