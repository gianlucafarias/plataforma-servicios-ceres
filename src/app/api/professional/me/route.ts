import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session en /api/professional/me:', session);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'unauthorized',
        debug: { session }
      }, { status: 401 });
    }

    const professional = await prisma.professional.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        bio: true,
        experienceYears: true,
        verified: true,
        rating: true,
        reviewCount: true,
        specialties: true,
        professionalGroup: true,
        whatsapp: true,
        instagram: true,
        facebook: true,
        linkedin: true,
        website: true,
        portfolio: true,
        CV: true,
        ProfilePicture: true,
        location: true,
        serviceLocations: true,
        hasPhysicalStore: true,
        physicalStoreAddress: true,
        schedule: true,
        user: { 
          select: { 
            firstName: true, 
            lastName: true, 
            email: true, 
            phone: true, 
            verified: true, 
            birthDate: true, 
            location: true,
            password: true, // Para determinar si tiene password
            accounts: {
              select: {
                provider: true
              }
            }
          } 
        },
        services: {
          include: {
            category: { select: { name: true } },
          }
        },
      },
    });

    console.log('Professional encontrado:', professional);

    if (!professional) {
      return NextResponse.json({ 
        success: false, 
        error: 'not_found',
        message: 'Profesional no encontrado'
      }, { status: 404 });
    }

    // Determinar tipo de registro
    let registrationType: 'email' | 'google' | 'facebook' = 'email';
    if (professional.user.accounts && professional.user.accounts.length > 0) {
      // Si tiene cuentas OAuth, usar la primera
      const provider = professional.user.accounts[0]?.provider;
      if (provider === 'google') {
        registrationType = 'google';
      } else if (provider === 'facebook') {
        registrationType = 'facebook';
      }
    }

    // Remover password y accounts de la respuesta por seguridad
    const { ...userData } = professional.user;

    // Serializar birthDate correctamente si existe
    const serializedUserData = {
      ...userData,
      birthDate: userData.birthDate ? userData.birthDate.toISOString() : null,
    };

    return NextResponse.json({ 
      success: true, 
      data: {
        ...professional,
        user: serializedUserData,
        registrationType
      },
      debug: { userId: session.user.id }
    });
  } catch (error) {
    console.error('Error en /api/professional/me:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'server_error',
      message: error instanceof Error ? error.message : 'Error desconocido'
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
      hasPhysicalStore,
      physicalStoreAddress,
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
        whatsapp: normalizeWhatsAppNumber(whatsapp) || null,
        instagram,
        facebook,
        linkedin,
        website,
        portfolio,
        CV: cv,
        ProfilePicture: picture,
        serviceLocations: serviceLocations || [],
        hasPhysicalStore: hasPhysicalStore || false,
        physicalStoreAddress: hasPhysicalStore ? physicalStoreAddress : null,
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