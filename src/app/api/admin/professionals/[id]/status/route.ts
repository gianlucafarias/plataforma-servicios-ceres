import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

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