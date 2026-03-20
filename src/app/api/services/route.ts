import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  ServiceFlowError,
  createServiceForUser,
  listPublicServices,
} from '@/lib/server/services';

export async function GET(request: NextRequest) {
  try {
    const result = await listPublicServices(request.url);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('List services error:', error);

    const baseMessage = 'Error al obtener servicios';
    const detailed =
      error instanceof Error && error.message
        ? `${baseMessage}. Detalle: ${error.message}`
        : baseMessage;

    return NextResponse.json(
      { success: false, error: 'fetch_failed', message: detailed },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const created = await createServiceForUser(session.user.id, body);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ServiceFlowError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }

    console.error('POST /api/services error:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
