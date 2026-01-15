"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CategoryWithCount } from "@/hooks/useCategoriesWithCount";

interface CategoryDropdownProps {
  category: CategoryWithCount;
  isActive: boolean;
  onSelect: (slug: string) => void;
  onSelectSubcategory: (slug: string) => void;
  selectedSubcategory?: string;
}

export function CategoryDropdown({ category, isActive, onSelect, onSelectSubcategory, selectedSubcategory }: CategoryDropdownProps) {
  // Abrir automáticamente si alguna subcategoría está seleccionada
  const hasActiveSubcategory = category.subcategories?.some(sub => sub.slug === selectedSubcategory);
  const [isOpen, setIsOpen] = useState(hasActiveSubcategory || false);
  
  // Actualizar estado cuando cambia la subcategoría seleccionada
  useEffect(() => {
    if (hasActiveSubcategory && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveSubcategory, isOpen]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            onSelect(category.slug);
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
          isActive
            ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {category.professionalCount}
          </span>
          <span className="truncate">{category.name}</span>
        </div>
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
      </button>
      
      {isOpen && category.subcategories && category.subcategories.length > 0 && (
        <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          {category.subcategories.map((subcategory) => {
            const isSubActive = selectedSubcategory === subcategory.slug;
            return (
              <button
                key={subcategory.id}
                onClick={() => onSelectSubcategory(subcategory.slug)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  isSubActive
                    ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="truncate">{subcategory.name}</span>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                  {subcategory.professionalCount}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
