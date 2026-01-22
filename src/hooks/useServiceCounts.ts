'use client';

import { useState, useEffect } from 'react';

export type ServiceCountsBySlug = Record<string, number>;

export function useServiceCounts() {
  const [counts, setCounts] = useState<ServiceCountsBySlug>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/services/stats', {
          signal: controller.signal,
        });
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (json.success) {
          setCounts(json.data ?? {});
        } else {
          setError(json.error || 'No se pudieron obtener las estadisticas');
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Error al obtener estadisticas');
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
  }, []);

  return { counts, loading, error };
}
