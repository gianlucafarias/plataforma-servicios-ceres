import { useMemo, useEffect, useRef, useCallback, memo } from "react";
import { SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES, AREAS_OFICIOS, Subcategory, Area } from "@/lib/taxonomy";
import Link from "next/link";
import { Search, Building2, User } from "lucide-react";

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

interface SearchResult {
  type: 'subcategory' | 'area';
  item: Subcategory | Area;
  parentArea?: Area;
}

// Pre-calcular mapa de áreas para búsqueda O(1)
const AREAS_MAP = new Map(AREAS_OFICIOS.map(area => [area.slug, area]));

function SearchSuggestionsComponent({ query, isVisible, onSelect, onClose }: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoizar resultados de búsqueda
  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 1) {
      return [];
    }

    const searchTerm = trimmed.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Buscar en subcategorías de oficios
    for (const subcategory of SUBCATEGORIES_OFICIOS) {
      if (subcategory.name.toLowerCase().includes(searchTerm)) {
        const parentArea = subcategory.areaSlug ? AREAS_MAP.get(subcategory.areaSlug) : undefined;
        searchResults.push({
          type: 'subcategory',
          item: subcategory,
          parentArea
        });
      }
    }

    // Buscar en subcategorías de profesiones
    for (const subcategory of SUBCATEGORIES_PROFESIONES) {
      if (subcategory.name.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: 'subcategory',
          item: subcategory,
          parentArea: undefined
        });
      }
    }

    // Buscar en áreas directamente
    for (const area of AREAS_OFICIOS) {
      if (area.name.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: 'area',
          item: area,
          parentArea: undefined
        });
      }
    }

    // Limitar a 8 resultados
    return searchResults.slice(0, 8);
  }, [query]);

  // Click outside handler
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  // Memoizar handlers
  const handleSuggestionClick = useCallback((result: SearchResult) => {
    onSelect(result.item.name);
  }, [onSelect]);

  const getSuggestionLink = useCallback((result: SearchResult) => {
    if (result.type === 'subcategory') {
      const subcategory = result.item as Subcategory;
      if (subcategory.group === 'oficios' && result.parentArea) {
        return `/servicios?grupo=${subcategory.group}&categoria=${result.parentArea.slug}&subcategoria=${subcategory.slug}`;
      } else if (subcategory.group === 'profesiones') {
        return `/profesionales?categoria=${subcategory.slug}`;
      }
    } else {
      const area = result.item as Area;
      return `/servicios?grupo=${area.group}&categoria=${area.slug}`;
    }
    return '#';
  }, []);

  if (!isVisible || results.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto text-left"
    >
      {results.map((result) => {
        const isSubcategory = result.type === 'subcategory';
        const item = result.item;
        
        return (
          <Link
            key={`${result.type}-${item.id}`}
            href={getSuggestionLink(result)}
            onClick={() => handleSuggestionClick(result)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
          >
            <div className="flex-shrink-0">
              {isSubcategory ? (
                <User className="h-4 w-4 text-gray-500" />
              ) : (
                <Building2 className="h-4 w-4 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <div className="font-medium text-gray-900 truncate text-left">
                {item.name}
              </div>
              {isSubcategory && result.parentArea && (
                <div className="text-sm text-gray-500 truncate text-left">
                  {result.parentArea.name}
                </div>
              )}
              {!isSubcategory && (
                <div className="text-sm text-gray-500 truncate text-left">
                  Categoría completa
                </div>
              )}
            </div>
            
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

export const SearchSuggestions = memo(SearchSuggestionsComponent);
