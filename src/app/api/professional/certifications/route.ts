import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import {
  ProfessionalDashboardError,
  createProfessionalCertification,
  listProfessionalCertifications,
} from '@/lib/server/professional-dashboard';

// GET: Obtener certificaciones del profesional actual
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

    const certifications = await listProfessionalCertifications(session.user.id);
    if (!certifications) {
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
      data: certifications,
    });
  } catch (error) {
    console.error('Error obteniendo certificaciones:', error);
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

// POST: Crear nueva certificacion
export async function POST(request: NextRequest) {
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

    const certification = await createProfessionalCertification(
      session.user.id,
      await request.json()
    );

    if (!certification) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_found',
          message: 'Profesional no encontrado',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: certification,
        message: 'Certificacion enviada para revision',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creando certificacion:', error);

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
