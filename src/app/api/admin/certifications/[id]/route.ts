import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { buildChanges, finalizeObservedResponse, observedJson, safeRecordAuditEvent } from '@/lib/observability/audit';
import { createRequestObservationContext } from '@/lib/observability/context';

function certificationSnapshot(certification: {
  id: string;
  professionalId: string;
  status: string;
  adminNotes: string | null;
  reviewedAt: Date | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  professional?: {
    verified: boolean;
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } | null;
}) {
  return {
    id: certification.id,
    professionalId: certification.professionalId,
    status: certification.status,
    adminNotes: certification.adminNotes,
    reviewedAt: certification.reviewedAt,
    categoryId: certification.category?.id ?? null,
    categoryName: certification.category?.name ?? null,
    categorySlug: certification.category?.slug ?? null,
    professionalVerified: certification.professional?.verified ?? null,
    professionalUserId: certification.professional?.user?.id ?? null,
    professionalEmail: certification.professional?.user?.email ?? null,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/certifications/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return observedJson(
        context,
        {
          success: false,
          error: 'validation_error',
          message: 'Estado invalido. Debe ser "approved", "rejected" o "suspended"',
        },
        { status: 400 },
      );
    }

    const certification = await prisma.professionalCertification.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!certification) {
      return observedJson(
        context,
        {
          success: false,
          error: 'not_found',
          message: 'Certificacion no encontrada',
        },
        { status: 404 },
      );
    }

    const updated = await prisma.professionalCertification.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      },
      include: {
        professional: {
          include: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'admin.certifications',
      eventName: 'certification.update',
      status: 'success',
      summary: `Certificacion ${updated.id} actualizada a ${updated.status}`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'certification',
      entityId: updated.id,
      changes: buildChanges(
        certificationSnapshot(certification),
        certificationSnapshot(updated),
      ),
    });

    if (status === 'approved') {
      const approvedCount = await prisma.professionalCertification.count({
        where: {
          professionalId: certification.professionalId,
          status: 'approved',
        },
      });

      if (approvedCount > 0 && !certification.professional.verified) {
        await prisma.professional.update({
          where: { id: certification.professionalId },
          data: { verified: true },
        });

        await safeRecordAuditEvent({
          kind: 'workflow',
          domain: 'admin.certifications',
          eventName: 'professional.verified_by_certification',
          status: 'success',
          summary: `Profesional ${certification.professionalId} marcado como verificado por certificacion aprobada`,
          actor: context.actor,
          requestId: context.requestId,
          entityType: 'professional',
          entityId: certification.professionalId,
          metadata: {
            certificationId: updated.id,
            approvedCertifications: approvedCount,
          },
        });
      }
    }

    return observedJson(context, {
      success: true,
      data: updated,
      message:
        status === 'approved'
          ? 'Certificacion aprobada'
          : status === 'rejected'
            ? 'Certificacion rechazada'
            : 'Certificacion suspendida',
    });
  } catch (error) {
    console.error('Error actualizando certificacion:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al actualizar certificacion',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminApiKey(request);
  const context = createRequestObservationContext(request, {
    route: '/api/admin/certifications/[id]',
    actor: auth.authorized ? auth.actor : undefined,
    requestId: auth.authorized ? auth.requestId : undefined,
  });

  if (auth.error) {
    return finalizeObservedResponse(context, auth.error);
  }

  try {
    const { id } = await params;

    const certification = await prisma.professionalCertification.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!certification) {
      return observedJson(
        context,
        {
          success: false,
          error: 'not_found',
          message: 'Certificacion no encontrada',
        },
        { status: 404 },
      );
    }

    await prisma.professionalCertification.delete({
      where: { id },
    });

    await safeRecordAuditEvent({
      kind: 'audit',
      domain: 'admin.certifications',
      eventName: 'certification.delete',
      status: 'success',
      summary: `Certificacion ${certification.id} eliminada`,
      actor: context.actor,
      requestId: context.requestId,
      route: context.route,
      method: context.method,
      entityType: 'certification',
      entityId: certification.id,
      changes: buildChanges(certificationSnapshot(certification), null),
    });

    return observedJson(context, {
      success: true,
      message: 'Certificacion eliminada',
    });
  } catch (error) {
    console.error('Error eliminando certificacion:', error);
    return observedJson(
      context,
      {
        success: false,
        error: 'server_error',
        message: 'Error al eliminar certificacion',
      },
      { status: 500 },
    );
  }
}
