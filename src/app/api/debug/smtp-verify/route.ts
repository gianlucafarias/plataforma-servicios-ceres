import { NextResponse } from 'next/server'
import { verifySmtp } from '@/lib/mail'
import { isProductionRuntime } from '@/lib/request-helpers'

export async function GET() {
  if (isProductionRuntime()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const result = await verifySmtp()
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


