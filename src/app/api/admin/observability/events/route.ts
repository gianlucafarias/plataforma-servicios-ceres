import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { finalizeObservedResponse, observedJson } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

function parseDate(value: string | null, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export async function GET(request: NextRequest) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/observability/events',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get('page')) || 1, 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 100);
    const query = searchParams.get('query')?.trim();
    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'), true);

    const where: Prisma.AuditEventWhereInput = {
      ...(searchParams.get('domain') ? { domain: searchParams.get('domain') || undefined } : {}),
      ...(searchParams.get('actorId') ? { actorId: searchParams.get('actorId') || undefined } : {}),
      ...(searchParams.get('kind') ? { kind: searchParams.get('kind') as never } : {}),
      ...(searchParams.get('status') ? { status: searchParams.get('status') as never } : {}),
      ...(searchParams.get('entityType')
        ? { entityType: searchParams.get('entityType') || undefined }
        : {}),
      ...(searchParams.get('entityId') ? { entityId: searchParams.get('entityId') || undefined } : {}),
      ...(searchParams.get('requestId')
        ? { requestId: searchParams.get('requestId') || undefined }
        : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    if (query) {
      where.OR = [
        { requestId: { contains: query } },
        { entityId: { contains: query } },
        { summary: { contains: query, mode: 'insensitive' } },
        { eventName: { contains: query, mode: 'insensitive' } },
        { actorLabel: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return observedJson(context, {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      filters: {
        from: searchParams.get('from'),
        to: searchParams.get('to'),
        domain: searchParams.get('domain'),
        actorId: searchParams.get('actorId'),
        kind: searchParams.get('kind'),
        status: searchParams.get('status'),
        entityType: searchParams.get('entityType'),
        entityId: searchParams.get('entityId'),
        requestId: searchParams.get('requestId'),
        query,
      },
    });
  } catch (error) {
    console.error('Error listando eventos de observabilidad:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al obtener eventos de observabilidad',
      },
      { status: 500 },
    );
  }
}
