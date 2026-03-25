import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/seo";
import { CategoriesContent } from "@/app/categorias/_components/CategoriesContent";

export const metadata: Metadata = {
  title: "Categorías de Servicios en Ceres",
  description: "Explora todas las categorías de servicios profesionales disponibles en Ceres. Encuentra plomeros, electricistas, albañiles y más profesionales verificados.",
  alternates: {
    canonical: getAbsoluteUrl("/categorias"),
  },
  openGraph: {
    title: "Categorías de Servicios en Ceres | Ceres en Red",
    description: "Explora todas las categorías de servicios profesionales disponibles en Ceres. Encuentra exactamente lo que necesitas.",
    url: getAbsoluteUrl("/categorias"),
    siteName: "Ceres en Red",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Categorías de Servicios en Ceres",
    description: "Explora todas las categorías de servicios profesionales disponibles en Ceres.",
  },
};

export default function CategoriasPage() {
  return <CategoriesContent />;
}
