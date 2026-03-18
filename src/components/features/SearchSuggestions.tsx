import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Building2, Search, User } from "lucide-react";
import {
  AREAS_OFICIOS,
  SUBCATEGORIES_OFICIOS,
  SUBCATEGORIES_PROFESIONES,
  type Area,
  type Subcategory,
} from "@/lib/taxonomy";

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  navigateOnSelect?: boolean;
}

interface SearchResult {
  type: "subcategory" | "area";
  item: Subcategory | Area;
  parentArea?: Area;
}

const AREAS_MAP = new Map(AREAS_OFICIOS.map((area) => [area.slug, area]));

function SearchSuggestionsComponent({
  query,
  isVisible,
  onSelect,
  onClose,
  navigateOnSelect = true,
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const searchTerm = trimmed.toLowerCase();
    const searchResults: SearchResult[] = [];

    for (const subcategory of SUBCATEGORIES_OFICIOS) {
      if (subcategory.name.toLowerCase().includes(searchTerm)) {
        const parentArea = subcategory.areaSlug
          ? AREAS_MAP.get(subcategory.areaSlug)
          : undefined;

        searchResults.push({
          type: "subcategory",
          item: subcategory,
          parentArea,
        });
      }
    }

    for (const subcategory of SUBCATEGORIES_PROFESIONES) {
      if (subcategory.name.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: "subcategory",
          item: subcategory,
        });
      }
    }

    for (const area of AREAS_OFICIOS) {
      if (area.name.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: "area",
          item: area,
        });
      }
    }

    return searchResults.slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  const handleSuggestionClick = useCallback(
    (result: SearchResult) => {
      onSelect(result.item.name);
    },
    [onSelect]
  );

  const getSuggestionLink = useCallback((result: SearchResult) => {
    if (result.type === "subcategory") {
      const subcategory = result.item as Subcategory;

      if (subcategory.group === "oficios" && result.parentArea) {
        return `/servicios?grupo=${subcategory.group}&categoria=${result.parentArea.slug}&subcategoria=${subcategory.slug}`;
      }

      if (subcategory.group === "profesiones") {
        return `/profesionales?categoria=${subcategory.slug}`;
      }
    }

    const area = result.item as Area;
    return `/servicios?grupo=${area.group}&categoria=${area.slug}`;
  }, []);

  if (!isVisible || results.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white text-left shadow-lg"
    >
      {results.map((result) => {
        const isSubcategory = result.type === "subcategory";
        const item = result.item;

        const content = (
          <>
            <div className="flex-shrink-0">
              {isSubcategory ? (
                <User className="h-4 w-4 text-gray-500" aria-hidden="true" />
              ) : (
                <Building2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-left font-medium text-gray-900">
                {item.name}
              </div>
              {isSubcategory && result.parentArea && (
                <div className="truncate text-left text-sm text-gray-500">
                  {result.parentArea.name}
                </div>
              )}
              {!isSubcategory && (
                <div className="truncate text-left text-sm text-gray-500">
                  Categoria completa
                </div>
              )}
            </div>

            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
          </>
        );

        if (!navigateOnSelect) {
          return (
            <button
              key={`${result.type}-${item.id}`}
              type="button"
              onClick={() => handleSuggestionClick(result)}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
            >
              {content}
            </button>
          );
        }

        return (
          <Link
            key={`${result.type}-${item.id}`}
            href={getSuggestionLink(result)}
            onClick={() => handleSuggestionClick(result)}
            className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export const SearchSuggestions = memo(SearchSuggestionsComponent);
