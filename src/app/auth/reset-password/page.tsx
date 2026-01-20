"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenFromUrl) {
      setError("El enlace no es válido.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(
          json.message ||
            "No pudimos restablecer tu contraseña. Intentá nuevamente."
        );
      } else {
        setDone(true);
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado. Intentá nuevamente.");
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
            onClick={() => router.push("/auth/login")}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al inicio de sesión
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Crear nueva contraseña
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Elegí una nueva contraseña segura para tu cuenta.
          </p>

          {!tokenFromUrl ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                El enlace de recuperación no es válido. Volvé a solicitar uno
                desde la pantalla de inicio de sesión.
              </p>
              <Link href="/auth/recuperar">
                <Button className="w-full rounded-xl bg-[#006F4B] hover:bg-[#005a3d] text-white">
                  Ir a recuperar contraseña
                </Button>
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                Tu contraseña se actualizó correctamente. Ahora podés iniciar
                sesión con la nueva contraseña.
              </p>
              <Button
                type="button"
                className="w-full rounded-xl bg-[#006F4B] hover:bg-[#005a3d] text-white"
                onClick={() => router.push("/auth/login")}
              >
                Ir al inicio de sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#006F4B] focus:ring-[#006F4B]/20 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres. Evitá usar contraseñas fáciles de
                  adivinar.
                </p>
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Repetir contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Actualizando...
                  </>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </Button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Ceres en Red
        </p>
      </div>
    </div>
  );
}

