'use client';

import { Professional } from '@/types';
import { useState, useEffect } from 'react';

type Filters = {
  q?: string;
  categoria?: string; // slug
  grupo?: 'oficios' | 'profesiones';
  location?: string; // filtro por ubicacion
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'recent';
};

export function useProfessionals(filters: Filters = {}) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.q) params.set('q', filters.q);
        if (filters.categoria) params.set('categoria', filters.categoria);
        if (filters.grupo) params.set('grupo', filters.grupo);
        if (filters.location) params.set('location', filters.location);
        params.set('limit', String(filters.limit ?? 12));
        params.set('page', String(filters.page ?? 1));
        params.set('sortBy', String(filters.sortBy ?? 'recent'));

        const res = await fetch(`/api/professionals?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (json.success) {
          setProfessionals(json.data);
          setTotal(json.pagination?.total ?? json.data.length);
          setTotalPages(json.pagination?.totalPages ?? 1);
        } else {
          setError(json.message || 'No se pudieron cargar los profesionales');
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Error al obtener profesionales');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      controller.abort();
    };
  }, [filters.q, filters.categoria, filters.grupo, filters.location, filters.page, filters.limit, filters.sortBy]);

  return { professionals, loading, error, total, totalPages };
}
