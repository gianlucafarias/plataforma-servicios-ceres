'use client';
import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { loadServices } from './loadServices';

type Filters = {
  q?: string;
  grupo?: 'oficios' | 'profesiones';
  categoria?: string; // slug
  location?: string; // filtro por ubicacion
  page?: number;
  limit?: number;
  enabled?: boolean; // permite controlar si debe ejecutar la carga
};

export function useServices(filters: Filters = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { q, grupo, categoria, location, page, limit, enabled } = filters;

  useEffect(() => {
    // Si explicitamente nos piden no ejecutar, salimos
    if (enabled === false) {
      setServices([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await loadServices(
          { q, grupo, categoria, location, page, limit },
          { signal: controller.signal }
        );
        if (result.success) {
          setServices(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        } else {
          setError(result.message || 'No se pudieron cargar los servicios');
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Error al obtener servicios');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    run();

    return () => {
      controller.abort();
    };
  }, [q, grupo, categoria, location, page, limit, enabled]);

  return { services, loading, error, total, totalPages };
}
