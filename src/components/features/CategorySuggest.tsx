"use client"

import { Subcategory } from "@/lib/taxonomy"
import { useMemo, useCallback, memo } from "react";
import { Badge } from "@/components/ui/badge";

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
    // Memoizar el shuffle - solo recalcular si categories cambia
    // Usamos un seed fijo para que SSR y cliente coincidan
    const randomSuggestions = useMemo(() => {
      const shuffled = seededShuffle(categories, 42);
      return shuffled.slice(0, randomSuggestionsNumber);
    }, [categories, randomSuggestionsNumber]);

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

    // Ya no necesitamos skeleton porque usamos seed determinístico
    return (
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {list.map((s) => (
          <Badge 
            key={s.slug} 
            variant="outline"
            onClick={() => onBadgeClick(s.name)}
            className="items-center gap-2 bg-white/90 text-black/80 px-3 text-sm font-medium py-1 rounded-full border-1 border-gray-300 cursor-pointer hover:border-gray-900 hover:shadow-md transition-all duration-200"
          >
            {s.name}
          </Badge>
        ))}
      </div>
    );
}

export const CategorySuggest = memo(CategorySuggestComponent);
