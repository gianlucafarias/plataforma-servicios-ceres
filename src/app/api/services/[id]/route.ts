import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';


import { prisma } from '@/lib/prisma';

async function getSessionUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

async function ensureOwnership(serviceId: string, userId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { professional: { select: { userId: true } } },
  });
  if (!service) return { ok: false, status: 404 as const };
  if (service.professional.userId !== userId) return { ok: false, status: 403 as const };
  return { ok: true, service } as const;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const ownership = await ensureOwnership(id, userId);
    if (!('ok' in ownership) || !ownership.ok) {
      const status = ownership.status === 403 ? 403 : 404;
      return NextResponse.json({ success: false, error: status === 403 ? 'forbidden' : 'not_found' }, { status });
    }

    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    if (typeof body.title === 'string') allowed.title = body.title;
    if (typeof body.description === 'string') allowed.description = body.description;
    if (typeof body.priceRange === 'string') allowed.priceRange = body.priceRange;
    if (typeof body.available === 'boolean') allowed.available = body.available;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ success: false, error: 'no_fields' }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: allowed,
      include: {
        category: { select: { name: true } },
        professional: {
          select: {
            id: true,
            verified: true,
            rating: true,
            reviewCount: true,
            user: { select: { firstName: true, lastName: true, verified: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
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

    const ownership = await ensureOwnership(id, userId);
    if (!('ok' in ownership) || !ownership.ok) {
      const status = ownership.status === 403 ? 403 : 404;
      return NextResponse.json({ success: false, error: status === 403 ? 'forbidden' : 'not_found' }, { status });
    }

    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/services/[id] error:', error);
    const message =
      error instanceof Error && error.message
        ? `Error al eliminar el servicio. Detalle: ${error.message}`
        : 'Error al eliminar el servicio';
    return NextResponse.json({ success: false, error: 'server_error', message }, { status: 500 });
  }
}


