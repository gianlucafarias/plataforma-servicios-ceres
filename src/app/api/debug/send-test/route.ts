import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json()
    if (!to) return NextResponse.json({ error: 'Falta "to"' }, { status: 400 })
    const info = await sendMail({
      to,
      subject: 'Prueba SMTP - Plataforma Ceres',
      html: '<p>Correo de prueba.</p>',
      text: 'Correo de prueba.'
    })
    return NextResponse.json({ ok: true, messageId: info.messageId })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


