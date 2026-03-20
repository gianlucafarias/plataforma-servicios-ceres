"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { getErrorMessage } from "@/lib/api/client";
import { requestPasswordReset } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      console.error(error);
      setError(
        getErrorMessage(
          error,
          "No pudimos enviar el correo de recuperaciÃ³n. IntentÃ¡ de nuevo mÃ¡s tarde."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Recuperar contraseÃ±a
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            IngresÃ¡ el correo electrÃ³nico con el que te registraste. Si existe
            una cuenta asociada, te enviaremos un enlace para restablecer tu
            contraseÃ±a.
          </p>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                Te enviamos un correo con instrucciones para restablecer tu
                contraseÃ±a. RevisÃ¡ tu bandeja de entrada (y correo no deseado).
              </div>
              <Button
                type="button"
                className="w-full rounded-xl bg-[#006F4B] hover:bg-[#005a3d] text-white"
                onClick={() => router.push("/auth/login")}
              >
                Ir al inicio de sesiÃ³n
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Correo electrÃ³nico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tucorreo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#006F4B] focus:ring-[#006F4B]/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#006F4B] hover:bg-[#005a3d] text-white font-semibold flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar enlace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-xs text-gray-500 text-center">
            Si no tenÃ©s acceso a tu correo, podÃ©s crear una cuenta nueva o
            comunicarte con el soporte del municipio.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          Â© {new Date().getFullYear()} Ceres en Red
        </p>
      </div>
    </div>
  );
}
