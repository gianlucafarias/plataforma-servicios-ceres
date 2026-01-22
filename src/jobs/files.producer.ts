// Queue-based file processing disabled. External service handles async tasks.

export async function enqueueOptimizeProfileImage(_params: { path: string; userId?: string }) {
  return null;
}

export async function enqueueValidateCV(_params: { path: string; userId?: string }) {
  return null;
}
