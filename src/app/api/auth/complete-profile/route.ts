import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../options';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';
import { downloadAndSaveImage, isExternalOAuthImage } from '@/lib/download-image';

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { professional: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no tenga ya un perfil profesional
    if (user.professional) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes un perfil profesional' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      dni,
      gender,
      birthDate,
      phone,
      location,
      bio,
      experienceYears,
      professionalGroup,
      serviceLocations,
      whatsapp,
      instagram,
      facebook,
      linkedin,
      website,
      portfolio,
      cv,
      picture,
      hasPhysicalStore,
      physicalStoreAddress,
      services
    } = body;

    // Validaciones básicas
    if (!dni || !gender || !birthDate || !phone || !location || !bio || !professionalGroup) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos (DNI, género, fecha de nacimiento, teléfono, localidad, bio y grupo profesional son obligatorios)' },
        { status: 400 }
      );
    }

    // Validar formato de DNI (7-8 dígitos)
    if (!/^\d{7,8}$/.test(dni.trim())) {
      return NextResponse.json(
        { success: false, error: 'El DNI debe tener entre 7 y 8 dígitos' },
        { status: 400 }
      );
    }

    // Validar edad mínima
    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate()) 
        ? age - 1 
        : age;
        
      if (actualAge < 18) {
        return NextResponse.json(
          { success: false, error: 'Debes ser mayor de 18 años para registrarte' },
          { status: 400 }
        );
      }
    }

    if (!services || services.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debes agregar al menos un servicio' },
        { status: 400 }
      );
    }

    // Actualizar usuario y crear perfil profesional
    const result = await prisma.$transaction(async (tx) => {
      // Asegurarse de que el grupo de categorías existe
      const categoryGroupRecord = await tx.categoryGroup.upsert({
        where: { id: professionalGroup },
        update: {},
        create: {
          id: professionalGroup,
          name: professionalGroup === 'oficios' ? 'Oficios' : 'Profesiones',
          slug: professionalGroup,
        },
      });

      // Procesar imagen de perfil: si es externa (OAuth), descargarla y guardarla en R2
      let processedPicture = picture;
      if (picture && isExternalOAuthImage(picture)) {
        try {
          processedPicture = await downloadAndSaveImage(picture);
        } catch (error) {
          console.error('Error al descargar imagen OAuth, usando URL original:', error);
          // Si falla, usar la URL original como fallback
          processedPicture = picture;
        }
      }

      // Actualizar datos del usuario
      await tx.user.update({
        where: { id: user.id },
        data: {
          dni: dni.trim(),
          gender,
          phone,
          birthDate: birthDate ? new Date(birthDate) : null,
          location,
          image: processedPicture || user.image, // Actualizar también la imagen del usuario
          role: 'professional',
          // El usuario sigue verificado si ya lo estaba (OAuth)
        }
      });

      // Crear perfil profesional
      const professional = await tx.professional.create({
        data: {
          userId: user.id,
          bio,
          experienceYears: experienceYears || 0,
          professionalGroup,
          location,
          serviceLocations: serviceLocations || [location],
          whatsapp: normalizeWhatsAppNumber(whatsapp || phone) || null,
          instagram: instagram || null,
          facebook: facebook || null,
          linkedin: linkedin || null,
          website: website || null,
          portfolio: portfolio || null,
          CV: cv || null,
          ProfilePicture: processedPicture || null,
          hasPhysicalStore: hasPhysicalStore || false,
          physicalStoreAddress: hasPhysicalStore ? physicalStoreAddress : null,
          status: 'pending', // Pendiente de verificación
          verified: false,
        }
      });

      // Crear servicios
      for (const service of services) {
        // Buscar la categoría por slug
        const category = await tx.category.findUnique({
          where: { slug: service.categoryId }
        });

        if (category) {
          await tx.service.create({
            data: {
              professionalId: professional.id,
              categoryId: category.id,
              categoryGroup: professionalGroup,
              title: service.title || category.name,
              description: service.description,
              available: true
            }
          });
        } else {
          // Si la categoría no existe, crear una básica
          console.warn(`Categoría no encontrada para slug: ${service.categoryId}, creando automáticamente`);
          const fallbackName = String(service.categoryId)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (m: string) => m.toUpperCase());
          
          const newCategory = await tx.category.create({
            data: {
              name: fallbackName,
              description: '',
              slug: service.categoryId,
              active: true,
              groupId: categoryGroupRecord.id, // Usar el ID del grupo que acabamos de crear/obtener
            }
          });
          
          await tx.service.create({
            data: {
              professionalId: professional.id,
              categoryId: newCategory.id,
              categoryGroup: professionalGroup,
              title: service.title || newCategory.name,
              description: service.description,
              available: true
            }
          });
        }
      }

      return professional;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Perfil profesional creado exitosamente'
    });

  } catch (error) {
    // Log detallado para debugging en producción
    console.error('Error en complete-profile:', error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    
    // Determinar si es un error de validación o del servidor
    const isValidationError = message.toLowerCase().includes('required') || 
                               message.toLowerCase().includes('invalid') ||
                               message.toLowerCase().includes('not found');
    
    return NextResponse.json(
      { 
        success: false, 
        error: isValidationError ? message : `Error al completar el perfil. Detalle: ${message}` 
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
