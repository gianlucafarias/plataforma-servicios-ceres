import { prisma } from '@/lib/prisma';

export const CHECK_EMAIL_RATE_LIMIT = {
  limit: 60,
  windowMs: 10 * 60 * 1000,
} as const;

export function normalizeLookupEmail(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const email = value.trim();
  return email.length > 0 ? email : null;
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return !!user;
}
