import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  UPLOAD_GRANT_TTL_MS,
  createUploadGrant,
  verifyUploadGrant,
} from '@/lib/upload-grant';

describe('upload-grant', () => {
  const previousSecret = process.env.NEXTAUTH_SECRET;
  const previousUploadSecret = process.env.UPLOAD_TOKEN_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    delete process.env.UPLOAD_TOKEN_SECRET;
    vi.useRealTimers();
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.NEXTAUTH_SECRET;
    } else {
      process.env.NEXTAUTH_SECRET = previousSecret;
    }

    if (previousUploadSecret === undefined) {
      delete process.env.UPLOAD_TOKEN_SECRET;
    } else {
      process.env.UPLOAD_TOKEN_SECRET = previousUploadSecret;
    }

    vi.useRealTimers();
  });

  it('crea y valida un token para registro publico', () => {
    const grant = createUploadGrant({ context: 'register', type: 'image' });
    const payload = verifyUploadGrant(grant.token, {
      context: 'register',
      type: 'image',
    });

    expect(payload).not.toBeNull();
    expect(payload?.context).toBe('register');
    expect(payload?.type).toBe('image');
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it('rechaza un token con scope distinto', () => {
    const grant = createUploadGrant({ context: 'register', type: 'image' });
    const payload = verifyUploadGrant(grant.token, {
      context: 'register',
      type: 'cv',
    });

    expect(payload).toBeNull();
  });

  it('rechaza un token vencido', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-16T12:00:00.000Z');
    vi.setSystemTime(now);

    const grant = createUploadGrant({ context: 'register', type: 'cv' });
    vi.advanceTimersByTime(UPLOAD_GRANT_TTL_MS + 1);

    const payload = verifyUploadGrant(grant.token, {
      context: 'register',
      type: 'cv',
    });

    expect(payload).toBeNull();
  });

  it('rechaza un token manipulado', () => {
    const grant = createUploadGrant({ context: 'register', type: 'image' });
    const tampered = `${grant.token}tampered`;

    expect(verifyUploadGrant(tampered)).toBeNull();
  });
});
