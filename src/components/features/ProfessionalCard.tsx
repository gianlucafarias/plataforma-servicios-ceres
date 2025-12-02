import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import WhatsAppIcon from "../ui/whatsapp";
import { Clock, MapPin } from "lucide-react";
import Image from "next/image";


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
  };
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <Card className="group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100/50 transition-all duration-300 rounded-2xl border border-gray-100 bg-white">
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
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              </Avatar>
            ) : (
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-[#006F4B] text-sm font-medium">
                  {professional.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
              <div>
              <div className="flex items-center space-x-1">

<h3 className="font-semibold text-lg text-gray-900 group-hover:text-[var(--gov-green)] transition-colors">{professional.user.name}</h3>
 
  {professional.verified && (
   <Image src="/verificado.png" alt="Verified" width={16} height={16} className="ml-1"/>
  )}
</div>
</div>
</div>
<Badge variant="secondary" className="text-xs rounded-full bg-green-50 text-[#006F4B] border border-green-100 px-3">
{professional.primaryCategory?.name}
</Badge>
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
            <MapPin className="h-3 w-3" />
            <span>{professional.location}</span>
          </div>
          
        </div>

        <div className="flex items-center justify-between pt-2 gap-2 sm:gap-3">
        <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Disponible hoy</span>
          </div>
          
          <div className="flex flex-wrap justify-end gap-2 sm:gap-2">
            <Link 
              href={`/profesionales/${professional.id}`}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-50 hover:border-gray-300 font-medium text-sm transition-all duration-200 flex items-center shadow-sm"
            >
              Ver Perfil
            </Link>
            <a
              href={`https://wa.me/+5403491456789?text=Hola, vi tu perfil en Servicios Ceres y me interesa contactarte.`}
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






