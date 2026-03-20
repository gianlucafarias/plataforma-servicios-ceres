import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!bugReport) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Bug report no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: bugReport });
  } catch (error) {
    console.error('Error obteniendo bug report:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener bug report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.bugReport.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Bug report no encontrado' },
        { status: 404 }
      );
    }

    if (body.status && !['open', 'in_progress', 'resolved', 'closed'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Estado invalido' },
        { status: 400 }
      );
    }

    if (body.severity && !['low', 'medium', 'high', 'critical'].includes(body.severity)) {
      return NextResponse.json(
        { success: false, error: 'validation_error', message: 'Severidad invalida' },
        { status: 400 }
      );
    }

    const updateData: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      adminNotes?: string;
      resolvedAt?: Date | null;
    } = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if ((body.status === 'resolved' || body.status === 'closed') && !existing.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
      if (body.status === 'open' || body.status === 'in_progress') {
        updateData.resolvedAt = null;
      }
    }

    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;

    const updated = await prisma.bugReport.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Bug report actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando bug report:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar bug report' },
      { status: 500 }
    );
  }
}
