import Link from "next/link";
import { useState, memo, useCallback } from "react";
import Image from "next/image";
import type { PublicCategoriesTree } from "@/lib/api/professionals";
import { resolveCategoryIcon } from "@/lib/category-icons";

type CarouselCategory = PublicCategoriesTree["areas"][number];

interface CategoryCardProps {
  category: CarouselCategory;
  priority?: boolean;
}

function CategoryCardComponent({ category, priority = false }: CategoryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const hasImage = Boolean(category.image);
  const Icon = resolveCategoryIcon(category.icon, category.slug);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  return (
    <Link href={`/servicios?grupo=${category.group}&categoria=${category.slug}`} className="block h-full group">
      <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
        {hasImage && !loaded ? (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : null}

        {hasImage && category.image && (
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

        {!hasImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-emerald-700" />
        )}

        <div
          className={`absolute inset-0 ${
            hasImage ? "bg-gradient-to-t from-black/80 to-transparent" : "bg-gradient-to-t from-black/25 to-transparent"
          } flex items-end p-6 transition-opacity duration-500 ${
            loaded || !hasImage ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-end gap-3">
            {!hasImage && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            )}
            <h5 className="text-white font-bold text-lg leading-tight">{category.name}</h5>
          </div>
        </div>
      </div>
    </Link>
  );
}

export const CategoryCard = memo(CategoryCardComponent);
