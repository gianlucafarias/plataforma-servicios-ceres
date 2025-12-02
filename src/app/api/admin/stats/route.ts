import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  // Verificar API Key
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    // Estadísticas generales
    const [
      totalProfessionals,
      activeProfessionals,
      pendingProfessionals,
      suspendedProfessionals,
      totalServices,
      activeLocations,
    ] = await Promise.all([
      prisma.professional.count(),
      prisma.professional.count({ where: { status: 'active' } }),
      prisma.professional.count({ where: { status: 'pending' } }),
      prisma.professional.count({ where: { status: 'suspended' } }),
      prisma.service.count(),
      
      // Ubicaciones activas únicas
      prisma.professional.findMany({
        where: {
          status: 'active',
          serviceLocations: { isEmpty: false }
        },
        select: { serviceLocations: true }
      }).then(professionals => {
        const locations = new Set<string>();
        professionals.forEach(p => {
          p.serviceLocations.forEach(loc => {
            if (loc && loc !== 'all-region') {
              locations.add(loc);
            }
          });
        });
        return locations.size;
      })
    ]);

    // Distribución por categorías
    const categoryDistribution = await prisma.professional.groupBy({
      by: ['professionalGroup'],
      _count: true,
      where: { professionalGroup: { not: null } }
    });

    // Distribución geográfica
    const geographicDistribution = await prisma.professional.findMany({
      where: {
        status: 'active',
        serviceLocations: { isEmpty: false }
      },
      select: { serviceLocations: true }
    }).then(professionals => {
      const locationCounts: Record<string, number> = {};
      professionals.forEach(p => {
        p.serviceLocations.forEach(loc => {
          if (loc && loc !== 'all-region') {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          }
        });
      });
      return Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count);
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProfessionals,
          activeProfessionals,
          pendingProfessionals,
          suspendedProfessionals,
          totalServices,
          activeLocations,
        },
        categoryDistribution: categoryDistribution.map(item => ({
          category: item.professionalGroup,
          count: item._count
        })),
        geographicDistribution,
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}