import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { Prisma } from '@prisma/client';

// GET: Listar todas las certificaciones (para panel admin)
export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | 'suspended' | null;
    const professionalId = searchParams.get('professionalId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: Prisma.ProfessionalCertificationWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (professionalId) {
      where.professionalId = professionalId;
    }

    const [total, certifications] = await Promise.all([
      prisma.professionalCertification.count({ where }),
      prisma.professionalCertification.findMany({
        where,
        include: {
          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return NextResponse.json({
      success: true,
      data: certifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo certificaciones:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: 'Error al obtener certificaciones'
    }, { status: 500 });
  }
}

