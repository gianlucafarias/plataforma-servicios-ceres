"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryCarousel } from "@/components/features/CategoryCarousel";
import { AREAS_OFICIOS } from "@/lib/taxonomy";

export function CategoryCarouselSection() {
  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">Explorá por categoría</span>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">¿Qué servicio necesitás?</h3>
        <p className="text-gray-500 dark:text-gray-400">Encontrá tu solución, ¡con solo un clic!</p>
      </div>
      <div className="flex justify-between items-end mb-6">
        <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Oficios</h4>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const container = document.querySelector('.carousel-3d') as HTMLElement;
              if (container) {
                const itemWidth = container.clientWidth * 0.8;
                container.scrollBy({ left: -itemWidth, behavior: "smooth" });
              }
            }}
            className="cursor-pointer w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f9fa] dark:focus-visible:ring-offset-gray-900"
            aria-label="Anterior"
          >
            <ArrowRight className="h-5 w-5 rotate-180" aria-hidden="true" />
          </button>
          <button
            onClick={() => {
              const container = document.querySelector('.carousel-3d') as HTMLElement;
              if (container) {
                const itemWidth = container.clientWidth * 0.8;
                container.scrollBy({ left: itemWidth, behavior: "smooth" });
              }
            }}
            className="cursor-pointer w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f9fa] dark:focus-visible:ring-offset-gray-900"
            aria-label="Siguiente"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <CategoryCarousel categories={AREAS_OFICIOS} showViewAll={true} />
      <div className="text-center mt-8">
        <Link
          href="/categorias"
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Ver todas las categorías
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
