import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { enqueueSlackAlert } from '@/jobs/slack.producer';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const { status, verified } = await request.json();

    // Validar status
    if (!['active', 'pending', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Obtener info actual para comparar cambios
    const current = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    const updated = await prisma.professional.update({
      where: { id },
      data: {
        status,
        verified: verified !== undefined ? verified : undefined,
        updatedAt: new Date()
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    // Notificar cambios importantes a Slack (en background, no bloquea la respuesta)
    try {
      const wasPending = current.status === 'pending';
      const isNowActive = status === 'active' && wasPending;
      const isNowSuspended = status === 'suspended' && current.status !== 'suspended';

      if (isNowActive) {
        await enqueueSlackAlert(
          `prof:approved:${id}`,
          `✅ Profesional aprobado:\n*${updated.user.firstName} ${updated.user.lastName}*\nEmail: ${updated.user.email}\n${verified ? '✓ Verificado' : ''}`
        );
      } else if (isNowSuspended) {
        await enqueueSlackAlert(
          `prof:suspended:${id}`,
          `⚠️ Profesional suspendido:\n*${updated.user.firstName} ${updated.user.lastName}*\nEmail: ${updated.user.email}`
        );
      }
    } catch (slackError) {
      // No fallar si Slack falla
      console.error('Error enviando alerta a Slack:', slackError);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Estado actualizado a: ${status}`
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar estado' },
      { status: 500 }
    );
  }
}