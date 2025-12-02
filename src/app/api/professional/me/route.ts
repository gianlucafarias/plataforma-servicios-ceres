import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized'
      }, { status: 401 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, verified: true, birthDate: true, location: true } },
        services: {
          include: {
            category: { select: { name: true } },
          }
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: professional
    });
  } catch (error) {
    console.error('Error en /api/professional/me:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'server_error',
      message: 'Error al obtener perfil profesional'
    }, { status: 500 });
  }
}

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
    const {
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      location,
      bio,
      experienceYears,
      specialty,
      professionalGroup,
      whatsapp,
      instagram,
      facebook,
      linkedin,
      website,
      portfolio,
      cv,
      picture,
      serviceLocations,
      schedule
    } = body;

    // Validaciones básicas
    if (!firstName || !lastName || !email) {
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: 'Nombre, apellido y email son obligatorios'
      }, { status: 400 });
    }

    // Actualizar datos del usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        location,
        updatedAt: new Date()
      }
    });

    // Actualizar datos del profesional
    const updatedProfessional = await prisma.professional.update({
      where: { userId: session.user.id },
      data: {
        bio,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        specialties: specialty ? [specialty] : [], // Convertir string a array
        professionalGroup: professionalGroup || null,
        whatsapp,
        instagram,
        facebook,
        linkedin,
        website,
        portfolio,
        CV: cv,
        ProfilePicture: picture,
        serviceLocations: serviceLocations || [],
        schedule: schedule || null, // Guardar horarios como JSON
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
      message: 'Perfil actualizado correctamente'
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    
    // Manejo de errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          success: false,
          error: 'validation_error',
          message: 'El email ya está en uso por otro usuario'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}