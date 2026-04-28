"use client";

import { useEffect } from "react";
import { trackProfessionalView } from "@/lib/api/professionals";
import { trackEvent } from "@/lib/analytics/gtag";

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

    trackProfessionalView(professionalId).catch(() => {
      // fallo silencioso; no rompemos la UI
    });
    trackEvent("view_item", {
      professional_id: professionalId,
      category: "unknown",
    });

    try {
      localStorage.setItem(storageKey, String(now));
    } catch {
      // ignorar errores de storage
    }
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href") ?? "";
      if (!href) {
        return;
      }

      const isWhatsApp =
        href.startsWith("https://wa.me/") ||
        href.includes("api.whatsapp.com") ||
        href.startsWith("whatsapp://");
      const isPhone = href.startsWith("tel:");

      if (!isWhatsApp && !isPhone) {
        return;
      }

      trackEvent("generate_lead", {
        professional_id: professionalId,
        channel: isWhatsApp ? "whatsapp" : "phone",
      });
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [professionalId]);

  return null;
}


