// Tipos principales para la plataforma de servicios

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Para compatibilidad con NextAuth
  image?: string; // Foto de perfil (puede ser URL de OAuth o ruta local)
  phone?: string;
  birthDate?: Date;
  location?: string;
  role?: 'citizen' | 'professional' | 'admin';
  createdAt?: Date;
  verified?: boolean;
}

// Jerarquía de categorías: grupos principales y subcategorías
export type CategoryGroup = 'oficios' | 'profesiones';

export interface CategoryGroupMeta {
  id: CategoryGroup;
  name: string; // Ej: "Oficios", "Profesiones"
  slug: CategoryGroup; // para rutas: /oficios, /profesiones
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  slug: string;
  active: boolean;
  backgroundUrl?: string;
  // Nuevo: a qué grupo pertenece esta categoría (oficios o profesiones)
  group: CategoryGroup;
  // Opcional: subcategoría padre si modelamos niveles adicionales (p.ej. Construcción y mantenimiento)
  parentCategoryId?: string;
}

export interface Professional {
  id: string;
  userId: string;
  user?: User;
  location?: string; // ubicación textual (ej: "Ceres")
  bio: string;
  experienceYears: number;
  verified: boolean;
  status: 'pending' | 'active' | 'suspended';
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  services?: Service[]; // para vistas que incluyen servicios
}

export interface Service {
  id: string;
  professionalId: string;
  professional?: Professional;
  // Soporta subcategorías: mantener categoryId como hoja
  categoryId: string;
  category?: Category;
  // Redundante/denormalizado para facilitar filtros rápidos por grupo
  categoryGroup?: CategoryGroup;
  title: string;
  description: string;
  priceRange: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  professionalId: string;
  professional?: Professional;
  userId: string;
  user?: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface ContactRequest {
  id: string;
  professionalId: string;
  professional?: Professional;
  userId: string;
  user?: User;
  serviceId?: string;
  service?: Service;
  message: string;
  status: 'pending' | 'contacted' | 'closed';
  createdAt: Date;
}

// Tipos para formularios
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  birthDate?: string;
  location?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  cv?: string;
  picture?: string;
  role?: 'citizen' | 'professional';
  // Datos profesionales
  bio?: string;
  experienceYears?: number;
  professionalGroup?: CategoryGroup;
  serviceLocations?: string[];
  hasPhysicalStore?: boolean;
  physicalStoreAddress?: string;
  services?: ServiceFormData[];
}

export interface ProfessionalFormData {
  bio: string;
  experienceYears: number;
  services: ServiceFormData[];
}

export interface ServiceFormData {
  categoryId: string;
  title: string;
  description: string;
}

export interface ContactFormData {
  message: string;
  serviceId?: string;
}

// Tipos para filtros y búsqueda
export interface ServiceFilters {
  categoryId?: string; // subcategoría concreta
  parentCategoryId?: string; // para agrupar bajo una subcategoría padre
  categoryGroup?: CategoryGroup; // 'oficios' | 'profesiones'
  search?: string;
  rating?: number;
  sortBy?: 'name' | 'rating' | 'recent';
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Capacitación / Formación
export interface Training {
  id: string;
  title: string;
  description: string;
  modality: 'presencial' | 'virtual' | 'mixta';
  startDate: Date;
  location: string;
  registrationUrl?: string;
  imageUrl?: string;
  tags?: string[];
}

