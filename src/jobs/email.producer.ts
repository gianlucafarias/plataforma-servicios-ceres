// Email processing using Resend

import { Resend } from "resend";
import { getAbsoluteUrl } from "@/lib/seo";

const resend = new Resend(process.env.RESEND_API_KEY || "");

interface EnqueueEmailVerifyParams {
  userId: string;
  token: string;
  email: string;
  firstName?: string;
}

export async function enqueueEmailVerify(params: EnqueueEmailVerifyParams) {
  // Permitir desactivar temporalmente con variable de entorno
  if (process.env.DISABLE_EMAIL_VERIFICATION === 'true') {
    console.log('[email-verify] Email de verificación deshabilitado (DISABLE_EMAIL_VERIFICATION=true)');
    return null;
  }

  const { token, email, firstName } = params;
  const verifyUrl = getAbsoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);

  // Enviar email con Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const result = await resend.emails.send({
        from: "Ceres en Red <no-reply@ceresenred.ceres.gob.ar>",
        to: email,
        subject: "Confirmá tu cuenta - Ceres en Red",
        html: `
          <p>Hola ${firstName || ""},</p>
          <p>¡Bienvenido a <strong>Ceres en Red</strong>!</p>
          <p>Para activar tu cuenta, hacé clic en el siguiente botón:</p>
          <p>
            <a href="${verifyUrl}" 
               style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
              Confirmar mi cuenta
            </a>
          </p>
          <p>O copiá y pegá este enlace en tu navegador:</p>
          <p style="word-break:break-all;color:#666;">${verifyUrl}</p>
          <p>Este enlace será válido por 24 horas.</p>
          <p>Si no creaste esta cuenta, podés ignorar este correo.</p>
        `,
      });
      console.log("[email-verify] Email de verificación enviado con Resend:", result);
      return result;
    } catch (emailError) {
      console.error("[email-verify] Error enviando email con Resend:", emailError);
      throw emailError;
    }
  } else {
    console.warn("[email-verify] RESEND_API_KEY no está configurada. No se envió el email.");
    // En desarrollo, mostrar la URL en consola
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email-verify] URL de verificación (dev):', verifyUrl);
    }
    return null;
  }
}

export async function enqueueEmailWelcome(_userId: string, _email: string, _firstName?: string) {
  // TODO: Implementar email de bienvenida si es necesario
  return null;
}
