import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';
import { normalizeWhatsAppNumber } from '@/lib/whatsapp-normalize';
import {
  professionalDocumentationArgs,
  serializeAdminDocumentation,
} from '@/lib/server/professional-documentation';

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
            updatedAt: true,
            password: true,
            accounts: {
              select: {
                provider: true,
              },
            },
          },
        },
        services: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                groupId: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { services: true, reviews: true, contactRequests: true },
        },
        documentation: professionalDocumentationArgs,
      },
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

    let registrationType: 'email' | 'google' | 'facebook' = 'email';
    if (professional.user.accounts && professional.user.accounts.length > 0) {
      const provider = professional.user.accounts[0]?.provider;
      if (provider === 'google') {
        registrationType = 'google';
      } else if (provider === 'facebook') {
        registrationType = 'facebook';
      }
    }

    const { password, accounts, ...userData } = professional.user;
    void password;
    void accounts;

    const documentation = serializeAdminDocumentation(
      professional.id,
      professional.requiresDocumentation,
      professional.documentation
    );

    const formattedServices = professional.services.map((service) => ({
      id: service.id,
      professionalId: service.professionalId,
      categoryId: service.categoryId,
      title: service.title,
      description: service.description,
      priceRange: service.priceRange,
      available: service.available,
      categoryGroup: service.categoryGroup,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...professional,
        user: userData,
        services: formattedServices,
        registrationType,
        documentationRequired: professional.requiresDocumentation,
        criminalRecordPresent: documentation.criminalRecordPresent,
        hasLaborReferences: documentation.hasLaborReferences,
        documentation,
      },
    });
  } catch (error) {
    console.error('Error obteniendo profesional:', error);
    return NextResponse.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.professional.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'Profesional no encontrado' },
        { status: 404 }
      );
    }

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
        },
      });
    }

    const updated = await prisma.professional.update({
      where: { id },
      data: {
        bio: body.bio,
        experienceYears: body.experienceYears,
        professionalGroup: body.professionalGroup,
        whatsapp: normalizeWhatsAppNumber(body.whatsapp) || null,
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
            category: { select: { name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Profesional actualizado correctamente',
    });
  } catch (error) {
    console.error('Error actualizando profesional:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al actualizar profesional' },
      { status: 500 }
    );
  }
}
