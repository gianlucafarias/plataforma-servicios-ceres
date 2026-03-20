import { apiRequest } from '@/lib/api/client';

export type SupportTopic = 'general' | 'bug' | 'improvement';

export type SupportContactPayload = {
  name?: string;
  email: string;
  topic: SupportTopic;
  message: string;
  origin?: string;
  url?: string | null;
  website?: string;
  openedAt?: number;
};

export type CategorySuggestionPayload = {
  suggestedName: string;
  description?: string;
  email: string;
  origin?: string;
  url?: string | null;
  website?: string;
  openedAt?: number;
};

type SupportResponse = {
  id?: string;
  ignored?: boolean;
  message: string;
};

export async function sendSupportContact(payload: SupportContactPayload) {
  const { data } = await apiRequest<SupportResponse>('/support/contact', {
    method: 'POST',
    json: payload,
  });

  return data;
}

export async function sendCategorySuggestion(payload: CategorySuggestionPayload) {
  const { data } = await apiRequest<SupportResponse>('/support/category-suggestions', {
    method: 'POST',
    json: payload,
  });

  return data;
}

