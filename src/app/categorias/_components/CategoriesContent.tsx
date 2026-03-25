"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySuggestionModal } from "@/components/features/CategorySuggestionModal";
import { SupportContactModal } from "@/components/features/SupportContactModal";
import { usePublicCategoriesTree } from "@/hooks/usePublicCategoriesTree";
import { useServiceCounts } from "@/hooks/useServiceCounts";
import { ArrowRight } from "lucide-react";
import { resolveCategoryIcon } from "@/lib/category-icons";

export function CategoriesContent() {
  const { data, loading, error } = usePublicCategoriesTree();
  const { counts: serviceCounts, loading: countsLoading } = useServiceCounts();

  const categories = useMemo(
    () =>
      data.areas.map((area) => ({
        ...area,
        services: data.subcategoriesOficios.filter((subcategory) => subcategory.areaSlug === area.slug),
      })),
    [data]
  );

  const hasResolvedCounts = !countsLoading && Object.keys(serviceCounts).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 font-rutan mb-4">
              Categorías de Servicios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explora todas las categorías de servicios profesionales disponibles en Ceres.
              Encuentra exactamente lo que necesitas.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[320px] rounded-2xl bg-white border border-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const Icon = resolveCategoryIcon(category.icon, category.slug);
                const countedServices = category.services.reduce(
                  (sum, service) => sum + (serviceCounts[service.slug] ?? 0),
                  0
                );
                const totalServices = hasResolvedCounts ? countedServices : category.professionalCount;

                return (
                  <Link
                    key={category.id}
                    href={`/servicios?grupo=${category.group}&categoria=${category.slug}`}
                  >
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer rounded-2xl border border-gray-100 h-full">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-4 rounded-2xl bg-[#006F4B]/10 group-hover:bg-[#006F4B]/20 transition-colors">
                            <Icon className="h-6 w-6 text-[#006F4B]" aria-hidden="true" />
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800 rounded-xl">
                              {totalServices} {totalServices === 1 ? "servicio" : "servicios"}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className="text-xl font-rutan group-hover:text-[#006F4B] transition-colors">
                          {category.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          Profesionales especializados en {category.name.toLowerCase()} disponibles
                          en Ceres y la región.
                        </p>

                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">
                            Servicios incluidos:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {category.services.slice(0, 3).map((service) => (
                              <Badge key={service.id} variant="outline" className="text-xs rounded-xl">
                                {service.name}
                              </Badge>
                            ))}
                            {category.services.length > 3 && (
                              <Badge variant="outline" className="text-xs rounded-xl">
                                +{category.services.length - 3} más
                              </Badge>
                            )}
                            {category.services.length === 0 && (
                              <Badge variant="outline" className="text-xs rounded-xl">
                                Sin subcategorías cargadas
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm text-gray-600">Ver profesionales</span>
                          <ArrowRight className="h-4 w-4 text-[#006F4B] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
              {error ?? "No hay categorías activas para mostrar por ahora."}
            </div>
          )}

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
                  <CategorySuggestionModal
                    origin="como_funciona_category_suggestion"
                    triggerClassName="cursor-pointer bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                    triggerLabel="Sugerir categoría"
                  />
                  <SupportContactModal
                    origin="como_funciona_support"
                    triggerClassName="cursor-pointer bg-primary hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
                    triggerLabel="Contactar soporte"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
