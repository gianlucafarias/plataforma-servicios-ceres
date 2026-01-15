import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  // Verificar API Key
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'all', 'week', 'month'

    // Calcular fechas para métricas de crecimiento
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Estadísticas generales
    const [
      totalProfessionals,
      activeProfessionals,
      pendingProfessionals,
      suspendedProfessionals,
      totalServices,
      totalUsers,
      totalCitizens,
      totalAdmins,
      totalContactRequests,
      totalReviews,
      totalBugReports,
      openBugReports,
      activeLocations,
      // Métricas de crecimiento
      newProfessionalsThisWeek,
      newProfessionalsThisMonth,
      newUsersThisWeek,
      newUsersThisMonth,
      newServicesThisMonth,
    ] = await Promise.all([
      prisma.professional.count(),
      prisma.professional.count({ where: { status: 'active' } }),
      prisma.professional.count({ where: { status: 'pending' } }),
      prisma.professional.count({ where: { status: 'suspended' } }),
      prisma.service.count(),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'citizen' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.contactRequest.count(),
      prisma.review.count(),
      prisma.bugReport.count(),
      prisma.bugReport.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      
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
      }),

      // Crecimiento
      prisma.professional.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.professional.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.service.count({ where: { createdAt: { gte: monthAgo } } }),
    ]);

    // Distribución por categorías
    const categoryDistribution = await prisma.professional.groupBy({
      by: ['professionalGroup'],
      _count: true,
      where: { professionalGroup: { not: null } }
    });

    // Top categorías por cantidad de servicios
    const topCategories = await prisma.service.groupBy({
      by: ['categoryId'],
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
      take: 10,
    }).then(async (groups) => {
      const categories = await prisma.category.findMany({
        where: { id: { in: groups.map(g => g.categoryId) } },
        select: { id: true, name: true, slug: true }
      });
      return groups.map(g => ({
        categoryId: g.categoryId,
        category: categories.find(c => c.id === g.categoryId),
        count: g._count
      }));
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

    // Bug reports por severidad
    const bugReportsBySeverity = await prisma.bugReport.groupBy({
      by: ['severity'],
      _count: true,
      where: { status: { in: ['open', 'in_progress'] } }
    });

    // Contact requests por estado
    const contactRequestsByStatus = await prisma.contactRequest.groupBy({
      by: ['status'],
      _count: true
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
          totalUsers,
          totalCitizens,
          totalAdmins,
          totalContactRequests,
          totalReviews,
          totalBugReports,
          openBugReports,
          activeLocations,
        },
        growth: {
          newProfessionalsThisWeek,
          newProfessionalsThisMonth,
          newUsersThisWeek,
          newUsersThisMonth,
          newServicesThisMonth,
        },
        categoryDistribution: categoryDistribution.map(item => ({
          category: item.professionalGroup,
          count: item._count
        })),
        topCategories,
        geographicDistribution,
        bugReportsBySeverity: bugReportsBySeverity.map(item => ({
          severity: item.severity,
          count: item._count
        })),
        contactRequestsByStatus: contactRequestsByStatus.map(item => ({
          status: item.status,
          count: item._count
        })),
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