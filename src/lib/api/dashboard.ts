import { apiRequest } from '@/lib/api/client';
import type { ProfessionalDocumentation } from '@/types';

export type DashboardScheduleSlot = {
  enabled: boolean;
  start: string;
  end: string;
};

export type DashboardScheduleDay = {
  fullDay?: boolean;
  morning?: DashboardScheduleSlot;
  afternoon?: DashboardScheduleSlot;
  workOnHolidays?: boolean;
};

export type DashboardSchedule = Record<string, DashboardScheduleDay>;

export type DashboardServiceRecord = {
  id: string;
  professionalId: string;
  categoryId: string;
  categoryGroup: 'oficios' | 'profesiones' | null;
  title: string;
  description: string;
  priceRange: string;
  available: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  category: {
    name: string;
  };
};

export type DashboardProfile = {
  id: string;
  status: 'pending' | 'active' | 'suspended';
  bio: string;
  experienceYears: number | null;
  verified: boolean;
  rating: number | null;
  reviewCount: number | null;
  documentationRequired?: boolean;
  criminalRecordPresent?: boolean;
  hasLaborReferences?: boolean;
  specialties: string[];
  professionalGroup: 'oficios' | 'profesiones' | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  portfolio: string | null;
  CV: string | null;
  ProfilePicture: string | null;
  location: string | null;
  serviceLocations: string[];
  hasPhysicalStore: boolean;
  physicalStoreAddress: string | null;
  schedule: DashboardSchedule | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    verified: boolean;
    birthDate: string | null;
    location: string | null;
  };
  services: DashboardServiceRecord[];
  documentation?: ProfessionalDocumentation;
  registrationType: 'email' | 'google' | 'facebook';
};

export type DashboardStats = {
  services: {
    active: number;
    total: number;
    inactive: number;
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  profile: {
    verified: boolean;
    status: string;
    experienceYears: number;
    locations: number;
    views: number;
    since: string;
  };
};

export type ProfessionalCertification = {
  id: string;
  categoryId: string | null;
  certificationType: string;
  certificationNumber: string;
  issuingOrganization: string;
  issueDate: string | null;
  expiryDate: string | null;
  documentUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type CertificationPayload = {
  categoryId?: string | null;
  certificationType: string;
  certificationNumber: string;
  issuingOrganization: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  documentUrl?: string | null;
};

type UpdateProfileResponse = {
  message: string;
  profile: DashboardProfile;
};

type CreateCertificationResponse = {
  message: string;
  certification: ProfessionalCertification;
};

export async function getDashboardProfile() {
  const { data } = await apiRequest<DashboardProfile>('/professional/me', {
    method: 'GET',
  });

  return data;
}

export async function updateDashboardProfile(payload: Record<string, unknown>) {
  const { data } = await apiRequest<UpdateProfileResponse>('/professional/me', {
    method: 'PUT',
    json: payload,
  });

  return data;
}

export async function updateDashboardSchedule(schedule: DashboardSchedule) {
  const { data } = await apiRequest<UpdateProfileResponse>('/professional/schedule', {
    method: 'PUT',
    json: { schedule },
  });

  return data;
}

export async function getDashboardStats() {
  const { data } = await apiRequest<DashboardStats>('/professional/stats', {
    method: 'GET',
  });

  return data;
}

export async function listDashboardCertifications() {
  const { data } = await apiRequest<ProfessionalCertification[]>('/professional/certifications', {
    method: 'GET',
  });

  return data;
}

export async function createDashboardCertification(payload: CertificationPayload) {
  const { data } = await apiRequest<CreateCertificationResponse>('/professional/certifications', {
    method: 'POST',
    json: payload,
  });

  return data;
}

