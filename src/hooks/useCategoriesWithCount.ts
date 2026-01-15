'use client';
import { useState, useEffect } from 'react';

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
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        // Obtener todas las categorías desde la API
        const res = await fetch('/api/categories');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          // Agrupar por área y contar profesionales
          const categoriesMap = new Map<string, CategoryWithCount>();
          
          // Procesar áreas (oficios)
          if (data.data?.areas) {
            data.data.areas.forEach((area: { id: string; name: string; slug: string; professionalCount?: number }) => {
              categoriesMap.set(area.slug, {
                id: area.id,
                name: area.name,
                slug: area.slug,
                group: 'oficios',
                professionalCount: area.professionalCount || 0,
                subcategories: [],
              });
            });
          }
          
          // Procesar subcategorías de oficios
          if (data.data?.subcategoriesOficios) {
            data.data.subcategoriesOficios.forEach((sub: { id: string; name: string; slug: string; areaSlug?: string; professionalCount?: number }) => {
              if (!sub.areaSlug) return; // Saltar si no tiene areaSlug
              const areaSlug = sub.areaSlug; // TypeScript ahora sabe que no es undefined
              const category = categoriesMap.get(areaSlug);
              if (category) {
                category.subcategories = category.subcategories || [];
                category.subcategories.push({
                  id: sub.id,
                  name: sub.name,
                  slug: sub.slug,
                  group: 'oficios',
                  areaSlug: areaSlug,
                  professionalCount: sub.professionalCount || 0,
                });
              }
            });
          }
          
          // Agregar profesiones como categoría especial
          if (data.data?.subcategoriesProfesiones && data.data.subcategoriesProfesiones.length > 0) {
            type SubcategoryItem = {
              id: string;
              name: string;
              slug: string;
              group: 'profesiones';
              professionalCount: number;
            };
            
            const subcategories: SubcategoryItem[] = data.data.subcategoriesProfesiones.map((sub: { id: string; name: string; slug: string; professionalCount?: number }) => {
              const count = sub.professionalCount || 0;
              return {
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                group: 'profesiones' as const,
                professionalCount: count,
              };
            });
            
            const profesionesCategory: CategoryWithCount = {
              id: 'profesiones',
              name: 'Profesiones',
              slug: 'profesiones',
              group: 'profesiones',
              professionalCount: subcategories.reduce(
                (sum: number, sub: SubcategoryItem) => sum + sub.professionalCount,
                0
              ),
              subcategories,
            };
            
            categoriesMap.set('profesiones', profesionesCategory);
          }
          
          setCategories(Array.from(categoriesMap.values()));
        } else {
          throw new Error(data.message || 'Error al cargar categorías');
        }
      } catch (e) {
        console.error('Error cargando categorías:', e);
        setError(e instanceof Error ? e.message : 'Error al obtener categorías');
        // En caso de error, establecer array vacío para que la página pueda renderizar
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
}
