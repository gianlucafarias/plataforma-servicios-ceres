import { describe, it, expect } from 'vitest';
import { enqueueOptimizeProfileImage, enqueueValidateCV } from '@/jobs/files.producer';

describe('files.producer (disabled queues)', () => {
  it('enqueueOptimizeProfileImage returns null', async () => {
    const result = await enqueueOptimizeProfileImage({
      path: '/uploads/profiles/123456.jpg',
      userId: 'user-123',
    });

    expect(result).toBeNull();
  });

  it('enqueueValidateCV returns null', async () => {
    const result = await enqueueValidateCV({
      path: '/uploads/profiles/cv-user-456.pdf',
      userId: 'user-456',
    });

    expect(result).toBeNull();
  });
});
