'use client';

import { useState, useEffect } from 'react';
import type { Professional } from '@/types';
import { loadProfessionals } from '@/lib/api/professionals';

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
        const result = await loadProfessionals(filters, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (result.success) {
          setProfessionals(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        } else {
          setError(result.message || 'No se pudieron cargar los profesionales');
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
