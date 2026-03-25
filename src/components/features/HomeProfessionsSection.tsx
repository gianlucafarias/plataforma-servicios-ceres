"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePublicCategoriesTree } from "@/hooks/usePublicCategoriesTree";

export function HomeProfessionsSection() {
  const { data, loading, error } = usePublicCategoriesTree();
  const pinnedProfessions = data.subcategoriesProfesiones.filter((profession) => profession.showOnHome);
  const professions = pinnedProfessions.length > 0 ? pinnedProfessions : data.subcategoriesProfesiones;

  return (
    <section className="py-12 bg-white dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">Profesiones</h4>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse"
              />
            ))}
          </div>
        ) : professions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {professions.map((profession, index) => (
              <Link key={profession.id} href={`/profesionales?categoria=${profession.slug}`}>
                <div className="group relative h-48 rounded-2xl overflow-hidden shadow-md">
                  {profession.image && (
                    <Image
                      src={profession.image}
                      alt={profession.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      priority={index < 3}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjRTlGNkYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4="
                    />
                  )}
                  <div className="absolute inset-0 bg-primary/80 group-hover:bg-primary/70 transition-colors flex items-center justify-center">
                    <h5 className="text-white font-bold text-xl tracking-wide">{profession.name}</h5>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            {error ?? "No hay profesiones activas para mostrar por ahora."}
          </div>
        )}

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
  );
}
