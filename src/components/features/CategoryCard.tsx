import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Area } from "@/lib/taxonomy";
import { useState, memo, useCallback } from "react";
import Image from "next/image";

interface CategoryCardProps {
  category: Area;
  serviceCount?: number;
  // Permite que el carrusel priorice los primeros ítems
  priority?: boolean;
}

function CategoryCardComponent({ category, priority = false }: CategoryCardProps) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <Link href={`/servicios?grupo=${category.group}&categoria=${category.slug}`} className="block h-full">
      <Card className="group relative h-full flex items-center justify-center text-center rounded-2xl border border-transparent text-white hover:brightness-110 transition-transform duration-300 ease-out cursor-pointer p-0 transform-gpu will-change-transform ring-1 ring-transparent hover:ring-white/20 hover:z-30 overflow-hidden">
        {/* Skeleton mientras carga */}
        {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

        {/* Imagen de fondo con next/image */}
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority={priority}
            // Ancho estimado por breakpoint (coincide con basis del carrusel)
            sizes="(max-width: 640px) 240px, (max-width: 768px) 260px, (max-width: 1024px) 280px, 380px"
            className={`object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={handleLoad}
          />
        )}

        {/* Overlay de gradiente institucional */}
        <div
          className={`absolute inset-0 bg-gradient-to-b from-[var(--gov-green)]/10 via-[var(--gov-green)]/50 to-[#008F5B]/90 transition-opacity duration-300 group-hover:from-[var(--gov-green)]/80 group-hover:via-[var(--gov-green)]/60 group-hover:to-[#008F5B]/80 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
          {!loaded ? (
            <div className="w-24 h-8 rounded animate-pulse" />
          ) : (
            <div className="text-2xl lg:text-2xl font-rutan font-semibold drop-shadow-sm">
              {category.name}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export const CategoryCard = memo(CategoryCardComponent);
