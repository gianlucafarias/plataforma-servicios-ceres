// src/types/api.ts - Tipos específicos para la API
import { User } from './index';

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  role: 'citizen' | 'professional' | 'admin';
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface CreateProfessionalData {
  userId: string;
  bio: string;
  experienceYears: number;
  professionalGroup: 'oficios' | 'profesiones';
  specialties: string[];
  whatsapp?: string;
  location: string;
}

export interface UpdateProfessionalData {
  bio?: string;
  experienceYears?: number;
  specialties?: string[];
  whatsapp?: string;
  location?: string;
}

export interface ProfessionalFilters {
  search?: string;
  categoryId?: string;
  categoryGroup?: 'oficios' | 'profesiones';
  rating?: number;
  status?: 'pending' | 'active' | 'suspended';
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'recent';
}

// Respuestas de API estandarizadas
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
