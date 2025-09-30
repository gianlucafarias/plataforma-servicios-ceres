import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();
    const { schedule } = body;

    // Actualizar solo los horarios del profesional
    const updatedProfessional = await prisma.professional.update({
      where: { userId: session.user.id },
      data: {
        schedule: schedule || null,
        updatedAt: new Date()
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, verified: true, birthDate: true, location: true } },
        services: {
          include: {
            category: { select: { name: true } },
          }
        },
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProfessional,
      message: 'Horarios actualizados correctamente'
    });

  } catch (error) {
    console.error('Error actualizando horarios:', error);
    
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
