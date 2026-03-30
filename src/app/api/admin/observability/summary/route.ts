import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { finalizeObservedResponse, observedJson } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

export async function GET(request: NextRequest) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/observability/summary',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      events24h,
      errorEvents24h,
      adminActions24h,
      emailEvents24h,
      requestFailures24h,
      slowRequests24h,
      statusGroups,
      domainGroups,
      recentFailures,
    ] = await Promise.all([
      prisma.auditEvent.count(),
      prisma.auditEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          status: 'failure',
        },
      }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          kind: 'audit',
          actorType: 'admin_user',
        },
      }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          domain: { contains: 'email' },
        },
      }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          kind: 'request',
          eventName: 'request.failed',
        },
      }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          kind: 'request',
          eventName: 'request.slow',
        },
      }),
      prisma.auditEvent.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.auditEvent.groupBy({
        by: ['domain'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.auditEvent.findMany({
        where: {
          createdAt: { gte: since },
          status: { in: ['failure', 'warning'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    return observedJson(context, {
      success: true,
      data: {
        totals: {
          totalEvents,
          events24h,
          errorEvents24h,
          adminActions24h,
          emailEvents24h,
          requestFailures24h,
          slowRequests24h,
        },
        statusBreakdown: statusGroups
          .map((item) => ({
            status: item.status,
            count: item._count._all,
          }))
          .sort((a, b) => b.count - a.count),
        domainBreakdown: domainGroups
          .map((item) => ({
            domain: item.domain,
            count: item._count._all,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        recentFailures,
      },
    });
  } catch (error) {
    console.error('Error obteniendo resumen de observabilidad:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al obtener el resumen de observabilidad',
      },
      { status: 500 },
    );
  }
}
