import type { CategoryGroup, RegisterFormData, User } from '@/types';
import { apiRequest } from '@/lib/api/client';

export type ServiceDraft = {
  categoryId: string;
  title: string;
  description: string;
};

export type CompleteProfilePayload = {
  dni: string;
  gender: string;
  birthDate: string;
  phone: string;
  location: string;
  bio: string;
  experienceYears: number;
  professionalGroup: CategoryGroup;
  serviceLocations: string[];
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  cv?: string;
  picture?: string;
  hasPhysicalStore?: boolean;
  physicalStoreAddress?: string;
  services: ServiceDraft[];
};

type RegisterResponse = {
  message: string;
  user: User;
  professional?: unknown;
  devVerifyUrl?: string;
};

type ForgotPasswordResponse = {
  accepted: boolean;
  message: string;
};

type VerifyResponse = {
  message: string;
};

type CheckEmailResponse = {
  exists: boolean;
};

type ResendVerifyResponse = {
  message: string;
  alreadyVerified?: boolean;
};

export async function registerUser(payload: RegisterFormData) {
  const { data } = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    json: payload,
  });

  return data;
}

export async function checkEmailExists(email: string) {
  const { data } = await apiRequest<CheckEmailResponse>('/auth/check-email', {
    method: 'POST',
    json: { email },
  });

  return data.exists;
}

export async function requestPasswordReset(email: string) {
  const { data } = await apiRequest<ForgotPasswordResponse>('/auth/password/forgot', {
    method: 'POST',
    json: { email },
  });

  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await apiRequest<{ success?: boolean }>('/auth/password/reset', {
    method: 'POST',
    json: { token, password },
  });

  return data;
}

export async function verifyAccount(token: string | null, email: string | null) {
  const { data } = await apiRequest<VerifyResponse>('/auth/verify', {
    method: 'POST',
    json: { token, email },
  });

  return data;
}

export async function resendVerification(email: string) {
  const { data } = await apiRequest<ResendVerifyResponse>('/auth/verify/resend', {
    method: 'POST',
    json: { email },
  });

  return data;
}

export async function completeProfessionalProfile(payload: CompleteProfilePayload) {
  const { data } = await apiRequest<unknown>('/auth/complete-profile', {
    method: 'POST',
    json: payload,
  });

  return data;
}

