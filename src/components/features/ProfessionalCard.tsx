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
      <Card className="group hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
            {professional.socialNetworks?.profilePicture ? (
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={`/uploads/profiles/${professional.socialNetworks.profilePicture}`}
                    alt={professional.user.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Avatar>
            ) : (
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                <AvatarFallback className="bg-[#006F4B]/10 text-[#006F4B] text-sm">
                  {professional.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
              <div>
              <div className="flex items-center space-x-1">

<h3 className="font-semibold text-lg">{professional.user.name}</h3>
 
  {professional.verified && (
   <Image src="/verificado.png" alt="Verified" width={16} height={16} className="ml-1"/>
  )}
</div>
</div>
</div>
<Badge variant="outline" className="text-xs rounded-xl">
{professional.primaryCategory?.name}
</Badge>
</div>
</CardHeader>

        <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {professional.bio}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{professional.location}</span>
          </div>
          
        </div>

        <div className="flex items-center justify-between pt-2 gap-2 sm:gap-3">
        <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Disponible</span>
          </div>
          
          <div className="flex flex-wrap justify-end gap-2 sm:gap-2">
            <Link 
              href={`/profesionales/${professional.id}`}
              className="bg-gray-100 text-gray-700 px-3 py-2 sm:px-4 rounded-lg hover:bg-gray-200 font-medium text-sm transition-all duration-200 flex items-center"
            >
              Ver Perfil
            </Link>
            <a
              href={`https://wa.me/+5403491456789?text=Hola, vi tu perfil en Servicios Ceres y me interesa contactarte.`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 sm:px-4 rounded-lg font-medium text-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
            >
              <WhatsAppIcon className="h-4 w-4 " />
              
            </a>
          </div>
        </div>
      </CardContent>
      </Card>
  );
}






