function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function isR2HostedUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.hostname.endsWith(".r2.dev") ||
      url.hostname.endsWith(".r2.cloudflarestorage.com")
    );
  } catch {
    return false;
  }
}

export function extractPublicUploadKey(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.startsWith("/api/v1/uploads/public/")) {
    return value.replace(/^\/api\/v1\/uploads\/public\//, "");
  }

  if (value.startsWith("profiles/")) {
    return value;
  }

  if (!isAbsoluteUrl(value) || !isR2HostedUrl(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export function resolvePublicUploadUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("/api/v1/uploads/public/") ||
    value.startsWith("/uploads/profiles/")
  ) {
    return value;
  }

  const objectKey = extractPublicUploadKey(value);
  if (objectKey) {
    return `/api/v1/uploads/public/${objectKey}`;
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  return `/uploads/profiles/${value}`;
}
