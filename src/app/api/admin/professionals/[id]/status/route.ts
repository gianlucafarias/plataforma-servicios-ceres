import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { enqueueProfessionalApprovedEmail } from '@/jobs/email.producer';
import { enqueueSlackAlert } from '@/jobs/slack.producer';
import { buildChanges, finalizeObservedResponse, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

function professionalStatusSnapshot(professional: {
  id: string;
  status: string;
  verified: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}) {
  return {
    id: professional.id,
    status: professional.status,
    verified: professional.verified,
    fullName: `${professional.user.firstName || ''} ${professional.user.lastName || ''}`.trim(),
    email: professional.user.email,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/professionals/[id]/status',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { id } = await params;
    const { status, verified } = await request.json();

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return observedJson(
        context,
        { success: false, error: 'validation_error', message: 'Estado invalido' },
        { status: 400 },
      );
    }

    const current = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!current) {
      return observedJson(
        context,
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 },
      );
    }

    const updated = await prisma.professional.update({
      where: { id },
      data: {
        status,
        verified: verified !== undefined ? verified : undefined,
        updatedAt: new Date(),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'admin.professionals',
      eventName: 'professional.status.update',
      status: 'success',
      summary: `Estado de profesional ${updated.id} actualizado a ${updated.status}`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'professional',
      entityId: updated.id,
      changes: buildChanges(
        professionalStatusSnapshot(current),
        professionalStatusSnapshot(updated),
      ),
    });

    const wasPending = current.status === 'pending';
    const isNowActive = status === 'active' && wasPending;
    const isNowSuspended = status === 'suspended' && current.status !== 'suspended';

    if (isNowActive) {
      try {
        await enqueueSlackAlert(
          `prof:approved:${id}`,
          `Profesional aprobado:\n*${updated.user.firstName} ${updated.user.lastName}*\nEmail: ${updated.user.email}\n${verified ? 'Verificado' : ''}`,
        );
        await safeRecordAuditEvent({
          kind: 'workflow',
          domain: 'admin.professionals',
          eventName: 'professional.status.slack_sent',
          status: 'success',
          summary: `Notificacion Slack enviada por aprobacion del profesional ${updated.id}`,
          actor: context.actor,
          requestId: context.requestId,
          entityType: 'professional',
          entityId: updated.id,
          metadata: {
            target: 'slack',
            transition: 'pending_to_active',
          },
        });
      } catch (slackError) {
        console.error('Error enviando alerta a Slack:', slackError);
        await safeRecordAuditEvent({
          kind: 'workflow',
          domain: 'admin.professionals',
          eventName: 'professional.status.slack_failed',
          status: 'failure',
          summary: `Fallo el workflow Slack para profesional ${updated.id}`,
          actor: context.actor,
          requestId: context.requestId,
          entityType: 'professional',
          entityId: updated.id,
          metadata: {
            target: 'slack',
            error: slackError instanceof Error ? slackError.message : 'Unknown error',
          },
        });
      }

      try {
        await enqueueProfessionalApprovedEmail({
          professionalId: updated.id,
          email: updated.user.email,
          firstName: updated.user.firstName,
          lastName: updated.user.lastName,
          observability: {
            requestId: context.requestId,
            actor: context.actor,
          },
        });
      } catch (emailError) {
        console.error('Error enviando correo de aprobacion:', emailError);
      }
    } else if (isNowSuspended) {
      try {
        await enqueueSlackAlert(
          `prof:suspended:${id}`,
          `Profesional suspendido:\n*${updated.user.firstName} ${updated.user.lastName}*\nEmail: ${updated.user.email}`,
        );
        await safeRecordAuditEvent({
          kind: 'workflow',
          domain: 'admin.professionals',
          eventName: 'professional.status.slack_sent',
          status: 'success',
          summary: `Notificacion Slack enviada por suspension del profesional ${updated.id}`,
          actor: context.actor,
          requestId: context.requestId,
          entityType: 'professional',
          entityId: updated.id,
          metadata: {
            target: 'slack',
            transition: 'to_suspended',
          },
        });
      } catch (slackError) {
        console.error('Error enviando alerta a Slack:', slackError);
        await safeRecordAuditEvent({
          kind: 'workflow',
          domain: 'admin.professionals',
          eventName: 'professional.status.slack_failed',
          status: 'failure',
          summary: `Fallo el workflow Slack para profesional ${updated.id}`,
          actor: context.actor,
          requestId: context.requestId,
          entityType: 'professional',
          entityId: updated.id,
          metadata: {
            target: 'slack',
            error: slackError instanceof Error ? slackError.message : 'Unknown error',
          },
        });
      }
    }

    return observedJson(context, {
      success: true,
      data: updated,
      message: `Estado actualizado a: ${status}`,
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return observedJson(
      context,
      { success: false, error: 'server_error', message: 'Error al actualizar estado' },
      { status: 500 },
    );
  }
}
