'use client';

import { useState, useEffect } from 'react';
import { getErrorMessage } from '@/lib/api/client';
import { getServiceCounts } from '@/lib/api/services';

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
        const countsBySlug = await getServiceCounts({ signal: controller.signal });
        if (controller.signal.aborted) return;

        setCounts(countsBySlug ?? {});
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(e, 'Error al obtener estadisticas'));
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

