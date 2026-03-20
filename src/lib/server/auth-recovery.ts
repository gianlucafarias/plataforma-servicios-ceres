import crypto from 'crypto';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getAbsoluteUrl } from '@/lib/seo';
import { sendMail } from '@/lib/mail';
import { generateRandomToken } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export const PASSWORD_FORGOT_RATE_LIMIT = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
} as const;

export const VERIFY_RESEND_RATE_LIMIT = {
  limit: 10,
  windowMs: 10 * 60 * 1000,
} as const;

export function normalizeEmailInput(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const email = value.trim();
  return email.length > 0 ? email : null;
}

export async function createPasswordResetRequest(email: string): Promise<{ userFound: boolean }> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, password: true },
  });

  if (!user || !user.password) {
    return { userFound: false };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const resetUrl = getAbsoluteUrl(`/auth/reset-password?token=${token}`);

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: 'Ceres en Red <no-reply@ceresenred.ceres.gob.ar>',
        to: user.email,
        subject: 'Restablecer tu contrasena - Ceres en Red',
        html: `
          <p>Hola ${user.firstName || ''},</p>
          <p>Recibimos un pedido para restablecer tu contrasena en <strong>Ceres en Red</strong>.</p>
          <p>Hace clic en el siguiente boton para crear una nueva contrasena:</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
              Restablecer contrasena
            </a>
          </p>
          <p>Si no fuiste vos, podes ignorar este correo.</p>
          <p>Este enlace sera valido por 1 hora.</p>
        `,
      });
    } catch (emailError) {
      console.error('[forgot-password] Error enviando email con Resend:', emailError);
    }
  } else {
    console.warn('[forgot-password] RESEND_API_KEY no esta configurada. No se envio el email.');
  }

  return { userFound: true };
}

export type ResendVerificationResult =
  | { status: 'not_found' }
  | { status: 'already_verified' }
  | { status: 'resent' };

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, verified: true },
  });

  if (!user) {
    return { status: 'not_found' };
  }

  if (user.verified) {
    return { status: 'already_verified' };
  }

  await prisma.verificationToken.deleteMany({ where: { userId: user.id } });

  const token = generateRandomToken(48);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.verificationToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const verifyUrl = getAbsoluteUrl(
    `/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );

  try {
    await sendMail({
      to: email,
      subject: 'Reenvio: Confirma tu cuenta - Ceres en Red',
      html: `
        <p>Para activar tu cuenta, hace clic en el siguiente enlace:</p>
        <p><a href="${verifyUrl}">Confirmar mi cuenta</a></p>
        <p>Este enlace vence en 24 horas.</p>
      `,
      text: `Confirma tu cuenta ingresando a: ${verifyUrl}`,
    });
  } catch (error) {
    console.error('Error reenviando correo:', error);
  }

  return { status: 'resent' };
}
