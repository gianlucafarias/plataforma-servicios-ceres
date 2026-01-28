"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchSuggestions } from "@/components/features/SearchSuggestions";
import { CategorySuggest } from "@/components/features/CategorySuggest";
import { SUBCATEGORIES_OFICIOS } from "@/lib/taxonomy";

export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionClick = (suggestionName: string) => {
    setSearchQuery(suggestionName);
    setShowSuggestions(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/servicios?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <form
        role="search"
        aria-label="Buscar servicios"
        onSubmit={handleSearchSubmit}
        className="relative bg-white dark:bg-gray-800 p-2 rounded-full shadow-soft max-w-3xl mx-auto flex items-center border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <label htmlFor="q" className="sr-only">Buscar servicios</label>
        <input
          id="q"
          name="q"
          type="search"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setShowSuggestions(searchQuery.length > 0)}
          placeholder="¿Qué servicio necesitas? Ej: plomero, electricista."
          aria-label="¿Qué servicio necesitas?"
          autoComplete="off"
          className="flex-grow bg-transparent border-none text-gray-700 dark:text-gray-200 px-6 py-3 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800"
        />
        <div className="absolute left-0 right-14 top-full mt-1">
          <SearchSuggestions
            query={searchQuery}
            isVisible={showSuggestions}
            onSelect={handleSuggestionClick}
            onClose={() => setShowSuggestions(false)}
          />
        </div>
        <button
          type="submit"
          aria-label="Buscar"
          className="bg-primary hover:bg-emerald-800 text-white rounded-full p-3 w-12 h-12 flex items-center justify-center transition-colors shadow-lg"
        >
          <Search className="h-5 w-5 cursor-pointer" aria-hidden="true" />
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-2 mt-6 text-sm">
        <span className="text-gray-500 dark:text-gray-400 font-medium mr-2 self-center">Busco:</span>
        <CategorySuggest
          handleSuggestionClick={handleSuggestionClick}
          randomSuggestionsNumber={4}
          categories={SUBCATEGORIES_OFICIOS}
        />
      </div>
    </>
  );
}
