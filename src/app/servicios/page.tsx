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
  Snowflake,
  Bolt,
  Car,
  TreePine,
  ChefHat,
  Heart,
  Truck,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useServices } from "@/hooks/useServices";
import { useServiceCounts } from "@/hooks/useServiceCounts";
import { ProfessionalCard } from "@/components/features/ProfessionalCard";
import { AREAS_OFICIOS, SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES, LOCATIONS } from "@/lib/taxonomy";
import { CategoryItem } from "@/components/features/CategoryItem";
import { CategorySuggestionModal } from "@/components/features/CategorySuggestionModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ServiciosPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [barSearchQuery, setBarSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedArea, setSelectedArea] = useState<string>("all");        // 'all' | areaSlug | 'profesiones'
  const [selectedLocation, setSelectedLocation] = useState<string>("all"); // 'all' | locationId
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [ready, setReady] = useState(false); // para evitar el primer fetch sin filtros correctos

  const derivedGroup: 'oficios' | 'profesiones' | undefined = useMemo(() => {
    if (selectedArea === 'profesiones') return 'profesiones';
    if (selectedArea !== 'all') return 'oficios';
    if (selectedCategory !== 'all') {
      // Buscar en subcategorías de oficios
      const subcatOficios = SUBCATEGORIES_OFICIOS.find(s => s.slug === selectedCategory);
      if (subcatOficios) return 'oficios';
      // Buscar en subcategorías de profesiones
      const subcatProfesiones = SUBCATEGORIES_PROFESIONES.find(s => s.slug === selectedCategory);
      if (subcatProfesiones) return 'profesiones';
    }
    return undefined;
  }, [selectedArea, selectedCategory]);

  // Determinar la categoría a filtrar
  const categoriaToFilter = useMemo(() => {
    // Si hay una subcategoría seleccionada, usarla directamente
    if (selectedCategory !== "all") {
      return selectedCategory;
    }

    // Si no hay subcategoría pero sí un área de oficios seleccionada,
    // usar el slug del área para que el backend filtre por todas sus subcategorías.
    const areaMatch = AREAS_OFICIOS.find((area) => area.slug === selectedArea);
    if (areaMatch) {
      return areaMatch.slug;
    }

    // Sin categoría ni área concreta => sin filtro de categoría
    return undefined;
  }, [selectedCategory, selectedArea]);

  const filters = {
    q: searchTerm || undefined,
    grupo: derivedGroup,
    categoria: categoriaToFilter, // API espera slug de subcategoría o de área (backend ya lo soporta)
    location: selectedLocation !== "all" ? selectedLocation : undefined,
    page,
    limit: 20,
    enabled: ready,
  };


  const { services, loading, error, total, totalPages } = useServices(filters);
  const { counts: serviceCounts } = useServiceCounts();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarSearchQuery(value);
    setSearchTerm(value);
  };

  // Leer parámetros de la URL cada vez que cambian (navegaciones desde home, navbar, etc.)
  useEffect(() => {
    const categoria = searchParams.get('categoria');
    const grupo = searchParams.get('grupo');
    const subcategoria = searchParams.get('subcategoria');
    const q = searchParams.get('q');
    
    if (subcategoria) {
      // Priorizar subcategoría si viene explícita (p.ej. desde el autocomplete)
      setSelectedCategory(subcategoria);

      // Buscar en subcategorías de oficios
      const subcatOficios = SUBCATEGORIES_OFICIOS.find(s => s.slug === subcategoria);
      if (subcatOficios) {
        setSelectedArea(subcatOficios.areaSlug || 'all');
        setSelectedGroup('oficios');
      } else {
        // Buscar en subcategorías de profesiones
        const subcatProfesiones = SUBCATEGORIES_PROFESIONES.find(s => s.slug === subcategoria);
        if (subcatProfesiones) {
          setSelectedArea('profesiones');
          setSelectedGroup('profesiones');
        }
      }
    } else if (categoria) {
      // ¿La categoría corresponde a un ÁREA de oficios?
      const area = AREAS_OFICIOS.find(a => a.slug === categoria);
      if (area) {
        // Filtrar por grupo "oficios" sin fijar una subcategoría concreta
        setSelectedArea(area.slug);
        setSelectedGroup('oficios');
        setSelectedCategory('all');
      } else {
        // Buscar en subcategorías de oficios
        const subcatOficios = SUBCATEGORIES_OFICIOS.find(s => s.slug === categoria);
        if (subcatOficios) {
          setSelectedArea(subcatOficios.areaSlug || 'all');
          setSelectedGroup('oficios');
          setSelectedCategory(subcatOficios.slug);
        } else {
          // Buscar en subcategorías de profesiones
          const subcatProfesiones = SUBCATEGORIES_PROFESIONES.find(s => s.slug === categoria);
          if (subcatProfesiones) {
            setSelectedArea('profesiones');
            setSelectedGroup('profesiones');
            setSelectedCategory(subcatProfesiones.slug);
          } else {
            // Si no coincide con nada conocido, limpiar selección de categoría
            setSelectedCategory('all');
          }
        }
      }
    }

    if (grupo) setSelectedGroup(grupo);
    if (q) {
      setSearchTerm(q);
      setBarSearchQuery(q);
    }
    // Una vez aplicados los parámetros de la URL, habilitamos el fetch
    setReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (selectedCategory !== 'all' && selectedGroup !== 'all') {
      // Verificar que la categoría seleccionada coincide con el grupo
      if (selectedGroup === 'oficios') {
        const found = SUBCATEGORIES_OFICIOS.find(s => s.slug === selectedCategory);
        if (!found) {
          setSelectedCategory('all');
        }
      } else if (selectedGroup === 'profesiones') {
        const found = SUBCATEGORIES_PROFESIONES.find(s => s.slug === selectedCategory);
        if (!found) {
          setSelectedCategory('all');
        }
      }
    }
  }, [selectedGroup, selectedCategory]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [selectedGroup, selectedCategory, selectedLocation, searchTerm]);


  const handleCategorySelect = (slug: string) => {
    const area = AREAS_OFICIOS.find(a => a.slug === slug);
    if (area) {
      setSelectedArea(slug);
      setSelectedGroup('oficios');
      setSelectedCategory('all'); // Categoría principal, no subcategoría específica
      setSearchTerm('');
      setBarSearchQuery('');
      setPage(1);
    } else if (slug === 'profesiones') {
      setSelectedArea('profesiones');
      setSelectedGroup('profesiones');
      setSelectedCategory('all');
      setSearchTerm('');
      setBarSearchQuery('');
      setPage(1);
    }
  };

  const handleSubcategorySelect = (slug: string) => {
    // Buscar en subcategorías de oficios
    const subcatOficios = SUBCATEGORIES_OFICIOS.find(s => s.slug === slug);
    if (subcatOficios) {
      setSelectedArea(subcatOficios.areaSlug || 'all');
      setSelectedGroup('oficios');
      setSelectedCategory(slug);
      setSearchTerm('');
      setBarSearchQuery('');
      setPage(1);
      return;
    }
    // Buscar en subcategorías de profesiones
    const subcatProfesiones = SUBCATEGORIES_PROFESIONES.find(s => s.slug === slug);
    if (subcatProfesiones) {
      setSelectedArea('profesiones');
      setSelectedGroup('profesiones');
      setSelectedCategory(slug);
      setSearchTerm('');
      setBarSearchQuery('');
      setPage(1);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <main className="pt-20 pb-12 px-4 lg:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto custom-scroll pr-4">
          {/* CTA para profesionales */}
          <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-primary to-emerald-900 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">¿Ofreces servicios?</h3>
            <p className="text-xs text-emerald-100 mb-4 leading-relaxed">Unite a la red oficial de profesionales de la ciudad y conectá con más clientes.</p>
            <Link
              href="/auth/registro"
              className="w-full py-2 bg-white text-primary font-semibold text-sm rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              Registrarme ahora
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Categorías */}
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categorías</h4>
          <nav className="space-y-2">
            {/* "Todos los profesionales" con mismo estilo que un CategoryItem */}
            <button
              type="button"
              onClick={() => {
                setSelectedArea('all');
                setSelectedGroup('all');
                setSelectedCategory('all');
                setSearchTerm('');
                setBarSearchQuery('');
                setSelectedLocation('all');
                setPage(1);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                selectedArea === 'all' && selectedGroup === 'all' && selectedCategory === 'all'
                  ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  selectedArea === 'all' && selectedGroup === 'all' && selectedCategory === 'all'
                    ? 'bg-primary'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}></span>
                <span className="truncate">Todos los profesionales</span>
              </div>
            </button>
            {/* Áreas de oficios */}
            {AREAS_OFICIOS.slice(0, 8).map((area) => {
              const isActive = selectedArea === area.slug;
              const subcategories = SUBCATEGORIES_OFICIOS
                .filter(s => s.areaSlug === area.slug)
                .map(s => ({
                  slug: s.slug,
                  name: s.name,
                  count: serviceCounts[s.slug] ?? 0,
                }));
              const iconMap: Record<string, LucideIcon | null> = {
                wrench: Wrench,
                snowflake: Snowflake,
                bolt: Bolt,
                car: Car,
                tree: TreePine,
                "chef-hat": ChefHat,
                heart: Heart,
                truck: Truck,
                // Para limpieza y costura usamos íconos genéricos existentes
                "cleaning-1": Zap,
                lock: Lock,
                needle: Wrench,
              };
              const Icon = area.iconKey ? iconMap[area.iconKey] || Wrench : Wrench;
              
              return (
                <CategoryItem
                  key={area.id}
                  name={area.name}
                  slug={area.slug}
                  icon={Icon}
                  isActive={isActive}
                  subcategories={subcategories}
                  selectedSubcategory={selectedCategory !== 'all' ? selectedCategory : undefined}
                  onSelect={() => handleCategorySelect(area.slug)}
                  onSelectSubcategory={handleSubcategorySelect}
                />
              );
            })}
            
            {/* Profesiones */}
            <CategoryItem
              name="Profesiones"
              slug="profesiones"
              icon={null}
              isActive={selectedArea === 'profesiones'}
              subcategories={SUBCATEGORIES_PROFESIONES.slice(0, 6).map(s => ({
                slug: s.slug,
                name: s.name,
                count: serviceCounts[s.slug] ?? 0,
              }))}
              selectedSubcategory={selectedCategory !== 'all' ? selectedCategory : undefined}
              onSelect={() => handleCategorySelect('profesiones')}
              onSelectSubcategory={handleSubcategorySelect}
            />
          </nav>
        </aside>

        {/* Contenido principal */}
        <div className="col-span-1 lg:col-span-9 space-y-8">
          {/* Barra de búsqueda y filtros */}
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
                <div className="relative min-w-[180px]">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none z-10" aria-hidden="true" />
                  <Select
                    value={selectedLocation}
                    onValueChange={(value) => {
                      setSelectedLocation(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full pl-10 pr-8 py-1.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-medium focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-colors duration-200">
                      <SelectValue placeholder="Todas las ciudades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ciudades</SelectItem>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button 
                  onClick={() => {
                    setShowVerifiedOnly(!showVerifiedOnly);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                    showVerifiedOnly
                      ? 'border-[#006F4B] bg-[#006F4B] text-white focus:ring-4 focus:ring-green-100'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B]'
                  }`}
                >
                  <Verified className="h-4 w-4" aria-hidden="true" />
                  Verificados
                </button>
              </div>
            </div>
          </section>

          {/* Filtros por categoría - Mobile */}
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
                {/* "Todos los profesionales" con mismo estilo que un CategoryItem */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArea('all');
                    setSelectedGroup('all');
                    setSelectedCategory('all');
                    setSearchTerm('');
                    setBarSearchQuery('');
                    setSelectedLocation('all');
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                    selectedArea === 'all' && selectedGroup === 'all' && selectedCategory === 'all'
                      ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      selectedArea === 'all' && selectedGroup === 'all' && selectedCategory === 'all'
                        ? 'bg-primary'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}></span>
                    <span className="truncate">Todos los profesionales</span>
                  </div>
                </button>

                {/* Áreas de oficios */}
                {AREAS_OFICIOS.slice(0, 8).map((area) => {
                  const isActive = selectedArea === area.slug;
                  const subcategories = SUBCATEGORIES_OFICIOS
                    .filter((s) => s.areaSlug === area.slug)
                    .map((s) => ({
                      slug: s.slug,
                      name: s.name,
                      count: serviceCounts[s.slug] ?? 0,
                    }));
                  const iconMap: Record<string, LucideIcon | null> = {
                    "construccion-mantenimiento": Wrench,
                    climatizacion: Snowflake,
                    "servicios-electronicos": Bolt,
                    automotores: Car,
                    jardineria: TreePine,
                  };
                  const Icon = iconMap[area.slug] || Wrench;

                  return (
                    <CategoryItem
                      key={area.id}
                      name={area.name}
                      slug={area.slug}
                      icon={Icon}
                      isActive={isActive}
                      subcategories={subcategories}
                      selectedSubcategory={
                        selectedCategory !== "all" ? selectedCategory : undefined
                      }
                      onSelect={() => {
                        handleCategorySelect(area.slug);
                      }}
                      onSelectSubcategory={(slug) => {
                        handleSubcategorySelect(slug);
                      }}
                    />
                  );
                })}

                {/* Profesiones */}
                <CategoryItem
                  name="Profesiones"
                  slug="profesiones"
                  icon={null}
                  isActive={selectedArea === "profesiones"}
                  subcategories={SUBCATEGORIES_PROFESIONES.slice(0, 6).map(
                    (s) => ({
                      slug: s.slug,
                      name: s.name,
                      count: serviceCounts[s.slug] ?? 0,
                    })
                  )}
                  selectedSubcategory={
                    selectedCategory !== "all" ? selectedCategory : undefined
                  }
                  onSelect={() => {
                    handleCategorySelect("profesiones");
                  }}
                  onSelectSubcategory={(slug) => {
                    handleSubcategorySelect(slug);
                  }}
                />
              </div>
              
            )}
           
          </section>
          

          {/* Header de resultados */}
          <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profesionales Destacados</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {loading ? 'Cargando.' : `${total} ${total === 1 ? 'servicio encontrado' : 'servicios encontrados'}`}
              </p>
            </div>
          </div>


          {/* Estados de carga y error */}
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
                  onClick={() => {
                    setSearchTerm("");
                    setBarSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedGroup("all");
                    setSelectedLocation("all");
                  }}
                >
                  Limpiar todos los filtros
                </Button>
                
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  if (!professional) return null;
                  const first = svcList[0]!;
                  return (
                    <ProfessionalCard
                      key={professional.id}
                      professional={{
                        id: professional.id,
                        user: { name: professional.user!.name! },
                        bio: (professional as unknown as { bio?: string }).bio || first.description,
                        verified: professional.verified,
                        specialties: svcList.map(s => s.title),
                        primaryCategory: { name: first.category!.name },
                        location: (professional as unknown as { location?: string | null }).location || undefined,
                        socialNetworks: {
                          profilePicture: (professional as unknown as { ProfilePicture?: string | null }).ProfilePicture || undefined,
                        },
                        // Datos de contacto reales para WhatsApp / teléfono
                        whatsapp: (professional as unknown as { whatsapp?: string | null }).whatsapp || undefined,
                        phone: (professional.user as unknown as { phone?: string | null }).phone || undefined,
                      }}
                    />
                  );
                });
              })()}
            </div>
          )}

          {/* Paginación */}
          {services.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  className="rounded-xl" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Hero Section - Movido al final */}
          <section className="bg-[#F8F5EE] dark:bg-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-200 dark:bg-yellow-900/20 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-green-200 dark:bg-green-900/20 rounded-full blur-3xl opacity-50"></div>
            <div className="relative z-10 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 rounded-full px-3 py-1 shadow-sm mb-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Más de 500 profesionales activos</span>
              </div>
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
