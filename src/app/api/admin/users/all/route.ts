import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiKey } from '@/lib/auth-helpers';

/**
 * GET /api/admin/users/all
 * Devuelve todos los usuarios sin paginación ni filtros
 * Requiere API Key de admin
 */
export async function GET(request: NextRequest) {
  const { error } = requireAdminApiKey(request);
  if (error) return error;

  try {
    const users = await prisma.user.findMany({
      where: {
        professional: {
          status: 'active' // Solo usuarios con perfil profesional aprobado
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        role: true,
        verified: true,
        emailVerifiedAt: true,
        birthDate: true,
        location: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contactRequests: true,
            reviews: true,
          }
        },
        professional: {
          select: {
            id: true,
            bio: true,
            experienceYears: true,
            status: true,
            verified: true,
            rating: true,
            reviewCount: true,
            professionalGroup: true,
            specialties: true,
            location: true,
            serviceLocations: true,
            whatsapp: true,
            instagram: true,
            facebook: true,
            linkedin: true,
            website: true,
            portfolio: true,
            ProfilePicture: true,
            hasPhysicalStore: true,
            physicalStoreAddress: true,
            schedule: true,
            services: {
              select: {
                id: true,
                title: true,
                description: true,
                priceRange: true,
                available: true,
                createdAt: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    groupId: true,
                    parentCategoryId: true,
                    parent: {
                      select: {
                        id: true,
                        name: true,
                        slug: true
                      }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            _count: {
              select: {
                services: true,
                reviews: true,
                contactRequests: true
              }
            }
          }
        }
      },
    });

    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: u.name,
      phone: u.phone,
      role: u.role,
      verified: u.verified,
      emailVerifiedAt: u.emailVerifiedAt,
      birthDate: u.birthDate,
      location: u.location,
      image: u.image,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      professional: u.professional ? {
        id: u.professional.id,
        bio: u.professional.bio,
        experienceYears: u.professional.experienceYears,
        status: u.professional.status,
        verified: u.professional.verified,
        rating: u.professional.rating,
        reviewCount: u.professional.reviewCount,
        grupo: u.professional.professionalGroup, // oficios o profesiones
        especialidades: u.professional.specialties,
        ubicacion: u.professional.location,
        ubicacionesServicio: u.professional.serviceLocations,
        whatsapp: u.professional.whatsapp,
        instagram: u.professional.instagram,
        facebook: u.professional.facebook,
        linkedin: u.professional.linkedin,
        website: u.professional.website,
        portfolio: u.professional.portfolio,
        fotoPerfil: u.professional.ProfilePicture,
        tieneTiendaFisica: u.professional.hasPhysicalStore,
        direccionTienda: u.professional.physicalStoreAddress,
        horarios: u.professional.schedule,
        servicios: u.professional.services.map(s => ({
          id: s.id,
          titulo: s.title,
          descripcion: s.description,
          rangoPrecio: s.priceRange,
          disponible: s.available,
          fechaCreacion: s.createdAt,
          categoria: {
            id: s.category.id,
            nombre: s.category.name,
            slug: s.category.slug,
            grupo: s.category.groupId,
            areaId: s.category.parentCategoryId,
            area: s.category.parent ? {
              id: s.category.parent.id,
              nombre: s.category.parent.name,
              slug: s.category.parent.slug
            } : null
          }
        })),
        estadisticas: {
          totalServicios: u.professional._count.services,
          totalResenas: u.professional._count.reviews,
          totalContactos: u.professional._count.contactRequests
        }
      } : null,
      stats: {
        contactRequests: u._count.contactRequests,
        reviews: u._count.reviews,
        hasProfessional: u.professional !== null,
      }
    }));

    return NextResponse.json({
      success: true,
      total: data.length,
      data
    });
  } catch (error) {
    console.error('Error obteniendo todos los usuarios (admin):', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
