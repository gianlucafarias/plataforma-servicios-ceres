import { NextRequest, NextResponse } from 'next/server';
import { finalizeObservedResponse, observedJson } from '@/lib/observability/audit';
import { createRequestObservationContext, createSystemActor } from '@/lib/observability/context';
import { observabilityMetrics } from '@/lib/observability/metrics';

export async function GET(request: NextRequest) {
  const context = createRequestObservationContext(request, {
    route: '/api/ops/metrics',
    actor: createSystemActor('prometheus'),
  });

  try {
    const metrics = await observabilityMetrics.getMetrics();
    const response = new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': observabilityMetrics.getContentType(),
      },
    });

    return finalizeObservedResponse(context, response);
  } catch (error) {
    console.error('Error generando metricas:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al generar metricas',
      },
      { status: 500 },
    );
  }
}
