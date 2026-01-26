import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enqueueEmailVerify, enqueueEmailWelcome } from '@/jobs/email.producer';

describe('email.producer', () => {
  const originalDisable = process.env.DISABLE_EMAIL_VERIFICATION;
  const originalResend = process.env.RESEND_API_KEY;

  beforeEach(() => {
    // Limpiar variables de entorno para tests
    delete process.env.DISABLE_EMAIL_VERIFICATION;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    // Restaurar variables de entorno originales
    if (originalDisable) {
      process.env.DISABLE_EMAIL_VERIFICATION = originalDisable;
    }
    if (originalResend) {
      process.env.RESEND_API_KEY = originalResend;
    }
  });

  describe('enqueueEmailVerify', () => {
    it('returns null when DISABLE_EMAIL_VERIFICATION is true', async () => {
      process.env.DISABLE_EMAIL_VERIFICATION = 'true';
      
      const result = await enqueueEmailVerify({
        userId: 'user-123',
        token: 'token-abc',
        email: 'test@example.com',
        firstName: 'Juan',
      });

      expect(result).toBeNull();
    });

    it('returns null when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY;
      
      const result = await enqueueEmailVerify({
        userId: 'user-123',
        token: 'token-abc',
        email: 'test@example.com',
        firstName: 'Juan',
      });

      expect(result).toBeNull();
    });
  });

  it('enqueueEmailWelcome returns null', async () => {
    const result = await enqueueEmailWelcome('user-abc', 'welcome@example.com', 'Pedro');
    expect(result).toBeNull();
  });
});
