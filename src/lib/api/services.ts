import type { Service } from '@/types';
import { apiRequest, getErrorMessage, normalizePagination } from '@/lib/api/client';

export type ServiceFilters = {
  q?: string;
  grupo?: 'oficios' | 'profesiones';
  categoria?: string;
  location?: string;
  page?: number;
  limit?: number;
};

export type LoadServicesResult = {
  success: boolean;
  data: Service[];
  total: number;
  totalPages: number;
  message?: string;
};

export type DashboardServicePayload = {
  categorySlug?: string;
  title?: string;
  description?: string;
  priceRange?: string | null;
  available?: boolean;
};

export type ServiceCountsBySlug = Record<string, number>;

export async function loadServices(
  filters: ServiceFilters = {},
  options: { signal?: AbortSignal } = {}
): Promise<LoadServicesResult> {
  try {
    const { data, meta } = await apiRequest<Service[]>('/services', {
      method: 'GET',
      query: {
        q: filters.q,
        grupo: filters.grupo,
        categoria: filters.categoria,
        location: filters.location,
        page: filters.page ?? 1,
        limit: filters.limit ?? 20,
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
      message: getErrorMessage(error, 'No se pudieron cargar los servicios'),
    };
  }
}

export async function getServiceCounts(options: { signal?: AbortSignal } = {}) {
  const { data } = await apiRequest<ServiceCountsBySlug>('/services/stats', {
    method: 'GET',
    signal: options.signal,
  });

  return data;
}

export async function createService(payload: DashboardServicePayload) {
  const { data } = await apiRequest<Service>('/services', {
    method: 'POST',
    json: payload,
  });

  return data;
}

export async function updateService(id: string, payload: DashboardServicePayload) {
  const { data } = await apiRequest<Service>(`/services/${id}`, {
    method: 'PATCH',
    json: payload,
  });

  return data;
}

export async function deleteService(id: string) {
  const { data } = await apiRequest<{ deleted: boolean }>(`/services/${id}`, {
    method: 'DELETE',
  });

  return data;
}

