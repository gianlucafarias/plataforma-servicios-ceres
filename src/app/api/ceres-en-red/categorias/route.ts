import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/ceres-en-red/categorias
 * Endpoint para obtener áreas y subcategorías para el bot de WhatsApp (Ceresito)
 * 
 * Devuelve una estructura simplificada con áreas y sus subcategorías,
 * además de subcategorías de profesiones
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener áreas (solo oficios, sin padre)
    const areas = await prisma.category.findMany({
      where: { 
        groupId: 'oficios', 
        parentCategoryId: null,
        active: true
      },
      include: {
        _count: { 
          select: { 
            children: true,
            services: true
          } 
        }
      },
      orderBy: { name: 'asc' }
    });

    // Subcategorías de oficios (con padre)
    const subcatOficios = await prisma.category.findMany({
      where: { 
        groupId: 'oficios', 
        parentCategoryId: { not: null },
        active: true
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Subcategorías de profesiones (sin padre)
    const subcatProfesiones = await prisma.category.findMany({
      where: { 
        groupId: 'profesiones',
        active: true
      },
      orderBy: { name: 'asc' }
    });

    // Calcular conteos de servicios con profesionales activos para cada subcategoría
    const subcatOficiosWithCount = await Promise.all(
      subcatOficios.map(async (sub) => {
        const count = await prisma.service.count({
          where: {
            categoryId: sub.id,
            available: true,
            professional: {
              status: 'active'
            }
          }
        });
        return {
          id: sub.id,
          nombre: sub.name,
          slug: sub.slug,
          areaId: sub.parentCategoryId,
          areaSlug: sub.parent?.slug,
          areaNombre: sub.parent?.name,
          profesionales: count,
        };
      })
    );

    const subcatProfesionesWithCount = await Promise.all(
      subcatProfesiones.map(async (sub) => {
        const count = await prisma.service.count({
          where: {
            categoryId: sub.id,
            available: true,
            professional: {
              status: 'active'
            }
          }
        });
        return {
          id: sub.id,
          nombre: sub.name,
          slug: sub.slug,
          profesionales: count,
        };
      })
    );

    // Organizar áreas con sus subcategorías
    const areasConSubcategorias = areas.map(area => {
      const subcategorias = subcatOficiosWithCount
        .filter(sub => sub.areaSlug === area.slug)
        .map(sub => ({
          id: sub.id,
          nombre: sub.nombre,
          slug: sub.slug,
          profesionales: sub.profesionales,
        }));

      // Calcular total de profesionales en el área
      const totalProfesionales = subcategorias.reduce((sum, sub) => sum + sub.profesionales, 0);

      return {
        id: area.id,
        nombre: area.name,
        slug: area.slug,
        subcategorias,
        totalProfesionales,
        totalSubcategorias: subcategorias.length,
      };
    });

    // Formatear respuesta
    const data = {
      oficios: {
        areas: areasConSubcategorias,
        totalAreas: areasConSubcategorias.length,
        totalSubcategorias: subcatOficiosWithCount.length,
        totalProfesionales: areasConSubcategorias.reduce((sum, area) => sum + area.totalProfesionales, 0),
      },
      profesiones: {
        subcategorias: subcatProfesionesWithCount.map(sub => ({
          id: sub.id,
          nombre: sub.nombre,
          slug: sub.slug,
          profesionales: sub.profesionales,
        })),
        totalSubcategorias: subcatProfesionesWithCount.length,
        totalProfesionales: subcatProfesionesWithCount.reduce((sum, sub) => sum + sub.profesionales, 0),
      },
    };

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error obteniendo categorías (ceres-en-red):', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener categorías',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
