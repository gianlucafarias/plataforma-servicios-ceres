"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { SearchSuggestions } from "@/components/features/SearchSuggestions";
import { CategorySuggest } from "@/components/features/CategorySuggest";
import { LOCATIONS, SUBCATEGORIES_OFICIOS } from "@/lib/taxonomy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HERO_LOCATIONS = LOCATIONS
  .filter((location) => location.id !== "otra")
  .map((location) => ({
    ...location,
    shortName: location.name.split(",")[0]?.trim() ?? location.name,
  }));

export function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
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

    const params = new URLSearchParams();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    }

    if (selectedLocation && selectedLocation !== "all") {
      params.set("location", selectedLocation);
    }

    const queryString = params.toString();
    router.push(queryString ? `/servicios?${queryString}` : "/servicios");
  };

  return (
    <>
      <form
        role="search"
        aria-label="Buscar servicios"
        onSubmit={handleSearchSubmit}
        className="relative mx-auto flex max-w-4xl flex-col gap-2 rounded-[2rem] border border-gray-100 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:gap-0"
      >
        <div className="flex min-w-0 flex-1 items-center rounded-full px-3 sm:px-4">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <label htmlFor="q" className="sr-only">Buscar servicios</label>
          <input
            id="q"
            name="q"
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
            placeholder="¿Que servicio necesitas?"
            aria-label="¿Que servicio necesitas?"
            autoComplete="off"
            className="min-w-0 flex-1 border-none bg-transparent px-4 py-4 text-base text-gray-700 placeholder-gray-400 focus-visible:outline-none dark:text-gray-200"
          />
        </div>

        <div className="hidden h-10 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-0">
          <div className="relative min-w-0 flex-1 sm:w-[240px]">
            <MapPin
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-14 w-full rounded-full border-0 bg-transparent pl-11 pr-4 text-left text-base font-medium text-gray-600 shadow-none focus:ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:text-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {HERO_LOCATIONS.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="submit"
            aria-label="Buscar"
            className="h-14 shrink-0 rounded-full bg-primary px-7 text-base font-semibold text-white transition-colors hover:bg-emerald-800 sm:ml-2 sm:px-8"
          >
            Buscar
          </button>
        </div>

        <div className="absolute left-0 right-0 top-full mt-3">
          <SearchSuggestions
            query={searchQuery}
            isVisible={showSuggestions}
            onSelect={handleSuggestionClick}
            onClose={() => setShowSuggestions(false)}
            navigateOnSelect={false}
          />
        </div>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
        <span className="mr-2 self-center font-medium text-gray-500 dark:text-gray-400">Busco:</span>
        <CategorySuggest
          handleSuggestionClick={handleSuggestionClick}
          randomSuggestionsNumber={4}
          categories={SUBCATEGORIES_OFICIOS}
        />
      </div>
    </>
  );
}
