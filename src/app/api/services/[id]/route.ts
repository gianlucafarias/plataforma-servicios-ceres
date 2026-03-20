import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  ServiceFlowError,
  deleteOwnedService,
  updateOwnedService,
} from '@/lib/server/services';

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updated = await updateOwnedService(id, userId, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('PATCH /api/services/[id] error:', error);
    const message =
      error instanceof Error && error.message
        ? `Error al actualizar el servicio. Detalle: ${error.message}`
        : 'Error al actualizar el servicio';
    return NextResponse.json({ success: false, error: 'server_error', message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    await deleteOwnedService(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('DELETE /api/services/[id] error:', error);
    const message =
      error instanceof Error && error.message
        ? `Error al eliminar el servicio. Detalle: ${error.message}`
        : 'Error al eliminar el servicio';
    return NextResponse.json({ success: false, error: 'server_error', message }, { status: 500 });
  }
}
