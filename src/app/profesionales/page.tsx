"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProfessionalCard } from "@/components/features/ProfessionalCard";
import { Search, Grid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { SUBCATEGORIES_PROFESIONES, LOCATIONS } from "@/lib/taxonomy";
import { useProfessionals } from "@/hooks/useProfessionals";
// import { Professional } from "@/types";

const mockProfessionals = [
  {
    id: "1",
    user: { name: "Juan Carlos Pérez" },
    bio: "Juan Carlos es un plomero con más de 10 años de experiencia en la industria.",
    verified: true,
    specialties: ["Plomería", "Instalaciones", "Reparaciones"],
    primaryCategory: { name: "Plomería" },
    categorySlug: "plomeria",
    group: "oficios",
    location: "Ceres, Santa Fe",

  },
  {
    id: "2",
    user: { name: "María Rodriguez" },
    bio: "María es una arquitecta con más de 10 años de experiencia en la industria.",
    location: "Ceres, Santa Fe",
    verified: true,
    specialties: ["Instalaciones eléctricas", "Tableros"],
    primaryCategory: { name: "Electricidad" },
    categorySlug: "electricidad",
    group: "oficios"
  },
  {
    id: "3",
    user: { name: "Lic. Pedro Gómez" },
    bio: "Pedro es un licenciado en derecho con más de 10 años de experiencia en la industria.",
    verified: true,
    specialties: ["Marketing Digital", "Redes Sociales"],
    primaryCategory: { name: "Marketing" },
    categorySlug: "marketing",
    group: "profesiones",
    location: "Ceres, Santa Fe",

  }
];


export default function ProfesionalesIndexPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page] = useState(1);

  const { professionals } = useProfessionals({
    q: searchTerm || undefined,
    categoria: selectedCategory !== "all" ? selectedCategory : undefined,
    location: selectedLocation !== "all" ? selectedLocation : undefined,
    grupo: "profesiones",
    page,
    limit: 12,
    sortBy: "recent",
  });

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
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);
    
    const el = chipsRef.current;
    if (!el) return () => clearTimeout(timer);
    
    const onScroll = () => updateScrollButtons();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const categoriesOptions = [
    { value: "all", label: "Todas las categorías" },
    ...SUBCATEGORIES_PROFESIONES.map(a => ({ value: a.slug, label: a.name })),
  ];

  const filtered = mockProfessionals.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.categorySlug === selectedCategory;
    const matchesSearch = !searchTerm || p.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 font-rutan">Profesionales</h1>
                <p className="text-gray-600 mt-1">{filtered.length} resultados</p>
              </div>
            </div>

            {/* Filtros mejorados */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header de filtros */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Filtros de búsqueda</h3>
                    <p className="text-sm text-gray-600">Encuentra el profesional que necesitas</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-lg"
                    >
                      <Grid className="h-4 w-4 mr-1" aria-hidden="true" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-lg"
                    >
                      <List className="h-4 w-4 mr-1" aria-hidden="true" />
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
                    <label htmlFor="professionals-search" className="text-sm font-medium text-gray-700">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                      <Input
                        id="professionals-search"
                        name="q"
                        type="search"
                        placeholder="Nombre, especialidad, servicios."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                        className="pl-10 h-9 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Categoría</label>
                    <div className="relative">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full h-12 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-colors duration-200">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesOptions.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
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
                        <SelectTrigger className="w-full h-12 rounded-lg border-gray-300 focus:border-[#006F4B] focus:ring-2 focus:ring-[#006F4B]/20 transition-colors duration-200">
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
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/95 shadow-lg border p-2 hover:bg-white hover:shadow-xl transition-colors transition-shadow"
                    >
                      <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                    </button>
                  )}

                  <div
                    ref={chipsRef}
                    className="flex gap-2 md:gap-4 whitespace-nowrap py-1 overflow-x-auto scroll-smooth px-8 touch-pan-x"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                    onScroll={updateScrollButtons}
                  >
                    {SUBCATEGORIES_PROFESIONES.map((p) => {
                      const active = selectedCategory === p.slug;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          onClick={() => setSelectedCategory(prev => prev === p.slug ? "all" : p.slug)}
                          className={`group relative h-16 w-40 md:h-24 md:w-56 flex items-center justify-center text-center rounded-2xl text-white transition-[transform,box-shadow,filter] duration-300 ease-out cursor-pointer p-0 transform-gpu will-change-transform overflow-hidden flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#006F4B] ${
                            active 
                              ? "ring-2 shadow-lg scale-105 brightness-110" 
                              : "ring-1 ring-transparent hover:ring-white/20 hover:brightness-115 "
                          }`}
                          style={{
                            backgroundImage: active 
                              ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,143,91,0.8) 30%, rgba(0,143,91,1) 100%)" 
                              : "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,111,75,0.6) 30%, rgba(0,111,75,0.95) 100%)",
                            backgroundColor: active ? "#008F5B" : "#006F4B"
                          }}
                          aria-pressed={active}
                        >
                          {active && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent pointer-events-none" />
                          )}
                          <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 md:p-4">
                            <div className="text-sm md:text-base lg:text-lg font-rutan font-semibold drop-shadow-sm">
                              {p.name}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {canScrollRight && (
                    <button
                      type="button"
                      aria-label="Desplazar derecha"
                      onClick={() => scrollChips('right')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/95 shadow-lg border p-2 hover:bg-white hover:shadow-xl transition-colors transition-shadow"
                    >
                      <ChevronRight className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="rounded-2xl border border-gray-100">
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Search className="h-16 w-16 mx-auto" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron profesionales</h3>
                <p className="text-gray-600 mb-6">Intenta cambiar los filtros o buscar con otros términos.</p>
                <Button onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setSelectedLocation("all"); }} className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]">Restablecer filtros</Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {professionals
                .filter(p => p.user && p.user.name)
                .map((p) => (
                <div key={p.id} className={viewMode === "list" ? "max-w-none" : ""}>
                  <ProfessionalCard professional={{
                    id: p.id,
                    user: { name: p.user!.name! },
                    bio: p.bio ?? "",
                    verified: p.verified ?? false,
                    specialties: Array.isArray((p as unknown as { specialties?: string[] }).specialties) ? (p as unknown as { specialties?: string[] }).specialties : undefined,
                    primaryCategory: (p as unknown as { primaryCategory?: { name: string } }).primaryCategory,
                    location: (p as unknown as { location?: string }).location,
                    socialNetworks: {
                      profilePicture: (p as unknown as { ProfilePicture?: string }).ProfilePicture,
                    },
                    // Datos de contacto para el botón de WhatsApp en listados de profesionales
                    whatsapp: (p as unknown as { whatsapp?: string | null }).whatsapp || undefined,
                    phone: (p.user as unknown as { phone?: string | null }).phone || undefined,
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


