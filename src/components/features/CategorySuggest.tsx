"use client"

import { Subcategory } from "@/lib/taxonomy"
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface CategorySuggestProps {
    handleSuggestionClick: (suggestionName: string) => void;
    randomSuggestionsNumber?: number;
    categories: Subcategory[];
    query?: string;
}

const SuggestionSkeleton = () => (
  <div className="flex flex-wrap gap-2 justify-center items-center">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="gap-2 text-black/80 text-sm items-center bg-gray-100/50 px-12 py-4 border-1 border-gray-500/50 animate-pulse rounded-full"
      />
    ))}
  </div>
);

export function CategorySuggest({ handleSuggestionClick, randomSuggestionsNumber, categories, query }: CategorySuggestProps) {
    const [randomSuggestions, setRandomSuggestions] = useState<Subcategory[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const shuffled = [...categories].sort(() => Math.random() - 0.5);
      if (randomSuggestionsNumber) {
        setRandomSuggestions(shuffled.slice(0, randomSuggestionsNumber));
      } else {
        setRandomSuggestions(shuffled);
      }
      setIsLoaded(true);
    }, [categories, randomSuggestionsNumber]);

    const q = (query ?? '').trim().toLowerCase();
    const source = q ? categories : randomSuggestions;
    const list = source.filter((s) =>
      q ? (s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)) : true
    );

    return (
      <>
        {isLoaded ? (
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {list.map((s) => (
              <Badge 
                key={s.slug} 
                variant="outline"
                onClick={() => handleSuggestionClick(s.name)}
                className="items-center gap-2 bg-white/90 text-black/80 px-3 text-sm font-medium py-1 rounded-full border-1 border-gray-300 cursor-pointer hover:border-gray-900 hover:shadow-md transition-all duration-200"
              >
                {s.name}
              </Badge>
            ))}
          </div>
        ) : (
          <SuggestionSkeleton />
        )}
      </>
    )
}