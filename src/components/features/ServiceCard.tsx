"use client";
import { MapPin } from "lucide-react";
import Link from "next/link";
import WhatsAppIcon from "../ui/whatsapp";
import Image from "next/image";
import { useMemo, memo } from "react";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { LOCATIONS } from "@/lib/taxonomy";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    priceRange: string;
    professional: {
      id: string;
      location?: string | null;
      user: {
        name: string;
        location?: string | null;
      };
      rating: number;
      reviewCount: number;
      verified: boolean;
      ProfilePicture?: string | null;
      bio?: string;
      services?: {
        id: string;
        title: string;
        category?: {
          name: string;
        };
      }[];
      schedule?: Record<string, unknown>;
    };
    category: {
      name: string;
      services?: {
        name: string;
      }[];
    };
  };
}

// Constante para WhatsApp (evita recrear string en cada render)
const WHATSAPP_MESSAGE = encodeURIComponent("Hola, vi tu perfil en Servicios Ceres y me interesa contactarte.");
const WHATSAPP_BASE = "https://wa.me/+5403491456789?text=";

function ServiceCardComponent({ service }: ServiceCardProps) {
  const { professional } = service;

  const formattedLocation = useMemo(() => {
    const raw =
      professional.location ||
      professional.user.location ||
      "Ceres, Santa Fe, Argentina";

    // Si no tiene coma, asumimos que es un ID y lo buscamos en LOCATIONS
    if (!raw.includes(",")) {
      const found = LOCATIONS.find((l) => l.id === raw);
      return found?.name || raw.charAt(0).toUpperCase() + raw.slice(1);
    }

    // Si ya viene como nombre completo, lo mostramos tal cual
    return raw;
  }, [professional.location, professional.user.location]);

  // Memoizar cálculo de badges de servicios
  const serviceBadges = useMemo(() => {
    const fromProp = Array.isArray(professional.services) && professional.services.length > 0
      ? professional.services.map(s => s.title).filter(Boolean)
      : [];
    const fallbackFromCategory = (service.category.services ?? []).map(cs => cs.name);
    const items = fromProp.length > 0 ? fromProp : fallbackFromCategory;
    const visible = items.slice(0, 3);
    const remaining = Math.max(items.length - 3, 0);
    return { visible, remaining };
  }, [professional.services, service.category.services]);

  // Usar bio del professional si viene, sino description del service
  const displayBio = professional.bio || service.description;

  // Generar color de avatar basado en el nombre
  const avatarColor = useMemo(() => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-orange-100 text-orange-600',
      'bg-purple-100 text-purple-600',
      'bg-teal-100 text-teal-600',
      'bg-green-100 text-green-600',
      'bg-pink-100 text-pink-600',
    ];
    const index = professional.user.name.charCodeAt(0) % colors.length;
    return colors[index];
  }, [professional.user.name]);

  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-soft hover:shadow-soft-hover transition-all border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-lg`}>
            {professional.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-gray-900 dark:text-white">{professional.user.name}</h4>
              {professional.verified && (
                <Image src="/verificado.png" alt="Verified" width={16} height={16} className="text-blue-500" />
              )}
            </div>
            <p className="text-sm text-primary font-medium">{service.category.name}</p>
          </div>
        </div>
        <span className="flex items-center text-xs text-gray-400 gap-1">
          <MapPin className="text-sm" />
          {formattedLocation}
        </span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-2">
        {displayBio}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <AvailabilityBadge 
          schedule={professional.schedule} 
          variant="compact"
          showIcon={true}
          showReason={true}
        />
        <div className="flex gap-2">
          <Link 
            href={`/profesionales/${professional.id}`}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Ver Perfil
          </Link>
          <a
            href={`${WHATSAPP_BASE}${WHATSAPP_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md transition-colors"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

// Exportar con React.memo para evitar re-renders innecesarios
export const ServiceCard = memo(ServiceCardComponent);
