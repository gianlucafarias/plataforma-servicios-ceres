import { apiRequest } from '@/lib/api/client';
import { validateUpload } from '@/lib/uploadValidator';

export type PrivateDocumentUploadGrant = {
  token: string;
  expiresAt: string;
};

export type PrivateUploadedDocument = {
  objectKey: string;
  fileName: string;
  originalName: string;
  storage: 'r2' | 'local';
};

export async function requestPrivateDocumentUploadGrant() {
  const { data } = await apiRequest<PrivateDocumentUploadGrant>('/documents/upload/grant', {
    method: 'POST',
    json: {
      context: 'documentation',
      type: 'document',
    },
  });

  return data;
}

export async function uploadPrivateDocument(
  file: File,
  options: {
    uploadToken?: string | null;
  } = {}
) {
  const validation = validateUpload(file, 'cv');
  if (!validation.valid) {
    throw new Error(validation.error || 'Archivo inválido');
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers = new Headers();
  if (options.uploadToken) {
    headers.set('x-upload-token', options.uploadToken);
  }

  const { data } = await apiRequest<PrivateUploadedDocument>('/documents/upload', {
    method: 'POST',
    body: formData,
    headers,
  });

  return data;
}

export async function uploadPrivateRegistrationDocument(file: File) {
  const grant = await requestPrivateDocumentUploadGrant();
  return uploadPrivateDocument(file, { uploadToken: grant.token });
}
