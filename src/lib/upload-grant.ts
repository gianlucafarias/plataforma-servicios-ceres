import crypto from 'node:crypto';

export type UploadGrantContext = 'register' | 'documentation';
export type UploadGrantType = 'image' | 'cv' | 'document';

type UploadGrantPayload = {
  context: UploadGrantContext;
  type: UploadGrantType;
  exp: number;
};

export const UPLOAD_GRANT_TTL_MS = 5 * 60 * 1000;

function getUploadGrantSecret(): string {
  const secret = process.env.UPLOAD_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('Missing upload grant secret');
  }

  return secret;
}

function encodeBase64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function signPayload(encodedPayload: string): string {
  return encodeBase64Url(
    crypto.createHmac('sha256', getUploadGrantSecret()).update(encodedPayload).digest()
  );
}

export function createUploadGrant(input: {
  context: UploadGrantContext;
  type: UploadGrantType;
  expiresInMs?: number;
}) {
  const payload: UploadGrantPayload = {
    context: input.context,
    type: input.type,
    exp: Date.now() + (input.expiresInMs ?? UPLOAD_GRANT_TTL_MS),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export function verifyUploadGrant(
  token: string,
  expected?: Partial<Pick<UploadGrantPayload, 'context' | 'type'>>
): UploadGrantPayload | null {
  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(providedSignature);

  if (expectedBuffer.length !== providedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload).toString('utf8')) as UploadGrantPayload;

    if (payload.exp <= Date.now()) {
      return null;
    }

    if (expected?.context && payload.context !== expected.context) {
      return null;
    }

    if (expected?.type && payload.type !== expected.type) {
      return null;
    }

    if (!['register', 'documentation'].includes(payload.context) || !['image', 'cv', 'document'].includes(payload.type)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
