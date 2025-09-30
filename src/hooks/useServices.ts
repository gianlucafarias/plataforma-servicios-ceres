'use client';
import { useState, useEffect } from 'react';
import { Service } from '@/types';

type Filters = {
  q?: string;
  grupo?: 'oficios' | 'profesiones';
  categoria?: string; // slug
  location?: string; // filtro por ubicación
  page?: number;
  limit?: number;
};

export function useServices(filters: Filters = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.q) params.set('q', filters.q);
        if (filters.grupo) params.set('grupo', filters.grupo);
        if (filters.categoria) params.set('categoria', filters.categoria);
        if (filters.location) params.set('location', filters.location);
        params.set('limit', String(filters.limit ?? 20));
        params.set('page', String(filters.page ?? 1));

        const res = await fetch(`/api/services?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setServices(json.data);
          setTotal(json.pagination?.total ?? json.data.length);
          setTotalPages(json.pagination?.totalPages ?? 1);
        } else {
          setError(json.message || 'No se pudieron cargar los servicios');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al obtener servicios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.q, filters.grupo, filters.categoria, filters.location, filters.page, filters.limit]);

  return { services, loading, error, total, totalPages };
}