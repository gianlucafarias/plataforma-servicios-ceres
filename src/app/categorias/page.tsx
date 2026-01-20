import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SUBCATEGORIES_OFICIOS, AREAS_OFICIOS } from "@/lib/taxonomy";
import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/seo";

// Datos mock de categorías expandidas
const categories = AREAS_OFICIOS.map((category) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  services: SUBCATEGORIES_OFICIOS.filter((s) => s.areaSlug === category.slug),
  group: 'oficios'
}));

export const metadata: Metadata = {
  title: "Categorías de Servicios en Ceres",
  description: "Explora todas las categorías de servicios profesionales disponibles en Ceres. Encuentra plomeros, electricistas, albañiles y más profesionales verificados.",
  alternates: {
    canonical: getAbsoluteUrl("/categorias"),
  },
  openGraph: {
    title: "Categorías de Servicios en Ceres | Ceres en Red",
    description: "Explora todas las categorías de servicios profesionales disponibles en Ceres. Encuentra exactamente lo que necesitas.",
    url: getAbsoluteUrl("/categorias"),
    siteName: "Ceres en Red",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorías de Servicios en Ceres",
    description: "Explora todas las categorías de servicios profesionales disponibles en Ceres.",
  },
};

export default function CategoriasPage() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 font-rutan mb-4">
              Categorías de Servicios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explora todas las categorías de servicios profesionales disponibles en Ceres. 
              Encuentra exactamente lo que necesitas.
            </p>
            
            

           
          </div>

          {/* Grid de categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/servicios?grupo=${category.group}&categoria=${category.slug}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl border border-gray-100 h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-4 rounded-2xl bg-[#006F4B]/10 group-hover:bg-[#006F4B]/20 transition-colors">
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800 rounded-xl">
                          {category.services.length} profesionales
                        </Badge>
                       
                      </div>
                    </div>
                    <CardTitle className="text-xl font-rutan group-hover:text-[#006F4B] transition-colors">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      Profesionales especializados en {category.name.toLowerCase()} disponibles en Ceres y la región.
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Servicios incluidos:</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs rounded-xl">
                            {service.name}
                          </Badge>
                        ))}
                        {category.services.length > 3 && (
                          <Badge variant="outline" className="text-xs rounded-xl">
                            +{category.services.length - 3} más
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-600">
                        Ver profesionales
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#006F4B] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* CTA inferior */}
          <div className="mt-16 text-center">
            <Card className="rounded-2xl border border-gray-100 bg-gradient-to-r from-[#006F4B]/5 to-[#008F5B]/5">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 font-rutan mb-4">
                  ¿No encuentras la categoría que necesitas?
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Estamos agregando nuevas categorías constantemente. Contáctanos para sugerir 
                  nuevos servicios que te gustaría ver en la plataforma.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]">
                    Sugerir Categoría
                  </Button>
                  <Button variant="outline" className="rounded-xl" asChild>
                    <Link href="/contacto">
                      Contactar Soporte
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

