import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueEmailVerify, enqueueEmailWelcome } from '@/jobs/email.producer';
import { emailQueue } from '@/lib/queues';

// Mock de la cola de emails
vi.mock('@/lib/queues', () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe('email.producer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueEmailVerify', () => {
    it('debe encolar job con jobId idempotente basado en userId', async () => {
      const params = {
        userId: 'user-123',
        token: 'token-abc',
        email: 'test@example.com',
        firstName: 'Juan',
      };

      await enqueueEmailVerify(params);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'verify',
        params,
        expect.objectContaining({
          jobId: 'email:verify:user-123',
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
        })
      );
    });

    it('debe ser idempotente: mismo userId genera mismo jobId', async () => {
      const params1 = {
        userId: 'user-456',
        token: 'token-1',
        email: 'user@example.com',
        firstName: 'Maria',
      };

      const params2 = {
        userId: 'user-456', // Mismo userId
        token: 'token-2', // Token diferente
        email: 'user@example.com',
        firstName: 'Maria',
      };

      await enqueueEmailVerify(params1);
      await enqueueEmailVerify(params2);

      // Ambas llamadas deben usar el mismo jobId
      expect(emailQueue.add).toHaveBeenCalledTimes(2);
      const call1 = vi.mocked(emailQueue.add).mock.calls[0];
      const call2 = vi.mocked(emailQueue.add).mock.calls[1];
      
      expect(call1[2]?.jobId).toBe('email:verify:user-456');
      expect(call2[2]?.jobId).toBe('email:verify:user-456');
    });

    it('debe configurar 5 reintentos con backoff exponencial', async () => {
      const params = {
        userId: 'user-789',
        token: 'token-xyz',
        email: 'test@example.com',
      };

      await enqueueEmailVerify(params);

      const options = vi.mocked(emailQueue.add).mock.calls[0][2];
      expect(options?.attempts).toBe(5);
      expect(options?.backoff).toEqual({ type: 'exponential', delay: 1000 });
    });
  });

  describe('enqueueEmailWelcome', () => {
    it('debe encolar job de bienvenida con jobId idempotente', async () => {
      await enqueueEmailWelcome('user-abc', 'welcome@example.com', 'Pedro');

      expect(emailQueue.add).toHaveBeenCalledWith(
        'welcome',
        {
          userId: 'user-abc',
          email: 'welcome@example.com',
          firstName: 'Pedro',
        },
        expect.objectContaining({
          jobId: 'email:welcome:user-abc',
          attempts: 5,
        })
      );
    });
  });
});

