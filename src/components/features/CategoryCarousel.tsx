"use client"
import { useRef } from "react";
import { Area } from "@/lib/taxonomy";
import { CategoryCard } from "./CategoryCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CategoryCarouselProps {
  categories: Area[];
  showViewAll?: boolean;
}

export function CategoryCarousel({ categories, showViewAll = false }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div className="relative">
        <div
          ref={scrollRef}
          className="carousel-3d flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-12 sm:pr-16 no-scrollbar fade-right-mask"
        >
          {categories.map((category, i) => (
            <div
              key={category.id}
              className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] lg:basis-[270px] transition-[flex-basis] duration-300 ease-out hover:basis-[320px] sm:hover:basis-[320px] md:hover:basis-[340px] lg:hover:basis-[380px]"
            >
              <div className="h-[360px]">
                <CategoryCard category={category} priority={i < 4} />
              </div>
            </div>
          ))}
          {showViewAll && (
            <div className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] lg:basis-[270px]">
              <div className="h-[360px]">
                <Link href="/categorias" className="block h-full group">
                  <div className="relative h-full rounded-2xl overflow-hidden shadow-sm transition-shadow duration-300 bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center">
                    <div className="text-center p-6">
                      <ArrowRight className="h-12 w-12 text-white mx-auto mb-4 group-hover:translate-x-2 transition-transform" aria-hidden="true" />
                      <h5 className="text-white font-bold text-lg leading-tight">
                        Ver todas las categorías
                      </h5>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
