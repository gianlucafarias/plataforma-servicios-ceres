import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { getProfessionalStats } from '@/lib/server/professional-dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'unauthorized',
        },
        { status: 401 }
      );
    }

    const stats = await getProfessionalStats(session.user.id);
    if (!stats) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadisticas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
