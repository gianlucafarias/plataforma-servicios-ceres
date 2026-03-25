export const CATEGORY_ICON_OPTIONS = [
  { value: 'wrench', label: 'Herramientas generales' },
  { value: 'hammer', label: 'Obra y reparaciones' },
  { value: 'construction', label: 'Construccion' },
  { value: 'ruler', label: 'Arquitectura y carpinteria' },
  { value: 'paintbrush', label: 'Pintura y acabados' },
  { value: 'lightbulb', label: 'Electricidad e instalaciones' },
  { value: 'droplets', label: 'Plomeria y agua' },
  { value: 'snowflake', label: 'Climatizacion' },
  { value: 'car', label: 'Automotores' },
  { value: 'truck', label: 'Mudanzas y traslados' },
  { value: 'smartphone', label: 'Celulares y dispositivos' },
  { value: 'tv', label: 'Electrodomesticos y TV' },
  { value: 'laptop', label: 'Informatica y soporte tecnico' },
  { value: 'tree-pine', label: 'Jardineria y paisajismo' },
  { value: 'leaf', label: 'Espacios verdes' },
  { value: 'chef-hat', label: 'Cocina y gastronomia' },
  { value: 'utensils-crossed', label: 'Alimentos y eventos' },
  { value: 'heart', label: 'Cuidados y bienestar' },
  { value: 'baby', label: 'Cuidados infantiles' },
  { value: 'stethoscope', label: 'Salud' },
  { value: 'pill', label: 'Atencion medica' },
  { value: 'shield', label: 'Seguridad' },
  { value: 'lock', label: 'Cerrajeria' },
  { value: 'scale', label: 'Legal y normativo' },
  { value: 'file-text', label: 'Administracion y contabilidad' },
  { value: 'megaphone', label: 'Marketing y comunicacion' },
  { value: 'pen-tool', label: 'Diseno y proyectos' },
  { value: 'book-open', label: 'Educacion y capacitacion' },
  { value: 'shopping-bag', label: 'Comercio y ventas' },
  { value: 'camera', label: 'Foto y video' },
  { value: 'music', label: 'Musica y entretenimiento' },
  { value: 'shirt', label: 'Costura e indumentaria' },
  { value: 'sparkles', label: 'Limpieza y cuidado del hogar' },
  { value: 'home', label: 'Hogar' },
  { value: 'settings', label: 'Mantenimiento tecnico' },
  { value: 'cog', label: 'Mecanica de precision' },
  { value: 'bolt', label: 'Servicios tecnicos electronicos' },
  { value: 'briefcase', label: 'Servicios profesionales' },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_OPTIONS)[number]['value'];

const CATEGORY_ICON_KEY_SET = new Set<string>(CATEGORY_ICON_OPTIONS.map((option) => option.value));

export const FALLBACK_CATEGORY_ICON_BY_SLUG: Partial<Record<string, CategoryIconKey>> = {
  automotores: 'car',
  climatizacion: 'snowflake',
  'construccion-mantenimiento': 'construction',
  'servicios-tecnicos-electronicos': 'bolt',
  'servicios-electronicos': 'bolt',
  jardineria: 'tree-pine',
  cocina: 'chef-hat',
  gastronomia: 'utensils-crossed',
  cuidados: 'heart',
  salud: 'stethoscope',
  'fletes-mudanzas': 'truck',
  transporte: 'truck',
  cerrajeria: 'lock',
  seguridad: 'shield',
  costura: 'shirt',
  limpieza: 'sparkles',
  abogacia: 'scale',
  arquitectura: 'ruler',
  contaduria: 'file-text',
  enfermeria: 'stethoscope',
  'entrenadores-fisicos': 'heart',
  marketing: 'megaphone',
  albanil: 'hammer',
  carpintero: 'ruler',
  cerrajero: 'lock',
  chapista: 'paintbrush',
  electricista: 'lightbulb',
  gasista: 'lightbulb',
  gomero: 'car',
  herrero: 'hammer',
  jardinero: 'leaf',
  mecanico: 'cog',
  'mecanico-automotriz': 'car',
  'mecanico-motos': 'cog',
  ninera: 'baby',
  paisajista: 'tree-pine',
  panificados: 'chef-hat',
  pasteleria: 'chef-hat',
  'pintor-obra': 'paintbrush',
  plomero: 'droplets',
  'promotores-gerontologicos': 'heart',
  refrigeracion: 'snowflake',
  'reparador-electrodomesticos': 'tv',
  techista: 'home',
  'tecnico-aires': 'snowflake',
  'tecnico-celulares': 'smartphone',
  yesero: 'construction',
};

export function isCategoryIconKey(value: unknown): value is CategoryIconKey {
  return typeof value === 'string' && CATEGORY_ICON_KEY_SET.has(value);
}

export function resolveCategoryIconKey(
  icon: string | null | undefined,
  slug: string | null | undefined
): CategoryIconKey {
  if (isCategoryIconKey(icon)) {
    return icon;
  }

  if (slug && FALLBACK_CATEGORY_ICON_BY_SLUG[slug]) {
    return FALLBACK_CATEGORY_ICON_BY_SLUG[slug] as CategoryIconKey;
  }

  return 'briefcase';
}
