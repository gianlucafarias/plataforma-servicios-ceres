"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import Link from "next/link";
import WhatsAppIcon from "../ui/whatsapp";
import Image from "next/image";
import { useMemo, memo } from "react";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { ProfessionalAvatar } from "./ProfessionalAvatar";

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

  return (
    <Card className="group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100/50 transition-all duration-300 rounded-2xl border border-gray-100 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <ProfessionalAvatar
              name={professional.user.name}
              profilePicture={professional.ProfilePicture || undefined}
              className="h-12 w-12 flex-shrink-0 ring-2 ring-white shadow-sm"
            />
            <div>
            <div className="flex items-center space-x-1">

              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-[var(--gov-green)] transition-colors">{professional.user.name}</h3>
               
                {professional.verified && (
                 <Image src="/verificado.png" alt="Verified" width={16} height={16} className="ml-1"/>
                )}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-100 font-normal px-3">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="capitalize">{professional.location ?? 'Ceres'}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="min-h-[2.5rem] flex items-start">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {displayBio}
          </p>
        </div>

        <div className="min-h-[1.5rem] flex flex-wrap gap-1.5">
          {serviceBadges.visible.map((label, index) => (
            <Badge key={index} variant="outline" className="text-xs rounded-full border-gray-200 text-gray-600 bg-transparent px-3 py-0.5 font-normal hover:border-[var(--gov-green)]/30 hover:bg-green-50/30 transition-colors">
              {label}
            </Badge>
          ))}
          {serviceBadges.remaining > 0 && (
            <Badge variant="outline" className="text-xs rounded-full border-gray-200 text-gray-500 px-2 font-normal">
              +{serviceBadges.remaining}
            </Badge>
          )}
        </div>

        <div className="min-h-[3rem] flex items-center justify-between pt-2 gap-2 sm:gap-3 border-t border-gray-50 mt-2">
          <div className="flex items-center">
            <AvailabilityBadge 
              schedule={professional.schedule} 
              variant="compact"
              showIcon={true}
              showReason={true}
            />
          </div>
          
          <div className="flex flex-wrap justify-end gap-2 sm:gap-2">
            <Link 
              href={`/profesionales/${professional.id}`}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all duration-200 flex items-center shadow-sm"
            >
              Ver Perfil
            </Link>
            <a
              href={`${WHATSAPP_BASE}${WHATSAPP_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] hover:bg-[#20BD5C] text-white px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 flex items-center shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="h-4 w-4 " />
              
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Exportar con React.memo para evitar re-renders innecesarios
export const ServiceCard = memo(ServiceCardComponent);
