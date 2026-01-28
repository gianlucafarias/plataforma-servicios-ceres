import { ArrowRight, Rocket, CheckCircle2, UserPlus, MessageCircle, MapPin, Verified } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { SUBCATEGORIES_PROFESIONES } from "@/lib/taxonomy";
import { HeroSearch } from "@/components/features/HeroSearch";
import { FeaturedProfessionals } from "@/components/features/FeaturedProfessionals";
import { CategoryCarouselSection } from "@/components/features/CategoryCarouselSection";


export default function Home() {
  return (
    <div className="bg-[#f8f9fa] dark:bg-background-dark text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[#EBE4C0]">
          
          
          {/* Elementos decorativos izquierda */}
          <div className="hidden xl:block absolute left-0 top-0 h-full w-1/3 transition-opacity duration-700 ease-out">
            <Image
              src="/elementosizquierda.png"
              alt=""
              fill
              sizes="33vw"
              className="object-contain object-left opacity-70"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
            />
          </div>
          
          {/* Elementos decorativos derecha */}
          <div className="hidden xl:block absolute right-0 top-0 h-full w-1/3 transition-opacity duration-700 ease-out">
            <Image
              src="/elementosderecha.png"
              alt=""
              fill
              sizes="33vw"
              className="object-contain object-right opacity-70"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
            />
          </div>
        </div>
        
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0 opacity-40 md:opacity-50 z-0">
          <div className="absolute -top-20 -left-20 h-64 w-64 md:h-80 md:w-80 lg:h-96 lg:w-96 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 md:h-80 md:w-80 lg:h-[28rem] lg:w-[28rem] rounded-full blur-3xl" />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-light dark:to-background-dark z-0"></div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-6">
            ¿Buscás un técnico? ¿Profesional?<br/>
            <span className="text-primary font-extrabold">¡Encontralo acá!</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Plataforma del Gobierno de la Ciudad de Ceres para conectar vecinos con profesionales verificados de manera segura y rápida.
          </p>
          
          <HeroSearch />
          
          {/* Botones CTA */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link 
              href="/servicios" 
              className="group px-8 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-full shadow-sm hover:shadow-md transition-colors transition-shadow border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2"
            >
              Ver todos los servicios
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>
            <Link 
              href="/auth/registro" 
              className="px-8 py-3 font-semibold rounded-full shadow-lg bg-amber-600 text-white transition-colors transform hover:bg-amber-700"
            >
              Ofrecer mis servicios
            </Link>
          </div>
        </div>
      </header>

      {/* Beneficios clave */}
      <section className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start p-4 rounded-xl cursor-default">
              <Verified className="h-10 w-10 mb-3 opacity-90" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-1">Desarrollo local</h3>
              <p className="text-sm opacity-80 text-center md:text-left">Iniciativa del Gobierno de la Ciudad de Ceres</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-4 rounded-xl cursor-default">
              <Rocket className="h-10 w-10 mb-3 opacity-90" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-1">Rápido y simple</h3>
              <p className="text-sm opacity-80 text-center md:text-left">Buscá, elegí y coordiná en minutos</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-4 rounded-xl cursor-default">
              <MessageCircle className="h-10 w-10 mb-3 opacity-90" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-1">Contacto directo</h3>
              <p className="text-sm opacity-80 text-center md:text-left">Coordiná por WhatsApp o teléfono</p>
            </div>
            <div className="flex flex-col items-center md:items-start p-4 rounded-xl cursor-default">
              <MapPin className="h-10 w-10 mb-3 opacity-90" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-1">Enfocado en la región</h3>
              <p className="text-sm opacity-80 text-center md:text-left">Profesionales de Ceres y la zona</p>
            </div>
          </div>
        </div>
      </section>

      <CategoryCarouselSection />

      {/* Profesiones */}
      <section className="py-12 bg-white dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">Profesiones</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBCATEGORIES_PROFESIONES.map((p) => (
              <Link key={p.slug} href={`/profesionales?categoria=${p.slug}`}>
                <div className="group relative h-48 rounded-2xl overflow-hidden shadow-md">
                  {/* Imagen de fondo */}
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
                    />
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-primary/80 group-hover:bg-primary/70 transition-colors flex items-center justify-center">
                    <h5 className="text-white font-bold text-xl tracking-wide">{p.name}</h5>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link 
              href="/profesionales"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Ver todos los profesionales
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>


      {/* Profesionales destacados */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Profesionales destacados</h3>
          <p className="text-gray-500 dark:text-gray-400">Verificados y listos para ayudarte</p>
        </div>
        <FeaturedProfessionals />
      </section>

      {/* CTA para profesionales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative rounded-3xl overflow-hidden bg-primary shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-10 lg:p-16 flex flex-col justify-center text-white z-10">
              <div className="inline-flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                <Rocket className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wide">Crece en Ceres</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">¿Querés publicar tus servicios?</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Registro</h4>
                    <p className="text-sm opacity-80">Creá tu perfil y agregá tus servicios. Recordá que toda la información tiene que ser verídica.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Verificación</h4>
                    <p className="text-sm opacity-80">Para mayor seguridad, nuestro equipo validará tu información.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Rocket className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">¡Listo!</h4>
                    <p className="text-sm opacity-80">Ya estás listo para comenzar a recibir y gestionar solicitudes.</p>
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <Link
                  href="/auth/registro"
                  className="bg-white text-primary px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors transition-shadow flex items-center gap-2 w-fit"
                >
                  Crea tu perfil gratis
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="relative h-64 lg:h-auto">
              <Image
                src="/servicios/instalacion-aires.jpg"
                alt="Profesional trabajando"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-transparent lg:hidden"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent lg:hidden"></div>
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary to-transparent hidden lg:block"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
