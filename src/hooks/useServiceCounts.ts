'use client';

import { useState, useEffect } from 'react';

export type ServiceCountsBySlug = Record<string, number>;

export function useServiceCounts() {
  const [counts, setCounts] = useState<ServiceCountsBySlug>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/services/stats');
        const json = await res.json();
        if (!cancelled && json.success) {
          setCounts(json.data ?? {});
        } else if (!cancelled && !json.success) {
          setError(json.error || 'No se pudieron obtener las estadísticas');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al obtener estadísticas');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return { counts, loading, error };
}

