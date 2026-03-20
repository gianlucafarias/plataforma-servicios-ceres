import { prisma } from '@/lib/prisma';

export const CATEGORIES_LIST_RATE_LIMIT = {
  limit: 60,
  windowMs: 5 * 60 * 1000,
} as const;

export type PublicCategoryTree = {
  areas: Array<{
    id: string;
    name: string;
    slug: string;
    group: string;
    image: string | null;
    description: string | null;
    active: boolean;
    subcategoryCount: number;
    professionalCount: number;
  }>;
  subcategoriesOficios: Array<{
    id: string;
    name: string;
    slug: string;
    group: string;
    areaId: string | null;
    areaSlug: string | null;
    image: string | null;
    description: string | null;
    active: boolean;
    professionalCount: number;
  }>;
  subcategoriesProfesiones: Array<{
    id: string;
    name: string;
    slug: string;
    group: string;
    areaId: null;
    areaSlug: null;
    image: string | null;
    description: string | null;
    active: boolean;
    professionalCount: number;
  }>;
};

export async function getPublicCategoryTree(): Promise<PublicCategoryTree> {
  const [areas, subcategoriesOficios, subcategoriesProfesiones, serviceCounts, childrenCounts] =
    await Promise.all([
      prisma.category.findMany({
        where: {
          groupId: 'oficios',
          parentCategoryId: null,
          active: true,
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
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: {
          groupId: 'oficios',
          parentCategoryId: { not: null },
          active: true,
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: {
          groupId: 'profesiones',
          active: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.service.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        where: {
          professional: { status: 'active' },
        },
      }),
      prisma.category.groupBy({
        by: ['parentCategoryId'],
        _count: { parentCategoryId: true },
        where: {
          groupId: 'oficios',
          parentCategoryId: { not: null },
          active: true,
        },
      }),
    ]);

  const serviceCountMap = new Map<string, number>();
  serviceCounts.forEach((count) => {
    serviceCountMap.set(count.categoryId, count._count.categoryId);
  });

  const childrenCountMap = new Map<string, number>();
  childrenCounts.forEach((count) => {
    if (count.parentCategoryId) {
      childrenCountMap.set(count.parentCategoryId, count._count.parentCategoryId);
    }
  });

  const normalizedSubcategoriesOficios = subcategoriesOficios.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    group: subcategory.groupId,
    areaId: subcategory.parentCategoryId,
    areaSlug: subcategory.parent?.slug ?? null,
    image: subcategory.backgroundUrl,
    description: subcategory.description,
    active: subcategory.active,
    professionalCount: serviceCountMap.get(subcategory.id) || 0,
  }));

  const normalizedSubcategoriesProfesiones = subcategoriesProfesiones.map((subcategory) => ({
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    group: subcategory.groupId,
    areaId: null,
    areaSlug: null,
    image: subcategory.backgroundUrl,
    description: subcategory.description,
    active: subcategory.active,
    professionalCount: serviceCountMap.get(subcategory.id) || 0,
  }));

  return {
    areas: areas.map((area) => {
      const linkedSubcategories = normalizedSubcategoriesOficios.filter(
        (subcategory) => subcategory.areaSlug === area.slug
      );
      const professionalCount = linkedSubcategories.reduce(
        (sum, subcategory) => sum + subcategory.professionalCount,
        0
      );

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
    subcategoriesOficios: normalizedSubcategoriesOficios,
    subcategoriesProfesiones: normalizedSubcategoriesProfesiones,
  };
}
