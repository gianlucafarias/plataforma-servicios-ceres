"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryItemProps {
  name: string;
  slug: string;
  icon: LucideIcon | null;
  isActive: boolean;
  subcategories: Array<{ slug: string; name: string; count?: number }>;
  selectedSubcategory?: string;
  onSelect: () => void;
  onSelectSubcategory: (slug: string) => void;
}

export function CategoryItem({ 
  name, 
  icon: Icon, 
  isActive, 
  subcategories, 
  selectedSubcategory,
  onSelect, 
  onSelectSubcategory 
}: CategoryItemProps) {
  const hasActiveSubcategory = subcategories.some(sub => sub.slug === selectedSubcategory);
  // Abrimos por defecto si hay una subcategoría activa, pero luego permitimos cerrar manualmente
  const [isOpen, setIsOpen] = useState(hasActiveSubcategory);

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            onSelect();
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
          isActive && !selectedSubcategory
            ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && <Icon className={`h-5 w-5 ${isActive && !selectedSubcategory ? 'text-primary' : 'text-gray-400'}`} />}
          {!Icon && <span className={`w-1.5 h-1.5 rounded-full ${isActive && !selectedSubcategory ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></span>}
          <span className="truncate">{name}</span>
        </div>
        {subcategories.length > 0 && (
          <div className="flex-shrink-0">
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )}
      </button>
      
      {isOpen && subcategories.length > 0 && (
        <div className="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          {subcategories.map((subcategory) => {
            const isSubActive = selectedSubcategory === subcategory.slug;
            return (
              <button
                key={subcategory.slug}
                onClick={() => onSelectSubcategory(subcategory.slug)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  isSubActive
                    ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="truncate">{subcategory.name}</span>
                {typeof subcategory.count === 'number' && subcategory.count > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {subcategory.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
