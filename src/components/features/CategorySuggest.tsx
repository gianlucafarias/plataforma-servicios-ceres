"use client"

import { useMemo, useCallback, memo, useState } from "react";
import { useRouter } from "next/navigation";

interface SuggestCategory {
  slug: string;
  name: string;
}

interface CategorySuggestProps {
  handleSuggestionClick: (suggestionName: string) => void;
  randomSuggestionsNumber?: number;
  categories: SuggestCategory[];
  query?: string;
  loading?: boolean;
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
SuggestionSkeleton.displayName = "SuggestionSkeleton";

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentSeed = seed;

  for (let i = result.length - 1; i > 0; i--) {
    currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
    const j = currentSeed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function CategorySuggestComponent({
  handleSuggestionClick,
  randomSuggestionsNumber = 6,
  categories,
  query,
  loading = false,
}: CategorySuggestProps) {
  const router = useRouter();
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));

  const randomSuggestions = useMemo(() => {
    const shuffled = seededShuffle(categories, seed);
    return shuffled.slice(0, randomSuggestionsNumber);
  }, [categories, randomSuggestionsNumber, seed]);

  const list = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return randomSuggestions;

    return categories.filter((category) =>
      category.name.toLowerCase().includes(q) || category.slug.toLowerCase().includes(q)
    );
  }, [query, categories, randomSuggestions]);

  const onBadgeClick = useCallback((name: string) => {
    handleSuggestionClick(name);
  }, [handleSuggestionClick]);

  if (loading) {
    return <SuggestionSkeleton />;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {list.map((category) => (
        <button
          key={category.slug}
          onClick={() => onBadgeClick(category.name)}
          className="cursor-pointer px-4 py-1.5 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-600 transition-all text-sm"
        >
          {category.name}
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
