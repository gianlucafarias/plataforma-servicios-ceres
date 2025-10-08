'use client';
import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { loadServices } from './loadServices';

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
  const { q, grupo, categoria, location, page, limit } = filters;

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loadServices({ q, grupo, categoria, location, page, limit });
        if (result.success) {
          setServices(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        } else {
          setError(result.message || 'No se pudieron cargar los servicios');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al obtener servicios');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q, grupo, categoria, location, page, limit]);

  return { services, loading, error, total, totalPages };
}