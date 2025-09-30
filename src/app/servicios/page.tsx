"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, List, Grid, ChevronLeft, ChevronRight } from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { ServiceCard } from "@/components/features/ServiceCard";
import { AREAS_OFICIOS, SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES, LOCATIONS } from "@/lib/taxonomy";
// import { Service } from "@/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function ServiciosPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // const [showSuggestions, setShowSuggestions] = useState(false);
  const [barSearchQuery, setBarSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState<string>("all");        // 'all' | areaSlug | 'profesiones'
  const [selectedSubcategory] = useState<string>("all"); // 'all' | subcategorySlug
  const [selectedLocation, setSelectedLocation] = useState<string>("all"); // 'all' | locationId

  const router = useRouter();

  const allSubcategories = useMemo(() => (
    [...SUBCATEGORIES_OFICIOS, ...SUBCATEGORIES_PROFESIONES]
  ), []);

// opciones del 1º select (categorías)
const categoriesOptions = [
  { value: "all", label: "Todas las categorías" },
  ...AREAS_OFICIOS.map(a => ({ value: a.slug, label: a.name })),        // oficios por área
  { value: "profesiones", label: "Profesiones" },                       // categoría única para profesiones
];

// subcategorías visibles para 2º select y chips
const visibleSubcategories =
  selectedArea === "all"
    ? allSubcategories
    : selectedArea === "profesiones"
      ? SUBCATEGORIES_PROFESIONES
      : SUBCATEGORIES_OFICIOS.filter(s => s.areaSlug === selectedArea);


  // Carrusel chips
  const chipsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollChips = (dir: 'left' | 'right') => {
    const el = chipsRef.current;
    if (!el) return;
    const amount = Math.max(200, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    updateScrollButtons();
    const el = chipsRef.current;
    if (!el) return;
    const onScroll = () => updateScrollButtons();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [visibleSubcategories]);

  const derivedGroup: 'oficios' | 'profesiones' | undefined =
  selectedArea === 'profesiones'
    ? 'profesiones'
    : (selectedArea !== 'all' ? 'oficios'
       : (selectedSubcategory !== 'all'
           ? (SUBCATEGORIES_PROFESIONES.some(s => s.slug === selectedSubcategory) ? 'profesiones' : 'oficios')
           : undefined));

const filters = {
  q: searchTerm || undefined,
  grupo: derivedGroup,
  categoria: selectedSubcategory !== "all" ? selectedSubcategory : undefined, // API espera slug de subcategoría
  location: selectedLocation !== "all" ? selectedLocation : undefined,
  page,
  limit: 20,
};


  const { services, loading, error, total, totalPages } = useServices(filters);

  // const handleSuggestionClick = (suggestionName: string) => {
  //   setBarSearchQuery(suggestionName);
  //   setSearchTerm(suggestionName);
  // };

  const handleCategoryChipClick = (sub: { slug: string; name: string; group: 'oficios' | 'profesiones' }) => {
    if (selectedCategory === sub.slug) {
      setSelectedCategory('all');
      setBarSearchQuery('');
      setSearchTerm('');
    } else {
      setSelectedGroup(sub.group);
      setSelectedCategory(sub.slug);
      setBarSearchQuery(sub.name);
      setSearchTerm(sub.name);
    }
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarSearchQuery(value);
    setSearchTerm(value);
  };

  // Leer parámetros de la URL
  useEffect(() => {
    const categoria = searchParams.get('categoria');
    const grupo = searchParams.get('grupo');
    const q = searchParams.get('q');
    
    if (categoria) setSelectedCategory(categoria);
    if (grupo) setSelectedGroup(grupo);
    if (q) {
      setSearchTerm(q);
      setBarSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedCategory !== 'all') {
      const current = allSubcategories.find(s => s.slug === selectedCategory);
      if (!current || (selectedGroup !== 'all' && current.group !== selectedGroup)) {
        setSelectedCategory('all');
      }
    }
    setPage(1);
  }, [selectedGroup, allSubcategories, selectedCategory]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGroup !== 'all') params.set('grupo', selectedGroup);
    if (selectedCategory !== 'all') params.set('categoria', selectedCategory);
    if (searchTerm) params.set('q', searchTerm);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `/servicios?${qs}` : `/servicios`, { scroll: false });
  }, [selectedGroup, selectedCategory, searchTerm, page, router]);

  const getCategoryDisplayName = () => {
    const category = categoriesOptions.find(cat => cat.value === selectedCategory);
    return category ? category.label : "Todos los servicios";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 font-rutan">
                  {selectedCategory === "all" ? "Encontrar servicios" : getCategoryDisplayName()}
                </h1>
                <p className="text-gray-600 mt-1">
                  {loading ? 'Cargando...' : `${total} ${total === 1 ? 'servicio encontrado' : 'servicios encontrados'}`}
                </p>
              </div>
            </div>

            {/* Filtros mejorados */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              {/* Header de filtros */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Filtros de búsqueda</h3>
                    <p className="text-sm text-gray-600">Encuentra el servicio que necesitas</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-lg"
                    >
                      <Grid className="h-4 w-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-lg"
                    >
                      <List className="h-4 w-4 mr-1" />
                      Lista
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenido de filtros */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Búsqueda */}
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Nombre, especialidad, servicios..."
                        value={barSearchQuery}
                        onChange={handleSearchChange}
                        className="pl-10 h-9 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Grupo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Grupo</label>
                    <div className="relative">
                      <Select value={selectedArea} onValueChange={setSelectedArea}>
                        <SelectTrigger className="w-full h-12 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-all duration-200">
                          <SelectValue placeholder="Seleccionar grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesOptions.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                 
                  {/* Localidad */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Lugar de trabajo</label>
                    <div className="relative">
                      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-full h-12 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-all duration-200">
                          <SelectValue placeholder="Seleccionar localidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las localidades</SelectItem>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chips de categorías */}
              <div className="px-6 pb-6">
                <div className="relative">
                  {canScrollLeft && (
                    <button
                      type="button"
                      aria-label="Desplazar izquierda"
                      onClick={() => scrollChips('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md border p-1 md:p-2 hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                  )}

                  <div
                    ref={chipsRef}
                    className="flex gap-2 whitespace-nowrap py-1 overflow-x-auto scroll-smooth px-8"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {visibleSubcategories.map((s) => (
                      <Button
                        key={s.slug}
                        variant={selectedCategory === s.slug ? "default" : "outline"}
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleCategoryChipClick(s)}
                      >
                        {s.name}
                      </Button>
                    ))}
                  </div>

                  {canScrollRight && (
                    <button
                      type="button"
                      aria-label="Desplazar derecha"
                      onClick={() => scrollChips('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 shadow-md border p-1 md:p-2 hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Estados de carga y error */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando servicios...</p>
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
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron servicios.</p>
              <p className="text-gray-400 text-sm mt-2">Intenta ajustar tus filtros de búsqueda.</p>
            </div>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {(() => {
                // agrupar por profesional
                const grouped = new Map<string, {
                  professional: typeof services[number]['professional'];
                  services: typeof services;
                }>();

                services
                  .filter(s => s.professional && s.professional.user && s.professional.user.name && s.category)
                  .forEach((s) => {
                    const pid = s.professional!.id;
                    if (!grouped.has(pid)) {
                      grouped.set(pid, { professional: s.professional!, services: [] });
                    }
                    grouped.get(pid)!.services.push(s);
                  });

                return Array.from(grouped.values()).map(({ professional, services: svcList }) => {
                  const first = svcList[0]!;
                  return (
                    <ServiceCard
                      key={professional!.id}
                      service={{
                        id: first.id,
                        title: first.title,
                        description: first.description,
                        priceRange: first.priceRange,
                        professional: {
                          id: professional!.id,
                          user: { name: professional!.user!.name! },
                          rating: professional!.rating,
                          reviewCount: professional!.reviewCount,
                          verified: professional!.verified,
                          ProfilePicture: (professional as unknown as { ProfilePicture?: string }).ProfilePicture || null,
                          services: svcList.map(s => ({ id: s.id, title: s.title })),
                        },
                        category: { name: first.category!.name },
                      }}
                    />
                  );
                });
              })()}
            </div>
          )}

          {/* Paginación */}
          {services.length > 0 && totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <span className="px-3 py-2 rounded-xl border">
                  {page} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
