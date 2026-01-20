"use client"

import { Subcategory } from "@/lib/taxonomy"
import { useMemo, useCallback, memo, useState } from "react";
import { useRouter } from "next/navigation";

interface CategorySuggestProps {
    handleSuggestionClick: (suggestionName: string) => void;
    randomSuggestionsNumber?: number;
    categories: Subcategory[];
    query?: string;
}

const SuggestionSkeleton = memo(() => (
  <div className="flex flex-wrap gap-2 justify-center items-center">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="gap-2 text-black/80 text-sm items-center bg-gray-100/50 px-12 py-4 border-1 border-gray-500/50 animate-pulse rounded-full"
      />
    ))}
  </div>
));
SuggestionSkeleton.displayName = 'SuggestionSkeleton';

// Función de shuffle determinística basada en un seed (para SSR consistente)
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;
  
  for (let i = result.length - 1; i > 0; i--) {
    // Generador pseudo-aleatorio simple
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    const j = currentSeed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

function CategorySuggestComponent({ handleSuggestionClick, randomSuggestionsNumber = 6, categories, query }: CategorySuggestProps) {
    const router = useRouter();
    // Seed aleatorio por montaje para que las sugerencias cambien entre recargas
    const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));

    // Memoizar el shuffle - solo recalcular si categories cambia
    const randomSuggestions = useMemo(() => {
      const shuffled = seededShuffle(categories, seed);
      return shuffled.slice(0, randomSuggestionsNumber);
    }, [categories, randomSuggestionsNumber, seed]);

    // Memoizar la lista filtrada
    const list = useMemo(() => {
      const q = (query ?? '').trim().toLowerCase();
      if (!q) return randomSuggestions;
      
      return categories.filter((s) =>
        s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
      );
    }, [query, categories, randomSuggestions]);

    // Memoizar el handler para evitar recrearlo en cada render
    const onBadgeClick = useCallback((name: string) => {
      handleSuggestionClick(name);
    }, [handleSuggestionClick]);

    return (
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {list.map((s) => (
          <button
            key={s.slug}
            onClick={() => onBadgeClick(s.name)}
            className="cursor-pointer px-4 py-1.5 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-600 transition-all text-sm"
          >
            {s.name}
          </button>
        ))}
        {categories.length > 0 && (
          <button
            type="button"
            onClick={() => router.push("/categorias")}
            className="cursor-pointer px-4 py-1.5 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-600 transition-all text-sm font-semibold"
          >
            +{categories.length} más
          </button>
        )}
      </div>
    );
}

export const CategorySuggest = memo(CategorySuggestComponent);
