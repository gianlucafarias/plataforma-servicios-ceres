import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { finalizeObservedResponse, observedJson } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/observability/events/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { id } = await params;

    const event = await prisma.auditEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return observedJson(
        context,
        {
          success: false,
          error: 'not_found',
          message: 'Evento no encontrado',
        },
        { status: 404 },
      );
    }

    const timeline = event.requestId
      ? await prisma.auditEvent.findMany({
          where: { requestId: event.requestId },
          orderBy: { createdAt: 'asc' },
          take: 100,
        })
      : [event];

    return observedJson(context, {
      success: true,
      data: {
        event,
        timeline,
      },
    });
  } catch (error) {
    console.error('Error obteniendo detalle de observabilidad:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al obtener el detalle del evento',
      },
      { status: 500 },
    );
  }
}
