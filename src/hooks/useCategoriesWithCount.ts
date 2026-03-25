'use client';

import { useMemo } from 'react';
import { usePublicCategoriesTree } from '@/hooks/usePublicCategoriesTree';

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  group: 'oficios' | 'profesiones';
  areaSlug?: string;
  professionalCount: number;
  subcategories?: SubcategoryWithCount[];
};

export type SubcategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  group: 'oficios' | 'profesiones';
  areaSlug?: string;
  professionalCount: number;
};

export function useCategoriesWithCount() {
  const { data, loading, error } = usePublicCategoriesTree();

  const categories = useMemo(() => {
    const categoriesMap = new Map<string, CategoryWithCount>();

    data.areas.forEach((area) => {
      categoriesMap.set(area.slug, {
        id: area.id,
        name: area.name,
        slug: area.slug,
        group: 'oficios',
        professionalCount: area.professionalCount || 0,
        subcategories: [],
      });
    });

    data.subcategoriesOficios.forEach((sub) => {
      if (!sub.areaSlug) return;

      const category = categoriesMap.get(sub.areaSlug);
      if (!category) return;

      category.subcategories = category.subcategories || [];
      category.subcategories.push({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        group: 'oficios',
        areaSlug: sub.areaSlug,
        professionalCount: sub.professionalCount || 0,
      });
    });

    if (data.subcategoriesProfesiones.length > 0) {
      const subcategories = data.subcategoriesProfesiones.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        group: 'profesiones' as const,
        professionalCount: sub.professionalCount || 0,
      }));

      categoriesMap.set('profesiones', {
        id: 'profesiones',
        name: 'Profesiones',
        slug: 'profesiones',
        group: 'profesiones',
        professionalCount: subcategories.reduce((sum, sub) => sum + sub.professionalCount, 0),
        subcategories,
      });
    }

    return Array.from(categoriesMap.values());
  }, [data]);

  return { categories, loading, error };
}
