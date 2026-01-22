import { describe, it, expect } from 'vitest';
import { enqueueEmailVerify, enqueueEmailWelcome } from '@/jobs/email.producer';

describe('email.producer (disabled queues)', () => {
  it('enqueueEmailVerify returns null', async () => {
    const result = await enqueueEmailVerify({
      userId: 'user-123',
      token: 'token-abc',
      email: 'test@example.com',
      firstName: 'Juan',
    });

    expect(result).toBeNull();
  });

  it('enqueueEmailWelcome returns null', async () => {
    const result = await enqueueEmailWelcome('user-abc', 'welcome@example.com', 'Pedro');
    expect(result).toBeNull();
  });
});
