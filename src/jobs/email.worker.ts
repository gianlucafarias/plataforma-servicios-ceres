import { sendMail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';

/**
 * Workers/Consumidores para jobs de email
 * 
 * Procesamiento:
 * - Valida que el token de verificación exista y no esté vencido
 * - Construye URL de verificación
 * - Envía email usando la infraestructura SMTP existente
 */

interface EmailVerifyData {
  userId: string;
  token: string;
  email: string;
  firstName?: string;
}

/**
 * Envía el email de verificación
 * 
 * @param data - Datos del usuario y token
 */
export async function sendVerificationEmail(data: EmailVerifyData) {
  const { userId, token, email, firstName } = data;

  // Validar que el token exista y no esté vencido
  const vt = await prisma.verificationToken.findFirst({
    where: { 
      userId, 
      token,
      expiresAt: { gte: new Date() } // No vencido
    },
  });
  
  if (!vt) {
    console.warn(`[email.worker] Token de verificación no encontrado o vencido para userId=${userId}`);
    return; // No reintentar si el token no existe o venció
  }

  // Construir URL de verificación
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
  const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  // Enviar email usando la infraestructura existente
  await sendMail({
    to: email,
    subject: 'Confirmá tu cuenta - Plataforma de Servicios Ceres',
    html: `
      <p>Hola ${firstName ?? ''},</p>
      <p>Gracias por registrarte en la <strong>Plataforma de Servicios Ceres</strong>.</p>
      <p>Para activar tu cuenta, hacé clic en el siguiente enlace:</p>
      <p><a href="${verifyUrl}">Confirmar mi cuenta</a></p>
      <p>Este enlace vence en 24 horas.</p>
      <p>Si no fuiste vos, ignorá este correo.</p>
    `,
    text: `Hola ${firstName ?? ''}, confirmá tu cuenta ingresando a: ${verifyUrl}`,
  });

  console.log(`[email.worker] Email de verificación enviado a ${email}`);
}

interface EmailWelcomeData {
  userId: string;
  email: string;
  firstName?: string;
}

/**
 * Envía el email de bienvenida después de verificación exitosa
 * 
 * @param data - Datos del usuario
 */
export async function sendWelcomeEmail(data: EmailWelcomeData) {
  const { email, firstName } = data;

  await sendMail({
    to: email,
    subject: '¡Bienvenido a Plataforma de Servicios Ceres!',
    html: `
      <p>Hola ${firstName ?? ''},</p>
      <p>¡Tu cuenta ha sido verificada exitosamente!</p>
      <p>Ya podés comenzar a usar todos los servicios de la plataforma.</p>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard">Ir a mi panel</a></p>
    `,
    text: `Hola ${firstName ?? ''}, tu cuenta ha sido verificada. Visitá: ${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard`,
  });

  console.log(`[email.worker] Email de bienvenida enviado a ${email}`);
}

