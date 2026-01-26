import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

/**
 * GET /api/admin/users/[id]
 * Obtiene detalles completos de un usuario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
            services: {
              take: 10,
              include: {
                category: { select: { name: true, slug: true } }
              }
            },
            _count: {
              select: { services: true, reviews: true, contactRequests: true }
            }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            professional: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        contactRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            professional: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } }
              }
            },
            service: { select: { title: true } }
          }
        },
        _count: {
          select: {
            contactRequests: true,
            reviews: true,
            verificationTokens: true,
            accounts: true,
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Actualiza información de un usuario
 * Body: { role?, verified?, firstName?, lastName?, email?, phone?, location?, birthDate?, suspended? }
 * 
 * Nota: Si suspended=true y el usuario tiene un Professional, se suspenderá el Professional también.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el usuario existe
    const existing = await prisma.user.findUnique({ 
      where: { id },
      include: { professional: true }
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Validar role si se proporciona
    if (body.role && !['citizen', 'professional', 'admin'].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Rol inválido' },
        { status: 400 }
      );
    }

    // Validar email único si se está cambiando
    if (body.email && body.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({ where: { email: body.email } });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'validation_error', message: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Construir datos de actualización
    const updateData: {
      role?: 'citizen' | 'professional' | 'admin';
      verified?: boolean;
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string | null;
      location?: string | null;
      birthDate?: Date | null;
    } = {};

    if (body.role !== undefined) updateData.role = body.role;
    if (body.verified !== undefined) updateData.verified = body.verified;
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.birthDate !== undefined) {
      updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }

    // Si se solicita suspender/activar y el usuario tiene un Professional
    if (body.suspended !== undefined && existing.professional) {
      await prisma.professional.update({
        where: { id: existing.professional.id },
        data: {
          status: body.suspended ? 'suspended' : 'active'
        }
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        professional: {
          select: {
            id: true,
            status: true,
            verified: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        name: updated.name,
        phone: updated.phone,
        role: updated.role,
        verified: updated.verified,
        emailVerifiedAt: updated.emailVerifiedAt,
        birthDate: updated.birthDate,
        location: updated.location,
        image: updated.image,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        professional: updated.professional,
      },
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Elimina un usuario permanentemente
 * 
 * ADVERTENCIA: Esto eliminará en cascada:
 * - El Professional asociado (si existe)
 * - Los servicios del Professional
 * - Las reviews del usuario
 * - Los contactRequests del usuario
 * - Los verificationTokens del usuario
 * - Las cuentas OAuth del usuario
 * 
 * Esta operación es IRREVERSIBLE.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        professional: {
          include: {
            _count: {
              select: {
                services: true,
                reviews: true,
                contactRequests: true
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true,
            contactRequests: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el usuario (esto eliminará en cascada todo lo relacionado)
    // Prisma maneja automáticamente las relaciones con onDelete: Cascade
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: id,
        deleted: true,
        hadProfessional: !!user.professional,
        professionalServicesCount: user.professional?._count.services || 0,
        userReviewsCount: user._count.reviews,
        userContactRequestsCount: user._count.contactRequests
      },
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
