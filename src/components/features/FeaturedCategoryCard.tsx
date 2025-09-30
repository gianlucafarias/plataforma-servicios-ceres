import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FeaturedCategoryCardProps {
  category: {
    name: string;
    slug: string;
    group: 'oficios' | 'profesiones';
    totalProfessionals: number;
    professionals: Array<{
      id: string;
      user: {
        name: string;
      };
      verified: boolean;
      rating?: number;
    }>;
  };
}

export function FeaturedCategoryCard({ category }: FeaturedCategoryCardProps) {
  const { professionals, totalProfessionals } = category;
  const displayedProfessionals = professionals.slice(0, 3); // Mostrar máximo 3
  const remainingCount = Math.max(0, totalProfessionals - displayedProfessionals.length);

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-rutan text-gray-900 group-hover:text-[#006F4B] transition-colors">
            {category.name}
          </CardTitle>
          <Badge variant="outline" className="rounded-xl text-xs">
            <Users className="h-3 w-3 mr-1" />
            {totalProfessionals}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Lista de profesionales */}
        <div className="space-y-2">
          {displayedProfessionals.length > 0 ? (
            displayedProfessionals.map((professional) => (
              <div key={professional.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#006F4B]/10 text-[#006F4B] text-xs">
                    {professional.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {professional.user.name}
                    </span>
                    {professional.verified && (
                      <Image src="/verificado.png" alt="Verificado" width={12} height={12} />
                    )}
                  </div>
                  {professional.rating && (
                    <div className="text-xs text-gray-500">
                      ⭐ {professional.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No hay profesionales disponibles aún
            </div>
          )}

          {/* Mostrar "y X más" si hay más profesionales */}
          {remainingCount > 0 && (
            <div className="text-xs text-gray-500 text-center py-2 border-t border-gray-100">
              y {remainingCount} profesional{remainingCount !== 1 ? 'es' : ''} más
            </div>
          )}
        </div>

        {/* Botón para ver todos */}
        <Button 
          variant="outline" 
          className="w-full rounded-xl group-hover:border-[#006F4B] group-hover:text-[#006F4B] transition-colors"
          asChild
        >
          <Link href={`/servicios?grupo=${category.group}&categoria=${category.slug}`}>
            Ver profesionales
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}








