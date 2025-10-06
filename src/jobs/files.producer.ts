import { filesQueue } from '@/lib/queues';

export async function enqueueOptimizeProfileImage(params: { path: string; userId?: string }) {
  const { path, userId } = params;
  return filesQueue.add('optimize-profile-image', { path, userId }, {
    jobId: `files:optimize:${path}`,
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 86400, count: 500 },
  });
}

export async function enqueueValidateCV(params: { path: string; userId?: string }) {
  const { path, userId } = params;
  return filesQueue.add('validate-cv', { path, userId }, {
    jobId: `files:cv:${path}`,
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
    removeOnComplete: { age: 3600, count: 500 },
    removeOnFail: { age: 86400, count: 500 },
  });
}


