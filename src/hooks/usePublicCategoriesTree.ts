'use client';

import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { PublicCategoriesTree } from '@/lib/api/professionals';

const EMPTY_TREE: PublicCategoriesTree = {
  areas: [],
  subcategoriesOficios: [],
  subcategoriesProfesiones: [],
};

const PublicCategoriesTreeContext = createContext<PublicCategoriesTree>(EMPTY_TREE);

export function PublicCategoriesTreeProvider({
  children,
  data,
}: {
  children: ReactNode;
  data: PublicCategoriesTree;
}) {
  return createElement(PublicCategoriesTreeContext.Provider, { value: data }, children);
}

export function usePublicCategoriesTree() {
  const data = useContext(PublicCategoriesTreeContext);

  return {
    data,
    loading: false,
    error: null,
  };
}
