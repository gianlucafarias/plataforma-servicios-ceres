import { CategoryGroup } from "@/types";

export type Area = {
  id: string;
  name: string;
  slug: string;
  group: CategoryGroup;
  image?: string;
  /**
   * Clave opcional para asociar un ícono en el frontend (ej: 'wrench', 'snowflake').
   * El mapeo de esta clave a un icono concreto (lucide, etc.) se hace en la UI,
   * no acá, para mantener esta capa libre de dependencias de componentes.
   */
  iconKey?: string;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  group: CategoryGroup;
  areaSlug?: string; 
  image?: string;
};

export type Location = {
  id: string;
  name: string;
};

export const GROUPS: { id: CategoryGroup; name: string }[] = [
  { id: "oficios", name: "Oficios" },
  { id: "profesiones", name: "Profesiones" },
];

export type Gender = {
  id: string;
  name: string;
};

// Áreas (solo aplican a Oficios)
export const AREAS_OFICIOS: Area[] = [
  {
    id: "area-construccion-mantenimiento",
    name: "Construcción y mantenimiento",
    slug: "construccion-mantenimiento",
    group: "oficios",
    image: "/images/servicios/construccion.jpg",
    iconKey: "wrench",
  },
  {
    id: "area-climatizacion",
    name: "Climatización",
    slug: "climatizacion",
    group: "oficios",
    image: "/images/servicios/climatizacion.jpg",
    iconKey: "snowflake",
  },
  {
    id: "area-servicios-electronicos",
    name: "Servicios técnicos electrónicos",
    slug: "servicios-electronicos",
    group: "oficios",
    image: "/images/servicios/electricista.webp",
    iconKey: "bolt",
  },
  {
    id: "area-automotores",
    name: "Automotores",
    slug: "automotores",
    group: "oficios",
    image: "/images/servicios/automotores.jpg",
    iconKey: "car",
  },
  {
    id: "area-jardineria",
    name: "Jardinería",
    slug: "jardineria",
    group: "oficios",
    image: "/images/servicios/jardineria.jpg",
    iconKey: "tree",
  },
  {
    id: "area-cocina",
    name: "Cocina",
    slug: "cocina",
    group: "oficios",
    image: "/images/servicios/cocina.jpg",
    iconKey: "chef-hat"
  },
  {
    id: "area-cuidados",
    name: "Cuidados",
    slug: "cuidados",
    group: "oficios",
    image: "/images/servicios/cuidados.jpg",
    iconKey: "heart",
  },
  {
    id: "area-fletes-mudanzas",
    name: "Fletes y mudanzas",
    slug: "fletes-mudanzas",
    group: "oficios",
    image: "/images/servicios/fletes-mudanzas.jpg",
    iconKey: "truck",
  },
  {
    id: "area-limpieza",
    name: "Limpieza",
    slug: "limpieza",
    group: "oficios",
    image: "/images/servicios/limpieza.jpg",
    iconKey: "cleaning-1",
  },
  {
    id: "area-cerrajeria",
    name: "Cerrajería",
    slug: "cerrajeria",
    group: "oficios",
    image: "/images/servicios/cerrajeria.jpg",
    iconKey: "lock",
  },
  {
    id: "area-costura",
    name: "Costura",
    slug: "costura",
    group: "oficios",
    image: "/images/servicios/costura.jpg",
    iconKey: "needle",
  },
];

// Subcategorías de Oficios
export const SUBCATEGORIES_OFICIOS: Subcategory[] = [
  // Construcción y mantenimiento
  { id: "plomero", name: "Plomero/a", slug: "plomero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "electricista", name: "Electricista", slug: "electricista", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "albanil", name: "Albañil", slug: "albanil", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "gasista", name: "Gasista", slug: "gasista", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "pintor-obra", name: "Pintor de obra", slug: "pintor-obra", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "carpintero", name: "Carpintero/a", slug: "carpintero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "herrero", name: "Herrero/a", slug: "herrero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "yesero", name: "Yesero", slug: "yesero", group: "oficios", areaSlug: "construccion-mantenimiento" },
  { id: "techista", name: "Techista", slug: "techista", group: "oficios", areaSlug: "construccion-mantenimiento" },

  // Climatización
  { id: "tecnico-aires", name: "Técnico en aires acondicionados", slug: "tecnico-aires", group: "oficios", areaSlug: "climatizacion" },
  { id: "refrigeracion", name: "Refrigeración comercial y hogareña", slug: "refrigeracion", group: "oficios", areaSlug: "climatizacion" },

  // Servicios técnicos electrónicos
  { id: "reparador-electrodomesticos", name: "Reparador de electrodomésticos", slug: "reparador-electrodomesticos", group: "oficios", areaSlug: "servicios-electronicos" },
  { id: "tecnico-celulares", name: "Técnico en celulares y tablets", slug: "tecnico-celulares", group: "oficios", areaSlug: "servicios-electronicos" },

  // Automotores
  { id: "mecanico-automotriz", name: "Mecánico automotriz", slug: "mecanico-automotriz", group: "oficios", areaSlug: "automotores" },
  { id: "mecanico-motos", name: "Mecánico de motos", slug: "mecanico-motos", group: "oficios", areaSlug: "automotores" },
  { id: "chapista", name: "Chapista", slug: "chapista", group: "oficios", areaSlug: "automotores" },
  { id: "gomero", name: "Gomería", slug: "gomero", group: "oficios", areaSlug: "automotores" },

  // Jardinería
  { id: "jardinero", name: "Jardinero/a", slug: "jardinero", group: "oficios", areaSlug: "jardineria" },
  { id: "paisajista", name: "Paisajista", slug: "paisajista", group: "oficios", areaSlug: "jardineria" },

  // Cocina
  { id: "pasteleria", name: "Pastelería", slug: "pasteleria", group: "oficios", areaSlug: "cocina" },
  { id: "panificados", name: "Panificados", slug: "panificados", group: "oficios", areaSlug: "cocina" },

  // Cuidados
  { id: "promotores-gerontologicos", name: "Promotores gerontológicos", slug: "promotores-gerontologicos", group: "oficios", areaSlug: "cuidados" },
  { id: "ninera", name: "Niñera", slug: "ninera", group: "oficios", areaSlug: "cuidados" },

  // Fletes y mudanzas (área sin subcategorías adicionales)
  { id: "fletes-mudanzas", name: "Fletes y mudanzas", slug: "fletes-mudanzas", group: "oficios", areaSlug: "fletes-mudanzas" },

  // Limpieza
  { id: "limpieza", name: "Limpieza", slug: "limpieza", group: "oficios", areaSlug: "limpieza" },

  // Cerrajería
  { id: "cerrajero", name: "Cerrajeros", slug: "cerrajero", group: "oficios", areaSlug: "cerrajeria" },

  // Costura
  { id: "costurera", name: "Costurera", slug: "costurera", group: "oficios", areaSlug: "costura" },
];

// Subcategorías de Profesiones
export const SUBCATEGORIES_PROFESIONES: Subcategory[] = [
  { id: "enfermeria", name: "Enfermería", slug: "enfermeria", group: "profesiones", image: "/images/profesionales/enfermeria.jpg" },
  { id: "arquitectura", name: "Arquitectura", slug: "arquitectura", group: "profesiones", image: "/images/profesionales/arquitectura.jpg" },
  { id: "marketing", name: "Marketing", slug: "marketing", group: "profesiones", image: "/images/profesionales/marketing.png" },
  { id: "abogacia", name: "Abogacía", slug: "abogacia", group: "profesiones", image: "/images/profesionales/abogacia.jpg" },
  { id: "contaduria", name: "Contaduría", slug: "contaduria", group: "profesiones", image: "/images/profesionales/contaduria.jpg" },
  { id: "entrenadores-fisicos", name: "Entrenadores físicos", slug: "entrenadores-fisicos", group: "profesiones", image: "/images/profesionales/entrenadores-fisicos.jpg" },
];

export const LOCATIONS: Location[] = [
  { id: "ceres", name: "Ceres, Santa Fe, Argentina" },
  { id: "hersilia", name: "Hersilia, Santa Fe, Argentina" },
  { id: "ambrosetti", name: "Ambrosetti, Santa Fe, Argentina" },
  { id: "larubia", name: "La Rubia, Santa Fe, Argentina" },
  { id: "arrufo", name: "Arrufó, Santa Fe, Argentina", },
  { id: "san-cristobal", name: "San Cristóbal, Santa Fe, Argentina" },
  { id: "san-guillermo", name: "San Guillermo, Santa Fe, Argentina" },
  { id: "suardi", name: "Suardi, Santa Fe, Argentina" }, 
  { id: "villa-trinidad", name: "Villa Trinidad, Santa Fe, Argentina" },
  { id: "tostado", name: "Tostado, Santa Fe, Argentina" },  
  { id: "otra", name: "Otra" },
];

export const GENDERS: Gender[] = [
  { id: "male", name: "Masculino" },
  { id: "female", name: "Femenino" },
  { id: "other", name: "Otro" },
];

export function getAreasByGroup(group: CategoryGroup): Area[] {
  return group === "oficios" ? AREAS_OFICIOS : [];
}

export function getSubcategories(group: CategoryGroup, areaSlug?: string): Subcategory[] {
  if (group === "oficios") {
    return SUBCATEGORIES_OFICIOS.filter((s) => !areaSlug || s.areaSlug === areaSlug);
  }
  return SUBCATEGORIES_PROFESIONES;
}

export function getLocations(): Location[] {
  return LOCATIONS;
}

export function getGenders(): Gender[] {
  return GENDERS;
}



