"use client"
import { useEffect, useState } from 'react'

export default function VerifyPage() {
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending')
  const [message, setMessage] = useState<string>('Validando enlace...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const email = params.get('email')

    async function run() {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'No se pudo verificar')
        setStatus('success')
        setMessage('¡Tu cuenta fue verificada! Ya podés iniciar sesión.')
      } catch (e: unknown) {
        setStatus('error')
        setMessage(e instanceof Error ? e.message : 'El enlace no es válido o expiró.')
      }
    }
    run()
  }, [])

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <h1 className="text-2xl font-semibold mb-4">Confirmación de cuenta</h1>
      <p className={status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-700' : ''}>{message}</p>
    </div>
  )
}


