import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()
    if (!token || !email) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const record = await prisma.verificationToken.findFirst({
      where: { userId: user.id, token },
    })
    if (!record) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    if (record.expiresAt < new Date()) {
      // eliminar token expirado
      await prisma.verificationToken.delete({ where: { id: record.id } })
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { verified: true, emailVerifiedAt: new Date() },
      })
      await tx.verificationToken.delete({ where: { id: record.id } })
    })

    return NextResponse.json({ message: 'Cuenta verificada' })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


