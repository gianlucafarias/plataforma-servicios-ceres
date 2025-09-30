import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function RegistroExitoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-2xl border border-gray-100 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-14 w-14 text-[#006F4B]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 font-rutan mb-3">¡Solo queda un paso!</h1>
            <p className="text-gray-700 mb-6">
             Te enviamos un email para que puedas confirmar tu cuenta. Mientras tanto, nuestro equipo va a revisar tu solicitud y, si cumple los requisitos, será aprobada para
             aparecer en la plataforma. 
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="bg-[#006F4B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#008F5B] transition-all">
                Ir a mi cuenta
              </Link>
              <Link href="/" className="bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






