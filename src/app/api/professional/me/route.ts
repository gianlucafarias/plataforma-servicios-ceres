import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  ProfessionalDashboardError,
  getProfessionalDashboardProfile,
  updateProfessionalDashboardProfile,
} from '@/lib/server/professional-dashboard';

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

    const profile = await getProfessionalDashboardProfile(session.user.id);
    if (!profile) {
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
      data: profile,
    });
  } catch (error) {
    console.error('Error en /api/professional/me:', error);
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

    const updatedProfile = await updateProfessionalDashboardProfile(
      session.user.id,
      await request.json()
    );

    if (!updatedProfile) {
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
      data: updatedProfile,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);

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

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'validation_error',
          message: 'El email ya esta en uso por otro usuario',
        },
        { status: 400 }
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
