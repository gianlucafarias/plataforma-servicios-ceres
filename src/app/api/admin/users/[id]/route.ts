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
 * Body: { role?, verified?, firstName?, lastName?, email?, phone?, location?, birthDate? }
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
    const existing = await prisma.user.findUnique({ where: { id } });
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

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        role: true,
        verified: true,
        emailVerifiedAt: true,
        birthDate: true,
        location: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
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
