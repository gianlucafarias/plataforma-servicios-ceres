import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const professionalId = searchParams.get('professionalId') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: Prisma.ProfessionalDocumentationWhereInput = {
      criminalRecordObjectKey: { not: null },
    };

    if (status) {
      where.criminalRecordStatus = status;
    }

    if (professionalId) {
      where.professionalId = professionalId;
    }

    const [total, rows] = await Promise.all([
      prisma.professionalDocumentation.count({ where }),
      prisma.professionalDocumentation.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          professional: {
            select: {
              id: true,
              verified: true,
              status: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (routeError) {
    console.error('Error listando antecedentes para revision:', routeError);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: 'Error al obtener antecedentes para revision.',
      },
      { status: 500 }
    );
  }
}
