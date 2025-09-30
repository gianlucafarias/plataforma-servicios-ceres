import { NextResponse } from 'next/server'
import { verifySmtp } from '@/lib/mail'

export async function GET() {
  try {
    const result = await verifySmtp()
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


