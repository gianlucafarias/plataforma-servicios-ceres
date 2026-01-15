import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized'
      }, { status: 401 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        rating: true,
        reviewCount: true,
        verified: true,
        status: true,
        experienceYears: true,
        serviceLocations: true,
        createdAt: true,
        _count: {
          select: {
            services: true,
            reviews: true,
          }
        }
      }
    });

    if (!professional) {
      return NextResponse.json({ 
        success: false, 
        error: 'not_found'
      }, { status: 404 });
    }

    // Contar servicios activos (solo disponible como flag, no hay vistas ni contactos internos)
    const [activeServices, totalServices] = await Promise.all([
      prisma.service.count({
        where: { professionalId: professional.id, available: true },
      }),
      prisma.service.count({
        where: { professionalId: professional.id },
      }),
    ]);

    const stats = {
      services: {
        active: activeServices,
        total: totalServices,
        inactive: totalServices - activeServices,
      },
      rating: {
        average: professional.rating || 0,
        totalReviews: professional.reviewCount || 0,
      },
      profile: {
        verified: professional.verified,
        status: professional.status,
        experienceYears: professional.experienceYears ?? 0,
        locations: professional.serviceLocations?.length ?? 0,
        since: professional.createdAt.toISOString(),
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
