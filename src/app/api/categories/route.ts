import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
            children: true
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
            professional: {
              status: 'active'
            }
          }
        });
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          group: sub.groupId,
          areaId: sub.parentCategoryId,
          areaSlug: sub.parent?.slug,
          image: sub.backgroundUrl,
          description: sub.description,
          active: sub.active,
          professionalCount: count,
        };
      })
    );

    const subcatProfesionesWithCount = await Promise.all(
      subcatProfesiones.map(async (sub) => {
        const count = await prisma.service.count({
          where: {
            categoryId: sub.id,
            professional: {
              status: 'active'
            }
          }
        });
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          group: sub.groupId,
          areaId: null,
          areaSlug: null,
          image: sub.backgroundUrl,
          description: sub.description,
          active: sub.active,
          professionalCount: count,
        };
      })
    );

    const data = {
      areas: areas.map(area => ({
        id: area.id,
        name: area.name,
        slug: area.slug,
        group: area.groupId,
        image: area.backgroundUrl,
        description: area.description,
        active: area.active,
        subcategoryCount: area._count.children,
        professionalCount: 0, // Se calculará sumando las subcategorías
      })),
      subcategoriesOficios: subcatOficiosWithCount,
      subcategoriesProfesiones: subcatProfesionesWithCount,
    };

    // Calcular contadores de profesionales por área
    data.areas.forEach(area => {
      const subcats = data.subcategoriesOficios.filter(sub => sub.areaSlug === area.slug);
      area.professionalCount = subcats.reduce((sum, sub) => sum + sub.professionalCount, 0);
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}
