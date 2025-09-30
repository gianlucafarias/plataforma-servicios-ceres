'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const errorMessages: { [key: string]: string } = {
  Configuration: 'Hay un problema con la configuración del servidor.',
  AccessDenied: 'No tienes permiso para acceder.',
  Verification: 'El enlace de verificación ha expirado o ya fue usado.',
  Default: 'Ocurrió un error durante la autenticación.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  
  const message = error && errorMessages[error] 
    ? errorMessages[error] 
    : errorMessages.Default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-2xl border border-red-100 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-14 w-14 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-rutan mb-3">
              Error de Autenticación
            </h1>
            <p className="text-gray-700 mb-6">
              {message}
            </p>
            {error && (
              <p className="text-sm text-gray-500 mb-6">
                Código de error: {error}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/auth/login" 
                className="bg-[#006F4B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#008F5B] transition-all"
              >
                Intentar nuevamente
              </Link>
              <Link 
                href="/" 
                className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




