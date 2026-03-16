import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [areas, subcatOficios, subcatProfesiones, counts, childrenCount] = await Promise.all([
      prisma.category.findMany({
        where: { 
          groupId: 'oficios', 
          parentCategoryId: null,
          active: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          groupId: true,
          backgroundUrl: true,
          description: true,
          active: true,
        },
        orderBy: { name: 'asc' }
      }),
      prisma.category.findMany({
        where: { 
          groupId: 'oficios', 
          parentCategoryId: { not: null },
          active: true
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.category.findMany({
        where: { 
          groupId: 'profesiones',
          active: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.service.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        where: { professional: { status: 'active' } }
      }),
      prisma.category.groupBy({
        by: ['parentCategoryId'],
        _count: { parentCategoryId: true },
        where: { groupId: 'oficios', parentCategoryId: { not: null }, active: true }
      })
    ]);

    const serviceCountMap = new Map<string, number>();
    counts.forEach((c) => serviceCountMap.set(c.categoryId, c._count.categoryId));

    const childrenCountMap = new Map<string, number>();
    childrenCount.forEach((c) => {
      if (c.parentCategoryId) {
        childrenCountMap.set(c.parentCategoryId, c._count.parentCategoryId);
      }
    });

    const subcatOficiosWithCount = subcatOficios.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      group: sub.groupId,
      areaId: sub.parentCategoryId,
      areaSlug: sub.parent?.slug,
      image: sub.backgroundUrl,
      description: sub.description,
      active: sub.active,
      professionalCount: serviceCountMap.get(sub.id) || 0,
    }));

    const subcatProfesionesWithCount = subcatProfesiones.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      group: sub.groupId,
      areaId: null,
      areaSlug: null,
      image: sub.backgroundUrl,
      description: sub.description,
      active: sub.active,
      professionalCount: serviceCountMap.get(sub.id) || 0,
    }));

    const data = {
      areas: areas.map(area => {
        const subcats = subcatOficiosWithCount.filter(sub => sub.areaSlug === area.slug);
        const professionalCount = subcats.reduce((sum, sub) => sum + sub.professionalCount, 0);
        return {
          id: area.id,
          name: area.name,
          slug: area.slug,
          group: area.groupId,
          image: area.backgroundUrl,
          description: area.description,
          active: area.active,
          subcategoryCount: childrenCountMap.get(area.id) || 0,
          professionalCount,
        };
      }),
      subcategoriesOficios: subcatOficiosWithCount,
      subcategoriesProfesiones: subcatProfesionesWithCount,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return NextResponse.json(
      { success: false, error: 'server_error', message: 'Error al obtener categorías' },
      { status: 500 }
    );
  }
}

