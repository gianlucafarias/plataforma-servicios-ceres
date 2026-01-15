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
    <Link href={`/servicios?grupo=${category.group}&categoria=${category.slug}`} className="block h-full group">
      <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
        {/* Skeleton mientras carga */}
        {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />}

        {/* Imagen de fondo con next/image */}
        {category.image && (
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={handleLoad}
          />
        )}

        {/* Overlay de gradiente */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6 transition-all duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {loaded && (
            <h5 className="text-white font-bold text-lg leading-tight">
              {category.name}
            </h5>
          )}
        </div>
      </div>
    </Link>
  );
}

export const CategoryCard = memo(CategoryCardComponent);
