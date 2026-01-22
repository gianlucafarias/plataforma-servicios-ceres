// Queue-based email processing disabled. External service handles async email.

interface EnqueueEmailVerifyParams {
  userId: string;
  token: string;
  email: string;
  firstName?: string;
}

export async function enqueueEmailVerify(_params: EnqueueEmailVerifyParams) {
  return null;
}

export async function enqueueEmailWelcome(_userId: string, _email: string, _firstName?: string) {
  return null;
}
