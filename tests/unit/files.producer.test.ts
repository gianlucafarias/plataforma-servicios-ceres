import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';
import { filesQueue } from '@/lib/queues';

// Mock de la cola de files
vi.mock('@/lib/queues', () => ({
  filesQueue: {
    add: vi.fn(),
  },
}));

describe('files.producer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueOptimizeProfileImage', () => {
    it('debe encolar job con jobId idempotente basado en path', async () => {
      const params = {
        path: '/uploads/profiles/123456.jpg',
        userId: 'user-123',
      };

      await enqueueOptimizeProfileImage(params);

      expect(filesQueue.add).toHaveBeenCalledWith(
        'optimize-profile-image',
        params,
        expect.objectContaining({
          jobId: 'files:optimize:/uploads/profiles/123456.jpg',
          attempts: 3,
        })
      );
    });

    it('debe ser idempotente: mismo path genera mismo jobId', async () => {
      const path = '/uploads/profiles/same-file.png';

      await enqueueOptimizeProfileImage({ path, userId: 'user-1' });
      await enqueueOptimizeProfileImage({ path, userId: 'user-2' }); // Mismo path, distinto usuario

      // Ambas llamadas deben usar el mismo jobId
      expect(filesQueue.add).toHaveBeenCalledTimes(2);
      const call1 = vi.mocked(filesQueue.add).mock.calls[0];
      const call2 = vi.mocked(filesQueue.add).mock.calls[1];
      
      expect(call1[2]?.jobId).toBe('files:optimize:/uploads/profiles/same-file.png');
      expect(call2[2]?.jobId).toBe('files:optimize:/uploads/profiles/same-file.png');
    });

    it('debe configurar 3 reintentos con backoff fijo', async () => {
      await enqueueOptimizeProfileImage({ path: '/test.jpg' });

      const options = vi.mocked(filesQueue.add).mock.calls[0][2];
      expect(options?.attempts).toBe(3);
      expect(options?.backoff).toEqual({ type: 'fixed', delay: 2000 });
    });
  });

  describe('enqueueValidateCV', () => {
    it('debe encolar job de validación de CV con jobId idempotente', async () => {
      const params = {
        path: '/uploads/profiles/cv-user-456.pdf',
        userId: 'user-456',
      };

      await enqueueValidateCV(params);

      expect(filesQueue.add).toHaveBeenCalledWith(
        'validate-cv',
        params,
        expect.objectContaining({
          jobId: 'files:cv:/uploads/profiles/cv-user-456.pdf',
          attempts: 3,
        })
      );
    });

    it('debe permitir userId opcional', async () => {
      await enqueueValidateCV({ path: '/uploads/profiles/cv.pdf' });

      expect(filesQueue.add).toHaveBeenCalledWith(
        'validate-cv',
        { path: '/uploads/profiles/cv.pdf', userId: undefined },
        expect.objectContaining({
          jobId: 'files:cv:/uploads/profiles/cv.pdf',
        })
      );
    });
  });
});

