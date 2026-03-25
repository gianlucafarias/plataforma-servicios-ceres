"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowRight,
  Verified,
  Zap,
  MapPin,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useServiceCounts } from "@/hooks/useServiceCounts";
import { usePublicCategoriesTree } from "@/hooks/usePublicCategoriesTree";
import { ProfessionalCard } from "@/components/features/ProfessionalCard";
import { CategoryItem } from "@/components/features/CategoryItem";
import { CitySelect } from "@/components/features/CitySelect";
import { resolveCategoryIcon } from "@/lib/category-icons";
import Link from "next/link";

export default function ServiciosPage() {
  const searchParams = useSearchParams();
  const { data: categoryTree, loading: categoriesLoading, error: categoriesError } = usePublicCategoriesTree();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [barSearchQuery, setBarSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [ready, setReady] = useState(false);

  const areas = categoryTree.areas;
  const oficioSubcategories = categoryTree.subcategoriesOficios;
  const professionSubcategories = categoryTree.subcategoriesProfesiones;

  const areaBySlug = useMemo(
    () => new Map(areas.map((area) => [area.slug, area])),
    [areas]
  );
  const oficioSubcategoryBySlug = useMemo(
    () => new Map(oficioSubcategories.map((subcategory) => [subcategory.slug, subcategory])),
    [oficioSubcategories]
  );
  const professionSubcategoryBySlug = useMemo(
    () => new Map(professionSubcategories.map((subcategory) => [subcategory.slug, subcategory])),
    [professionSubcategories]
  );

  const derivedGroup: "oficios" | "profesiones" | undefined = useMemo(() => {
    if (selectedArea === "profesiones") return "profesiones";
    if (selectedArea !== "all") return "oficios";
    if (selectedCategory !== "all") {
      if (oficioSubcategoryBySlug.has(selectedCategory)) return "oficios";
      if (professionSubcategoryBySlug.has(selectedCategory)) return "profesiones";
    }
    return undefined;
  }, [oficioSubcategoryBySlug, professionSubcategoryBySlug, selectedArea, selectedCategory]);

  const categoriaToFilter = useMemo(() => {
    if (selectedCategory !== "all") {
      return selectedCategory;
    }

    if (areaBySlug.has(selectedArea)) {
      return selectedArea;
    }

    return undefined;
  }, [areaBySlug, selectedArea, selectedCategory]);

  const filters = {
    q: searchTerm || undefined,
    grupo: derivedGroup,
    categoria: categoriaToFilter,
    location: selectedLocation !== "all" ? selectedLocation : undefined,
    page,
    limit: 20,
    enabled: ready,
  };

  const { services, loading, error, total, totalPages } = useServices(filters);
  const { counts: serviceCounts } = useServiceCounts();

  const isShowingAll = selectedArea === "all" && selectedCategory === "all";

  useEffect(() => {
    if (categoriesLoading) {
      return;
    }

    const categoria = searchParams.get("categoria");
    const subcategoria = searchParams.get("subcategoria");
    const q = searchParams.get("q") ?? "";
    const location = searchParams.get("location") ?? "all";

    let nextSelectedArea = "all";
    let nextSelectedCategory = "all";

    if (subcategoria) {
      const oficioSubcategory = oficioSubcategoryBySlug.get(subcategoria);
      if (oficioSubcategory) {
        nextSelectedArea = oficioSubcategory.areaSlug || "all";
        nextSelectedCategory = oficioSubcategory.slug;
      } else if (professionSubcategoryBySlug.has(subcategoria)) {
        nextSelectedArea = "profesiones";
        nextSelectedCategory = subcategoria;
      }
    } else if (categoria) {
      if (areaBySlug.has(categoria)) {
        nextSelectedArea = categoria;
      } else {
        const oficioSubcategory = oficioSubcategoryBySlug.get(categoria);
        if (oficioSubcategory) {
          nextSelectedArea = oficioSubcategory.areaSlug || "all";
          nextSelectedCategory = oficioSubcategory.slug;
        } else if (professionSubcategoryBySlug.has(categoria)) {
          nextSelectedArea = "profesiones";
          nextSelectedCategory = categoria;
        }
      }
    }

    setSelectedArea(nextSelectedArea);
    setSelectedCategory(nextSelectedCategory);
    setSearchTerm(q);
    setBarSearchQuery(q);
    setSelectedLocation(location);
    setReady(true);
  }, [
    areaBySlug,
    categoriesLoading,
    oficioSubcategoryBySlug,
    professionSubcategoryBySlug,
    searchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [selectedArea, selectedCategory, selectedLocation, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarSearchQuery(value);
    setSearchTerm(value);
  };

  const resetFilters = () => {
    setSelectedArea("all");
    setSelectedCategory("all");
    setSearchTerm("");
    setBarSearchQuery("");
    setSelectedLocation("all");
    setPage(1);
  };

  const handleCategorySelect = (slug: string) => {
    if (areaBySlug.has(slug)) {
      setSelectedArea(slug);
      setSelectedCategory("all");
      setSearchTerm("");
      setBarSearchQuery("");
      setPage(1);
      return;
    }

    if (slug === "profesiones") {
      setSelectedArea("profesiones");
      setSelectedCategory("all");
      setSearchTerm("");
      setBarSearchQuery("");
      setPage(1);
    }
  };

  const handleSubcategorySelect = (slug: string) => {
    const oficioSubcategory = oficioSubcategoryBySlug.get(slug);
    if (oficioSubcategory) {
      setSelectedArea(oficioSubcategory.areaSlug || "all");
      setSelectedCategory(slug);
      setSearchTerm("");
      setBarSearchQuery("");
      setPage(1);
      return;
    }

    if (professionSubcategoryBySlug.has(slug)) {
      setSelectedArea("profesiones");
      setSelectedCategory(slug);
      setSearchTerm("");
      setBarSearchQuery("");
      setPage(1);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="pt-20 pb-12 px-4 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto custom-scroll pr-4">
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-primary to-emerald-900 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">¿Ofreces servicios?</h3>
            <p className="text-xs text-emerald-100 mb-4 leading-relaxed">Unite a la red oficial de profesionales de la zona y conectá con más clientes.</p>
            <Link
              href="/auth/registro"
              className="w-full py-2 bg-white text-primary font-semibold text-sm rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              Registrarme ahora
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categorías</h4>
          <nav className="space-y-2">
            <button
              type="button"
              onClick={resetFilters}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                isShowingAll
                  ? "text-primary bg-emerald-50 dark:bg-emerald-900/30"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isShowingAll ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                }`}></span>
                <span className="truncate">Todos los profesionales</span>
              </div>
            </button>

            {areas.map((area) => {
              const isActive = selectedArea === area.slug;
              const subcategories = oficioSubcategories
                .filter((subcategory) => subcategory.areaSlug === area.slug)
                .map((subcategory) => ({
                  slug: subcategory.slug,
                  name: subcategory.name,
                  count: serviceCounts[subcategory.slug] ?? 0,
                }));
              const Icon: LucideIcon = resolveCategoryIcon(area.icon, area.slug) || Wrench;

              return (
                <CategoryItem
                  key={area.id}
                  name={area.name}
                  slug={area.slug}
                  icon={Icon}
                  isActive={isActive}
                  subcategories={subcategories}
                  selectedSubcategory={selectedCategory !== "all" ? selectedCategory : undefined}
                  onSelect={() => handleCategorySelect(area.slug)}
                  onSelectSubcategory={handleSubcategorySelect}
                />
              );
            })}

            <CategoryItem
              name="Profesiones"
              slug="profesiones"
              icon={null}
              isActive={selectedArea === "profesiones"}
              subcategories={professionSubcategories.map((subcategory) => ({
                slug: subcategory.slug,
                name: subcategory.name,
                count: serviceCounts[subcategory.slug] ?? 0,
              }))}
              selectedSubcategory={selectedCategory !== "all" ? selectedCategory : undefined}
              onSelect={() => handleCategorySelect("profesiones")}
              onSelectSubcategory={handleSubcategorySelect}
            />

            {!categoriesLoading && categoriesError && areas.length === 0 && professionSubcategories.length === 0 && (
              <p className="px-3 pt-2 text-xs text-red-500">{categoriesError}</p>
            )}
          </nav>
        </aside>

        <div className="col-span-1 lg:col-span-9 space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-1/2">
                <label htmlFor="services-search" className="sr-only">Buscar servicios.</label>
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-5 w-5" aria-hidden="true" />
                </span>
                <input
                  id="services-search"
                  name="q"
                  type="search"
                  value={barSearchQuery}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  placeholder="¿Qué servicio estás buscando? Ej: plomero, electricista."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-primary sm:text-sm transition-colors dark:focus-visible:ring-offset-gray-800"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar items-center">
                <CitySelect
                  className="min-w-[220px]"
                  value={selectedLocation}
                  onValueChange={(value) => {
                    setSelectedLocation(value);
                    setPage(1);
                  }}
                />
                <button
                  onClick={() => {
                    setShowVerifiedOnly(!showVerifiedOnly);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                    showVerifiedOnly
                      ? "border-[#006F4B] bg-[#006F4B] text-white focus:ring-4 focus:ring-green-100"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B]"
                  }`}
                >
                  <Verified className="h-4 w-4" aria-hidden="true" />
                  Verificados
                </button>
              </div>
            </div>
          </section>

          <section className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowMobileCategories((prev) => !prev)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <span>Categorías</span>
              <span className="text-xs text-gray-400">
                {showMobileCategories ? "Ocultar" : "Mostrar"}
              </span>
            </button>
            {showMobileCategories && (
              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto custom-scroll pr-1">
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    isShowingAll
                      ? "text-primary bg-emerald-50 dark:bg-emerald-900/30"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isShowingAll ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                    }`}></span>
                    <span className="truncate">Todos los profesionales</span>
                  </div>
                </button>

                {areas.map((area) => {
                  const isActive = selectedArea === area.slug;
                  const subcategories = oficioSubcategories
                    .filter((subcategory) => subcategory.areaSlug === area.slug)
                    .map((subcategory) => ({
                      slug: subcategory.slug,
                      name: subcategory.name,
                      count: serviceCounts[subcategory.slug] ?? 0,
                    }));
                  const Icon: LucideIcon = resolveCategoryIcon(area.icon, area.slug) || Wrench;

                  return (
                    <CategoryItem
                      key={area.id}
                      name={area.name}
                      slug={area.slug}
                      icon={Icon}
                      isActive={isActive}
                      subcategories={subcategories}
                      selectedSubcategory={selectedCategory !== "all" ? selectedCategory : undefined}
                      onSelect={() => handleCategorySelect(area.slug)}
                      onSelectSubcategory={handleSubcategorySelect}
                    />
                  );
                })}

                <CategoryItem
                  name="Profesiones"
                  slug="profesiones"
                  icon={null}
                  isActive={selectedArea === "profesiones"}
                  subcategories={professionSubcategories.map((subcategory) => ({
                    slug: subcategory.slug,
                    name: subcategory.name,
                    count: serviceCounts[subcategory.slug] ?? 0,
                  }))}
                  selectedSubcategory={selectedCategory !== "all" ? selectedCategory : undefined}
                  onSelect={() => handleCategorySelect("profesiones")}
                  onSelectSubcategory={handleSubcategorySelect}
                />

                {!categoriesLoading && categoriesError && areas.length === 0 && professionSubcategories.length === 0 && (
                  <p className="px-3 pt-2 text-xs text-red-500">{categoriesError}</p>
                )}
              </div>
            )}
          </section>

          <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profesionales Destacados</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {loading ? "Cargando." : `${total} ${total === 1 ? "servicio encontrado" : "servicios encontrados"}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando servicios.</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">Error: {error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Reintentar
              </Button>
            </div>
          ) : services.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No encontramos resultados</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mt-2 mb-6">
                No hay servicios que coincidan con tu búsqueda.
                Intenta con términos más generales o limpia los filtros.
              </p>
              <div className="flex flex-col items-center gap-4">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                >
                  Limpiar todos los filtros
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(() => {
                const grouped = new Map<string, {
                  professional: typeof services[number]["professional"];
                  services: typeof services;
                }>();

                services
                  .filter((service) => service.professional && service.professional.user && service.professional.user.name && service.category)
                  .forEach((service) => {
                    const professionalId = service.professional!.id;
                    if (!grouped.has(professionalId)) {
                      grouped.set(professionalId, { professional: service.professional!, services: [] });
                    }
                    grouped.get(professionalId)!.services.push(service);
                  });

                return Array.from(grouped.values()).map(({ professional, services: serviceList }) => {
                  if (!professional) return null;
                  const firstService = serviceList[0]!;
                  return (
                    <ProfessionalCard
                      key={professional.id}
                      professional={{
                        id: professional.id,
                        user: { name: professional.user!.name! },
                        bio: (professional as unknown as { bio?: string }).bio || firstService.description,
                        verified: professional.verified,
                        specialties: serviceList.map((service) => service.title),
                        primaryCategory: { name: firstService.category!.name },
                        location: (professional as unknown as { location?: string | null }).location || undefined,
                        socialNetworks: {
                          profilePicture: (professional as unknown as { ProfilePicture?: string | null }).ProfilePicture || undefined,
                        },
                        whatsapp: (professional as unknown as { whatsapp?: string | null }).whatsapp || undefined,
                        phone: (professional.user as unknown as { phone?: string | null }).phone || undefined,
                      }}
                    />
                  );
                });
              })()}
            </div>
          )}

          {services.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          <section className="bg-[#F8F5EE] dark:bg-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-200 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-green-200 dark:bg-green-900/20 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10 max-w-lg">
              {/* TODO: Add number of professionals 
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 rounded-full px-3 py-1 shadow-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Más de 500 profesionales activos</span>
              
              </div>
                */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Encontrá tu solución, <span className="text-primary">¡con solo un clic!</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Plataforma oficial para conectar vecinos con profesionales verificados en Ceres y la zona.
              </p>
            </div>
            <div className="relative z-10 flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm text-primary">
                  <Verified className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Seguro</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm text-primary">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Rápido</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm text-primary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Local</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
