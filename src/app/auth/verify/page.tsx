"use client"

import { useEffect, useState } from 'react'
import { getErrorMessage } from '@/lib/api/client'
import { verifyAccount } from '@/lib/api/auth'

export default function VerifyPage() {
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending')
  const [message, setMessage] = useState<string>('Validando enlace...')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const email = params.get('email')

    async function run() {
      try {
        await verifyAccount(token, email)
        setStatus('success')
        setMessage('Â¡Tu cuenta fue verificada! Ya podÃ©s iniciar sesiÃ³n.')
      } catch (error: unknown) {
        setStatus('error')
        setMessage(getErrorMessage(error, 'El enlace no es vÃ¡lido o expirÃ³.'))
      }
    }

    void run()
  }, [])

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <h1 className="text-2xl font-semibold mb-4">ConfirmaciÃ³n de cuenta</h1>
      <p className={status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-700' : ''}>{message}</p>
    </div>
  )
}
