import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  ProfessionalDashboardError,
  updateProfessionalDashboardProfile,
} from '@/lib/server/professional-dashboard';

export async function PUT(request: Request) {
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

    const body = await request.json();
    const updatedProfessional = await updateProfessionalDashboardProfile(session.user.id, {
      schedule: body.schedule ?? null,
    });

    if (!updatedProfessional) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_found',
          message: 'Profesional no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedProfessional,
      message: 'Horarios actualizados correctamente',
    });
  } catch (error) {
    console.error('Error actualizando horarios:', error);

    if (error instanceof ProfessionalDashboardError) {
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.message,
        },
        { status: error.status }
      );
    }

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
