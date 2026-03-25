import type { Professional } from '@/types';
import { apiRequest, getErrorMessage, normalizePagination } from '@/lib/api/client';

export type ProfessionalFilters = {
  q?: string;
  categoria?: string;
  grupo?: 'oficios' | 'profesiones';
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'recent';
};

export type PublicCategoriesTree = {
  areas: Array<{
    id: string;
    name: string;
    slug: string;
    group: string;
    icon: string | null;
    image: string | null;
    description: string | null;
    active: boolean;
    showOnHome: boolean;
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
    icon: string | null;
    image: string | null;
    description: string | null;
    active: boolean;
    showOnHome: boolean;
    professionalCount: number;
  }>;
  subcategoriesProfesiones: Array<{
    id: string;
    name: string;
    slug: string;
    group: string;
    areaId: null;
    areaSlug: null;
    icon: string | null;
    image: string | null;
    description: string | null;
    active: boolean;
    showOnHome: boolean;
    professionalCount: number;
  }>;
};

type LoadProfessionalsResult = {
  success: boolean;
  data: Professional[];
  total: number;
  totalPages: number;
  message?: string;
};

export async function loadProfessionals(
  filters: ProfessionalFilters = {},
  options: { signal?: AbortSignal } = {}
): Promise<LoadProfessionalsResult> {
  try {
    const { data, meta } = await apiRequest<Professional[]>('/professionals', {
      method: 'GET',
      query: {
        q: filters.q,
        categoria: filters.categoria,
        grupo: filters.grupo,
        location: filters.location,
        page: filters.page ?? 1,
        limit: filters.limit ?? 12,
        sortBy: filters.sortBy ?? 'recent',
      },
      signal: options.signal,
    });

    const pagination = normalizePagination(meta, data.length);
    return {
      success: true,
      data,
      total: pagination.total,
      totalPages: pagination.totalPages,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      total: 0,
      totalPages: 0,
      message: getErrorMessage(error, 'No se pudieron cargar los profesionales'),
    };
  }
}

export async function getPublicCategoriesTree(options: { signal?: AbortSignal } = {}) {
  const { data } = await apiRequest<PublicCategoriesTree>('/categories', {
    method: 'GET',
    signal: options.signal,
  });

  return data;
}

export async function trackProfessionalView(professionalId: string) {
  const { data } = await apiRequest<{ incremented: boolean }>(`/professional/${professionalId}/view`, {
    method: 'POST',
  });

  return data;
}

