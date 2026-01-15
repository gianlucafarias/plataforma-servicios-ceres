/**
 * Constantes de diseño reutilizables para toda la aplicación
 * Basadas en el nuevo diseño del Portal de Servicios
 */

// Colores principales
export const COLORS = {
  primary: "#006A55", // Deep Teal
  secondary: "#F59E0B", // Amber/Gold
  backgroundLight: "#F9FAFB",
  backgroundDark: "#111827",
  surfaceLight: "#FFFFFF",
  surfaceDark: "#1F2937",
  subtleLight: "#E5E7EB",
  subtleDark: "#374151",
} as const;

// Border radius
export const BORDER_RADIUS = {
  sm: "0.5rem", // rounded-lg
  md: "0.75rem", // rounded-xl (default)
  lg: "1rem", // rounded-2xl
  xl: "1.5rem", // rounded-3xl
  full: "9999px", // rounded-full
} as const;

// Box shadows
export const SHADOWS = {
  soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
  softHover: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
} as const;

// Tamaños de componentes
export const SIZES = {
  avatar: {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  },
  button: {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  },
  card: {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  },
} as const;

// Clases de utilidad predefinidas
export const UTILITY_CLASSES = {
  // Transiciones
  transition: "transition-all duration-300",
  transitionFast: "transition-all duration-200",
  transitionSlow: "transition-all duration-500",
  
  // Hover effects
  hoverLift: "hover:-translate-y-0.5 hover:shadow-lg",
  hoverScale: "hover:scale-105",
  
  // Backgrounds con blur
  backdropBlur: "backdrop-blur-md",
  backdropBlurSm: "backdrop-blur-sm",
  
  // Borders
  borderSubtle: "border border-gray-100 dark:border-gray-700",
  borderPrimary: "border border-primary",
  
  // Rounded
  roundedDefault: "rounded-xl",
  roundedFull: "rounded-full",
  rounded2xl: "rounded-2xl",
  rounded3xl: "rounded-3xl",
} as const;

// Clases combinadas para componentes comunes
export const COMPONENT_CLASSES = {
  // Card básica
  card: `${UTILITY_CLASSES.rounded2xl} ${UTILITY_CLASSES.borderSubtle} bg-white dark:bg-surface-dark ${SHADOWS.soft} ${UTILITY_CLASSES.transition}`,
  
  // Card con hover
  cardHover: `${UTILITY_CLASSES.rounded2xl} ${UTILITY_CLASSES.borderSubtle} bg-white dark:bg-surface-dark ${SHADOWS.soft} hover:${SHADOWS.softHover} ${UTILITY_CLASSES.transition} ${UTILITY_CLASSES.hoverLift}`,
  
  // Botón primario
  buttonPrimary: `bg-primary hover:bg-emerald-800 text-white ${UTILITY_CLASSES.roundedFull} ${UTILITY_CLASSES.transition} font-semibold shadow-lg`,
  
  // Botón secundario
  buttonSecondary: `bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${UTILITY_CLASSES.roundedFull} ${UTILITY_CLASSES.borderSubtle} ${UTILITY_CLASSES.transition} font-semibold shadow-sm hover:shadow-md`,
  
  // Input de búsqueda
  searchInput: `flex-grow bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-200 px-6 py-3 placeholder-gray-400 ${UTILITY_CLASSES.transition}`,
  
  // Badge
  badge: `px-3 py-1.5 ${UTILITY_CLASSES.roundedFull} text-sm font-medium ${UTILITY_CLASSES.transition}`,
} as const;
