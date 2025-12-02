import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

// GET: Obtener detalles completos de un profesional
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    
    const professional = await prisma.professional.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            birthDate: true,
            location: true,
            verified: true,
            createdAt: true,
            updatedAt: true
          }
        },
        services: {
          include: {
            category: { select: { name: true, slug: true } }
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        },
        _count: {
          select: { services: true, reviews: true, contactRequests: true }
        }
      },
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: professional });
  } catch (error) {
    console.error('Error obteniendo profesional:', error);
    return NextResponse.json(
      { success: false, error: 'server_error' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar información del profesional
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    // Verificar que el profesional existe
    const existing = await prisma.professional.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar usuario si se proporcionan datos
    if (body.user) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          firstName: body.user.firstName,
          lastName: body.user.lastName,
          email: body.user.email,
          phone: body.user.phone,
          birthDate: body.user.birthDate ? new Date(body.user.birthDate) : undefined,
          location: body.user.location,
        }
      });
    }

    // Actualizar profesional
    const updated = await prisma.professional.update({
      where: { id },
      data: {
        bio: body.bio,
        experienceYears: body.experienceYears,
        professionalGroup: body.professionalGroup,
        whatsapp: body.whatsapp,
        instagram: body.instagram,
        facebook: body.facebook,
        linkedin: body.linkedin,
        website: body.website,
        portfolio: body.portfolio,
        location: body.location,
        serviceLocations: body.serviceLocations,
        specialties: body.specialties,
        schedule: body.schedule,
        verified: body.verified,
      },
      include: {
        user: true,
        services: {
          include: {
            category: { select: { name: true, slug: true } }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Profesional actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando profesional:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar profesional' },
      { status: 500 }
    );
  }
}