import { apiRequest } from '@/lib/api/client';

export type UploadFileType = 'image' | 'cv';
export type UploadStorage = 'r2' | 'local';

export type UploadGrant = {
  token: string;
  expiresAt: string;
};

export type UploadedFile = {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  value: string;
  storage: UploadStorage;
  fileType: UploadFileType;
};

export type ExternalUpload = {
  url: string;
  value: string;
};

export async function requestUploadGrant(type: UploadFileType) {
  const { data } = await apiRequest<UploadGrant>('/upload/grant', {
    method: 'POST',
    json: {
      context: 'register',
      type,
    },
  });

  return data;
}

export async function uploadFile(
  file: File,
  type: UploadFileType,
  options: {
    uploadToken?: string | null;
  } = {}
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const headers = new Headers();
  if (options.uploadToken) {
    headers.set('x-upload-token', options.uploadToken);
  }

  const { data } = await apiRequest<UploadedFile>('/upload', {
    method: 'POST',
    body: formData,
    headers,
  });

  return data;
}

export async function uploadRegistrationFile(file: File, type: UploadFileType) {
  const grant = await requestUploadGrant(type);
  return uploadFile(file, type, { uploadToken: grant.token });
}

export async function uploadExternalOAuthImage(imageUrl: string) {
  const { data } = await apiRequest<ExternalUpload>('/upload/external', {
    method: 'POST',
    json: { imageUrl },
  });

  return data;
}

export function resolveStoredUploadValue(upload: UploadedFile) {
  if (upload.value) {
    return upload.value;
  }

  if (upload.storage === 'r2') {
    return upload.url;
  }

  return upload.filename;
}

export function resolveStoredUploadPath(upload: UploadedFile) {
  return upload.url || upload.path || upload.filename;
}

