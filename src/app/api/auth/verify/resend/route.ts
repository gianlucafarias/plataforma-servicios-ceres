import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateRandomToken } from '@/lib/utils'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    if (user.verified) return NextResponse.json({ message: 'La cuenta ya está verificada' })

    // invalidar tokens previos
    await prisma.verificationToken.deleteMany({ where: { userId: user.id } })

    const token = generateRandomToken(48)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
    await prisma.verificationToken.create({ data: { userId: user.id, token, expiresAt } })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || ''
    const origin = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    const verifyUrl = `${origin}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

    try {
      await sendMail({
        to: email,
        subject: 'Reenvío: Confirmá tu cuenta - Plataforma de Servicios Ceres',
        html: `
          <p>Para activar tu cuenta, hacé clic en el siguiente enlace:</p>
          <p><a href="${verifyUrl}">Confirmar mi cuenta</a></p>
          <p>Este enlace vence en 24 horas.</p>
        `,
        text: `Confirmá tu cuenta ingresando a: ${verifyUrl}`,
      })
    } catch (e) {
      console.error('Error reenviando correo:', e)
    }

    return NextResponse.json({ message: 'Correo de verificación reenviado' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


