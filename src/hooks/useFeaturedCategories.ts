import { useServices } from "./useServices";
import { useMemo } from "react";
import { Service } from "@/types";


export function useFeaturedServices(limit = 6) {
    const { services, loading, error } = useServices({ grupo: 'oficios', limit: 50 });
    const featured = useMemo(() => {
      const seen = new Set<string>();
      const dedup: Service[] = [];
      for (const s of services) {
        if (!seen.has(s.professional?.id || '')) {
          seen.add(s.professional?.id || '');
          dedup.push(s);
        }
      }
      for (let i = dedup.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dedup[i], dedup[j]] = [dedup[j], dedup[i]];
      }
      return dedup.slice(0, limit);
    }, [services, limit]);
    return { services: featured, loading, error };
  }