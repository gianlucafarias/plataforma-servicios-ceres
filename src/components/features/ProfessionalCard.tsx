import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import WhatsAppIcon from "../ui/whatsapp";
import { Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { LOCATIONS } from "@/lib/taxonomy";
import { buildWhatsAppLink } from "@/lib/whatsapp";


interface ProfessionalCardProps {
  professional: {
    id: string;
    user: { name: string };
    bio: string;
    verified: boolean;
    specialties?: string[];
    primaryCategory?: { name: string };
    location?: string;
    socialNetworks?: {
      profilePicture?: string;
    };
    whatsapp?: string;
    phone?: string;
  };
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  // Mostrar el location completo. Si viene un ID (ej. "ceres"), normalizar usando LOCATIONS.
  const formattedLocation = (() => {
    const raw = professional.location || "Ceres, Santa Fe, Argentina";
    if (!raw.includes(",")) {
      const found = LOCATIONS.find((l) => l.id === raw);
      return found?.name || raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return raw;
  })();

  const whatsappUrl = buildWhatsAppLink(
    professional.whatsapp || professional.phone,
    "Hola, vi tu perfil en Ceres en Red y me interesa contactarte."
  );

  return (
    <Card className="group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100/50 transition-colors transition-shadow duration-300 rounded-2xl border border-gray-100 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {professional.socialNetworks?.profilePicture ? (
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-white shadow-sm">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={`/uploads/profiles/${professional.socialNetworks.profilePicture}`}
                      alt={professional.user.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  </div>
                </Avatar>
              ) : (
                <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-white shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-[#006F4B] text-sm font-medium">
                    {professional.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <div className="flex items-center space-x-1">
                  <h3 className="font-bold text-lg text-gray-900">
                    <Link
                      href={`/profesionales/${professional.id}`}
                      className="group-hover:text-[var(--gov-green)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-sm"
                    >
                      {professional.user.name}
                    </Link>
                  </h3>
                  {professional.verified && (
                    <Image src="/verificado.png" alt="Verified" width={16} height={16} className="ml-1" />
                  )}
                </div>
                {professional.primaryCategory?.name && (
                  <p className="text-xs font-medium text-[#006F4B] mt-0.5">
                    {professional.primaryCategory.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {professional.bio}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-3">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            <span>{formattedLocation}</span>
          </div>
          
        </div>

        <div className="flex items-center justify-between pt-2 gap-2 sm:gap-3">
        <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span className="text-xs">Disponible hoy</span>
          </div>
          
          <div className="flex flex-wrap justify-end gap-2 sm:gap-2">
            <Link 
              href={`/profesionales/${professional.id}`}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-colors transition-shadow duration-200 flex items-center shadow-sm"
            >
              Ver Perfil
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contactar por WhatsApp"
                className="bg-[#25D366] hover:bg-[#20BD5C] text-white px-4 py-2 rounded-full font-medium text-sm transition-colors transition-shadow duration-200 flex items-center shadow-sm hover:shadow-md"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
      </Card>
  );
}




