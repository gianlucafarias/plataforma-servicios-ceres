/**
 * Utilidades para SEO y metadata
 */

/**
 * Obtiene la URL base del sitio
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Cliente: usar window.location
    return window.location.origin;
  }
  
  // Servidor: usar variables de entorno
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3003');
  
  // Asegurar que tenga protocolo
  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return baseUrl;
  }
  
  return `https://${baseUrl}`;
}

/**
 * Genera una URL completa para una ruta
 */
export function getAbsoluteUrl(path: string): string {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Tipo para structured data de Schema.org
 */
type StructuredData = {
  "@context": string;
  "@type": string;
  "@id"?: string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  address?: {
    "@type": string;
    addressLocality?: string;
    addressRegion?: string;
    addressCountry?: string;
  };
  telephone?: string;
  email?: string;
  sameAs?: string[];
  hasOfferCatalog?: {
    "@type": string;
    name: string;
    itemListElement: Array<{
      "@type": string;
      itemOffered: {
        "@type": string;
        name: string;
        description?: string;
      };
      position: number;
    }>;
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: number;
    reviewCount: number;
  };
  jobTitle?: string;
};

/**
 * Genera structured data JSON-LD para un profesional
 */
export function generateProfessionalStructuredData(professional: {
  id: string;
  name: string;
  bio: string;
  category?: string;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  services: Array<{ title: string; description?: string }>;
  image?: string;
}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/profesionales/${professional.id}`;
  
  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": url,
    "name": professional.name,
    "description": professional.bio,
    "url": url,
  };

  // Agregar imagen si existe
  if (professional.image) {
    structuredData.image = professional.image.startsWith('http')
      ? professional.image
      : `${baseUrl}${professional.image}`;
  }

  // Agregar ubicación
  if (professional.location) {
    structuredData.address = {
      "@type": "PostalAddress",
      "addressLocality": professional.location,
      "addressRegion": "Santa Fe",
      "addressCountry": "AR"
    };
  }

  // Agregar contacto
  if (professional.phone) {
    structuredData.telephone = professional.phone;
  }
  if (professional.email) {
    structuredData.email = professional.email;
  }

  // Agregar sitio web
  if (professional.website) {
    structuredData.sameAs = [professional.website];
  }

  // Agregar servicios ofrecidos
  if (professional.services.length > 0) {
    structuredData.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": "Servicios Profesionales",
      "itemListElement": professional.services.map((service, index) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.title,
          "description": service.description || service.title
        },
        "position": index + 1
      }))
    };
  }

  // Agregar rating si existe
  if (professional.rating && professional.reviewCount) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": professional.rating,
      "reviewCount": professional.reviewCount
    };
  }

  // Si tiene categoría, agregar como jobTitle
  if (professional.category) {
    structuredData.jobTitle = professional.category;
  }

  return structuredData;
}

/**
 * Genera structured data JSON-LD para la organización
 */
export function generateOrganizationStructuredData() {
  const baseUrl = getBaseUrl();
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ceres en Red",
    "alternateName": "Ceres en Red -Gobierno de la Ciudad de Ceres",
    "url": baseUrl,
    "logo": `${baseUrl}/gob_iso.png`,
    "description": "Plataforma oficial de servicios profesionales del Gobierno de la Ciudad de Ceres",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ceres",
      "addressRegion": "Santa Fe",
      "addressCountry": "AR"
    },
    "sameAs": [
      // Agregar redes sociales si existen
    ]
  };
}

/**
 * Genera breadcrumbs structured data
 */
export function generateBreadcrumbsStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
