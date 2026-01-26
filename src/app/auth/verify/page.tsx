"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyPage() {
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending')
  const [message, setMessage] = useState<string>('Validando enlace...')
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const email = params.get('email')

    async function run() {
      try {
        if (!token || !email) {
          setStatus('error')
          setMessage('Enlace inválido')
          setErrorDetails('Faltan los parámetros necesarios para verificar tu cuenta.')
          return
        }

        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'No se pudo verificar')
        setStatus('success')
        setMessage('¡Tu cuenta fue verificada exitosamente!')
      } catch (e: unknown) {
        setStatus('error')
        const errorMsg = e instanceof Error ? e.message : 'El enlace no es válido o expiró.'
        setMessage('No se pudo verificar tu cuenta')
        setErrorDetails(errorMsg)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-2xl border border-gray-100 shadow-lg">
          <CardContent className="p-10 text-center">
            {/* Icono según estado */}
            <div className="flex justify-center mb-4">
              {status === 'pending' && (
                <Loader2 className="h-14 w-14 text-[#006F4B] animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle2 className="h-14 w-14 text-[#006F4B]" />
              )}
              {status === 'error' && (
                <AlertCircle className="h-14 w-14 text-red-600" />
              )}
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 font-rutan mb-3">
              {status === 'pending' && 'Validando tu cuenta...'}
              {status === 'success' && '¡Cuenta verificada!'}
              {status === 'error' && 'Error al verificar'}
            </h1>

            {/* Mensaje principal */}
            <p className="text-gray-700 mb-4">
              {message}
            </p>

            {/* Detalles del error si existe */}
            {status === 'error' && errorDetails && (
              <p className="text-sm text-red-600 mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
                {errorDetails}
              </p>
            )}

            {/* Mensaje adicional para éxito */}
            {status === 'success' && (
              <p className="text-gray-600 mb-6">
                Ya podés iniciar sesión y comenzar a usar la plataforma.
              </p>
            )}

            {/* Mensaje adicional para error */}
            {status === 'error' && (
              <p className="text-gray-600 mb-6">
                Si el enlace expiró, podés solicitar uno nuevo desde la página de inicio de sesión.
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {status === 'success' && (
                <>
                  <Link 
                    href="/auth/login" 
                    className="bg-[#006F4B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#008F5B] transition-all"
                  >
                    Iniciar sesión
                  </Link>
                  <Link 
                    href="/" 
                    className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Volver al inicio
                  </Link>
                </>
              )}
              {status === 'error' && (
                <>
                  <Link 
                    href="/auth/login" 
                    className="bg-[#006F4B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#008F5B] transition-all"
                  >
                    Ir a iniciar sesión
                  </Link>
                  <Link 
                    href="/" 
                    className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                  >
                    Volver al inicio
                  </Link>
                </>
              )}
              {status === 'pending' && (
                <div className="text-sm text-gray-500">
                  Por favor esperá un momento...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


