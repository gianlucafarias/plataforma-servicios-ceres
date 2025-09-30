"use client"
import { Button } from "@/components/ui/button";
import { CategoryCarousel } from "@/components/features/CategoryCarousel";
import { ServiceCard } from "@/components/features/ServiceCard";
import { SearchSuggestions } from "@/components/features/SearchSuggestions";
import { Search, ArrowRight, Shield, Rocket, CheckCircle2, UserPlus, LayoutGrid, MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SUBCATEGORIES_PROFESIONES, AREAS_OFICIOS, SUBCATEGORIES_OFICIOS } from "@/lib/taxonomy";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { CategorySuggest } from "@/components/features/CategorySuggest";
import { useFeaturedServices } from "@/hooks/useFeaturedCategories";


export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const { services, loading, error } = useFeaturedServices(6);
    const handleSuggestionClick = (suggestionName: string) => {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);

    setTimeout(() => {
      const input = document.getElementById('q') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/servicios?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen">
            
           {/* Hero Section */}
           <section className="relative overflow-hidden py-16 md:py-20 lg:py-24">
        <div className={`absolute inset-0 -z-10 bg-[#EBE4C0] `}>
          {/* Fondo base */}
          <Image
            src="/fondosolo.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
          />
          
            <div className={`hidden xl:block absolute left-0 top-0 h-full w-1/3 transition-all duration-700 ease-out ${mounted ? "opacity-70 translate-x-0" : "opacity-0 -translate-x-8"}`}>
              <Image
                src="/elementosizquierda.png"
                alt=""
                fill
                priority
                sizes="33vw"
                className="object-contain object-left"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
              />
            </div>
            
            <div className={`hidden xl:block absolute right-0 top-0 h-full w-1/3 transition-all duration-700 ease-out ${mounted ? "opacity-70 translate-x-0" : "opacity-0 translate-x-8"}`}>
              <Image
                src="/elementosderecha.png"
                alt=""
                fill
                priority
                sizes="33vw"
                className="object-contain object-right"
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
              />
            </div>
        </div>

        <div className="absolute inset-0 "></div>
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-40 md:opacity-50">
          <div className="absolute -top-20 -left-20 h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 md:h-80 md:w-80 lg:h-[28rem] lg:w-[28rem] rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center relative">
            <h1
              className={`text-4xl md:text-5xl lg:text-4xl font-rutan font-semibold tracking-tight text-foreground mb-6 max-w-3xl mx-auto transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            >
              ¿Buscás un técnico? ¿Profesional? ¿Alguien que te ayude a resolver algo?{" "}
              <br />
              <span className="block font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#006F4B] to-[#008F5B] leading-tight">¡Encontralo acá!</span>
            </h1>
            <p
              className={`text-base md:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "120ms" }}
            >
              Plataforma del Gobierno de la Ciudad de Ceres para conectar vecinos con profesionales verificados.
            </p>

            {/* Barra de búsqueda principal */}
            <form
              role="search"
              aria-label="Buscar servicios"
              className={`relative z-50 max-w-2xl mx-auto mb-4 transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "240ms" }}
              onSubmit={handleSearchSubmit}
            >
              <label htmlFor="q" className="sr-only">Buscar servicios</label>
              <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <input
                id="q"
                name="q"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                placeholder="¿Qué servicio necesitas? Ej: plomero, electricista..."
                aria-label="¿Qué servicio necesitas?"
                autoComplete="off"
                className="w-full rounded-2xl border-2 border-gray-200 bg-background pl-12 pr-28 py-4 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-100 focus-visible:border-[#006F4B] transition-all duration-200"
              />
              <button type="submit" aria-label="Buscar" className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 bg-[#008255] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#008F4B] focus:ring-4 focus:ring-green-100 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Search />
              </button>
              
              <SearchSuggestions
                query={searchQuery}
                isVisible={showSuggestions}
                onSelect={handleSuggestionClick}
                onClose={() => setShowSuggestions(false)}
              />
            </form>
            <div
              className={`flex flex-wrap gap-2 justify-center items-center mb-12 transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "320ms" }}
            >
              <label className="text-muted-foreground ">Busco: </label>
              <CategorySuggest handleSuggestionClick={handleSuggestionClick} randomSuggestionsNumber={6} categories={SUBCATEGORIES_OFICIOS} />
            </div>
              
              
            <div
              className={`flex flex-wrap justify-center gap-4 transition-all duration-700 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: "360ms" }}
            >
              <Link href="/servicios" className=" text-black px-8 py-4 rounded-xl  bg-white/80 hover:bg-gray-200 font-semibold shadow-lg text-lg transition-all duration-200 inline-flex items-center">
                Ver todos los servicios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/auth/registro" className="bg-[#FDBA38] text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#F4A623]  transition-all duration-400 shadow-lg inline-flex items-center">
                Ofrecer mis servicios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios clave (sin métricas) */}
      <section className="py-12 bg-[var(--gov-green)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-white">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div className="text-lg font-semibold">Desarrollo local</div>
              <div className="text-sm opacity-90">Iniciativa del Gobierno de la Ciudad de Ceres</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <div className="text-lg font-semibold">Rápido y simple</div>
              <div className="text-sm opacity-90">Buscá, elegí y coordiná en minutos</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-lg font-semibold">Contacto directo</div>
              <div className="text-sm opacity-90">Coordiná por WhatsApp o teléfono</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <div className="text-lg font-semibold">Enfocado en la región</div>
              <div className="text-sm opacity-90">Profesionales de Ceres y la zona</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías populares */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[var(--gov-green)]/5 to-[var(--gov-yellow)]/10">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--gov-green)]/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--gov-yellow)]/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm text-[var(--gov-green)] mb-3">
              <LayoutGrid className="h-4 w-4" />
              Explora por categoría
            </div>
            <h2 className="text-3xl lg:text-4xl font-rutan font-bold mb-3">
            ¿Qué servicio necesitás?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontrá tu solución, ¡con solo un clic!

            </p>
          </div>
          <div className="text-center">
            <h2 className="text-3xl lg:text-3xl font-rutan font-bold">Oficios</h2>
            <p className="text-lg text-muted-foreground">Categorías más solicitadas </p>
          </div>
          <CategoryCarousel categories={AREAS_OFICIOS} />

          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link href="/categorias">
                Ver todas las categorías
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Profesionales destacados */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-rutan font-bold mb-4">
            Profesionales 
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Categorías más solicitadas
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {SUBCATEGORIES_PROFESIONES.map((p) => (
              <Link key={p.slug} href={`/profesionales?categoria=${p.slug}`}>
                <Card 
                  className="group relative h-52 flex items-center justify-center text-center rounded-2xl text-white hover:brightness-110 transition-transform duration-300 ease-out cursor-pointer p-0 transform-gpu will-change-transform ring-1 ring-transparent hover:ring-white/20 hover:z-30 overflow-hidden"
                >
                  {/* Imagen de fondo */}
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
                    />
                  )}

                  {/* Overlay de gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent from-0% via-[#006F4B]/40 via-30% to-[#006F4B]/95 to-100% transition-all duration-300 group-hover:from-transparent group-hover:from-0% group-hover:via-[#006F4B]/50 group-hover:via-30% group-hover:to-[#006F4B]/98 group-hover:to-100%" />

                  {/* Contenido */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                    <div className="text-2xl lg:text-2xl font-rutan font-semibold drop-shadow-sm">
                      {p.name}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/profesionales">
                Ver todos los profesionales
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>


 {/* Servicios destacados */}
 <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-rutan font-bold mb-4">
            Perfles destacados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trabajadores mejores calificados y más solicitados
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            ) : error ? (
              <div className="col-span-full text-red-600">{error}</div>
            ) : services.length === 0 ? (
              <div className="col-span-full text-muted-foreground">No hay servicios para mostrar aún.</div>
            ) : (
              services
                .filter(service => 
                  service.professional && 
                  service.category && 
                  service.professional.user &&
                  service.professional.user.name
                )
                .map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={{
                      ...service,
                      professional: {
                        ...service.professional!,
                        user: {
                          ...service.professional!.user!,
                          name: service.professional!.user!.name!
                        }
                      },
                      category: service.category!
                    }} 
                  />
                ))
            )}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/servicios">
                Ver todos los servicios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA para profesionales */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-[var(--gov-green)]/5 to-[var(--gov-yellow)]/10">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[var(--gov-green)]/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--gov-yellow)]/20 blur-3xl" />
        </div>
        <div className="container mx-auto px-2 sm:px-4 lg:px-8">
          <div className="relative w-full max-w-[1400px] mx-auto rounded-3xl border border-gray-100 bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Columna izquierda */}
              <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left p-8 lg:p-14 xl:p-16">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1 text-sm text-[var(--gov-green)] w-fit mb-4 mx-auto lg:mx-0">
                  <Rocket className="h-4 w-4" />
                  Crece en Ceres
                </div>
                <h2 className="text-3xl lg:text-4xl font-rutan font-bold mb-4">
                   ¿Querés publicar tus servicios?
                </h2>
                

                <div className="space-y-4 mb-8">
                  <div className="flex items-start justify-center lg:justify-start gap-3">
                    <div className="mt-1 grid place-items-center h-9 w-9 rounded-xl bg-[var(--gov-green)]/10 text-[var(--gov-green)]">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">Registro</p>
                      <p className="text-sm text-muted-foreground">Creá tu perfil y agregá tus servicios. Recordá que toda la información tiene que ser verídica y demostrable</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-center lg:justify-start gap-3">
                    <div className="mt-1 grid place-items-center h-9 w-9 rounded-xl bg-[var(--gov-green)]/10 text-[var(--gov-green)]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">Verificación</p>
                      <p className="text-sm text-muted-foreground">Para mayor seguridad, nuestro equipo validará tu información</p>
                    </div>
                  </div>
                  <div className="flex items-start justify-center lg:justify-start gap-3">
                    <div className="mt-1 grid place-items-center h-9 w-9 rounded-xl bg-[var(--gov-green)]/10 text-[var(--gov-green)]">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium leading-tight">¡Listo!</p>
                      <p className="text-sm text-muted-foreground">Ya estás listo para comenzar a recibir y gestionar solicitudes</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white shadow-lg hover:shadow-xl hover:from-[#008F5B] hover:to-[#006F4B]"
                  asChild
                >
                  <Link href="/auth/registro" className="inline-flex items-center">
                    Crea tu perfil gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {/* Columna derecha (imagen) - oculta en mobile */}
              <div className="relative hidden lg:block">
                <div className="relative w-full h-[280px] lg:h-full min-h-[380px]">
                  <Image
                    src="/servicios/instalacion-aires.jpg"
                    alt="Profesional trabajando"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
