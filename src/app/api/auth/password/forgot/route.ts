import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { getAbsoluteUrl } from "@/lib/seo";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "invalid_email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, password: true },
    });

    // Siempre respondemos 200 para no filtrar si un email existe o no
    if (!user || !user.password) {
      console.log("[forgot-password] No user or no password for email", email);
      return NextResponse.json({ success: true });
    }

    // Generar token seguro
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Opcional: invalidar tokens anteriores de este usuario
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
    console.log("[forgot-password] Generated reset URL:", resetUrl);

    // Enviar email con Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const result = await resend.emails.send({
          from: "Ceres en Red <no-reply@ceresenred.ceres.gob.ar>",
          to: user.email,
          subject: "Restablecer tu contraseña - Ceres en Red",
          html: `
          <p>Hola ${user.firstName || ""},</p>
          <p>Recibimos un pedido para restablecer tu contraseña en <strong>Ceres en Red</strong>.</p>
          <p>Hacé clic en el siguiente botón para crear una nueva contraseña:</p>
          <p>
            <a href="${resetUrl}" 
               style="display:inline-block;padding:10px 18px;background:#006F4B;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
              Restablecer contraseña
            </a>
          </p>
          <p>Si no fuiste vos, podés ignorar este correo.</p>
          <p>Este enlace será válido por 1 hora.</p>
        `,
        });
        console.log("[forgot-password] Resend response:", result);
      } catch (emailError) {
        console.error("[forgot-password] Error enviando email con Resend:", emailError);
      }
    } else {
      console.warn("[forgot-password] RESEND_API_KEY no está configurada. No se envió el email.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[forgot-password] Error en endpoint:", error);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

