"use client";

import { useEffect } from "react";

interface ProfileViewTrackerProps {
  professionalId: string;
}

// Componente ligero que registra una visita al perfil de forma throttled
// usando localStorage para no pegarle a la API en cada render/refresh.
export function ProfileViewTracker({ professionalId }: ProfileViewTrackerProps) {
  useEffect(() => {
    if (!professionalId) return;

    const storageKey = `profile_view_${professionalId}`;
    const now = Date.now();

    try {
      const last = localStorage.getItem(storageKey);
      if (last) {
        const lastTs = parseInt(last, 10);
        // Solo registrar una visita nueva si pasaron al menos 6 horas
        const sixHours = 6 * 60 * 60 * 1000;
        if (!Number.isNaN(lastTs) && now - lastTs < sixHours) {
          return;
        }
      }
    } catch {
      // Si localStorage falla, seguimos igual pero sin throttle
    }

    fetch(`/api/professional/${professionalId}/view`, {
      method: "POST",
    }).catch(() => {
      // fallo silencioso; no rompemos la UI
    });

    try {
      localStorage.setItem(storageKey, String(now));
    } catch {
      // ignorar errores de storage
    }
  }, [professionalId]);

  return null;
}

