import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

// PUT: Aprobar o rechazar certificación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: 'Estado inválido. Debe ser "approved", "rejected" o "suspended"'
      }, { status: 400 });
    }

    const certification = await prisma.professionalCertification.findUnique({
      where: { id },
      include: {
        professional: {
          select: {
            id: true,
            verified: true
          }
        }
      }
    });

    if (!certification) {
      return NextResponse.json({
        success: false,
        error: 'not_found',
        message: 'Certificación no encontrada'
      }, { status: 404 });
    }

    const updated = await prisma.professionalCertification.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: new Date()
      },
      include: {
        professional: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Si se aprueba una certificación, verificar si el profesional debe ser marcado como verificado
    if (status === 'approved') {
      const approvedCount = await prisma.professionalCertification.count({
        where: {
          professionalId: certification.professionalId,
          status: 'approved'
        }
      });

      // Si tiene al menos una certificación aprobada, marcar como verificado
      if (approvedCount > 0 && !certification.professional.verified) {
        await prisma.professional.update({
          where: { id: certification.professionalId },
          data: { verified: true }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 
        status === 'approved'
          ? 'Certificación aprobada'
          : status === 'rejected'
            ? 'Certificación rechazada'
            : 'Certificación suspendida'
    });
  } catch (error) {
    console.error('Error actualizando certificación:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: 'Error al actualizar certificación'
    }, { status: 500 });
  }
}

// DELETE: Eliminar certificación (solo admin)
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(_);
  if (error) return error;

  try {
    const { id } = await params;

    await prisma.professionalCertification.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Certificación eliminada'
    });
  } catch (error) {
    console.error('Error eliminando certificación:', error);
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: 'Error al eliminar certificación'
    }, { status: 500 });
  }
}
