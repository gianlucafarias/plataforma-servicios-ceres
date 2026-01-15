"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield, Users, CheckCircle2, AlertTriangle } from "lucide-react";

// Iconos de redes sociales
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Manejar errores de OAuth de la URL
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        AccessDenied: "El acceso con redes sociales no está disponible en este momento. Por favor, usá email y contraseña.",
        Configuration: "Error de configuración del servidor. Contactá al administrador.",
        OAuthSignin: "Error al conectar con el proveedor de autenticación.",
        OAuthCallback: "Error al procesar la respuesta del proveedor.",
        OAuthCreateAccount: "No se pudo crear la cuenta con este proveedor.",
        EmailCreateAccount: "No se pudo crear la cuenta con este email.",
        Callback: "Error en el proceso de autenticación.",
        OAuthAccountNotLinked: "Este email ya está registrado con otro método de inicio de sesión.",
        SessionRequired: "Necesitás iniciar sesión para acceder.",
        Default: "Ocurrió un error durante la autenticación.",
      };
      setOauthError(errorMessages[errorParam] || errorMessages.Default);
      setSocialLoading(null);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    setError("");
    setOauthError(null);
    
    try {
      const result = await signIn(provider, { 
        callbackUrl: "/dashboard",
        redirect: false 
      });
      
      // Si hay un error, mostrarlo
      if (result?.error) {
        setError(`Error al iniciar sesión con ${provider === "google" ? "Google" : "Facebook"}: ${result.error}`);
        setSocialLoading(null);
        return;
      }
      
      // Si es exitoso, redirigir manualmente usando window.location para forzar recarga completa
      if (result?.ok && result.url) {
        // Usar window.location.href para forzar una redirección completa y limpiar el estado
        window.location.href = result.url;
        return;
      }
      
      // Si no hay URL, podría ser que ya estamos autenticados
      if (result?.ok) {
        router.push("/dashboard");
        return;
      }
      
    } catch (err) {
      console.error(`Error con ${provider}:`, err);
      setError(`Error al iniciar sesión con ${provider === "google" ? "Google" : "Facebook"}`);
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#006F4B] via-[#008255] to-[#004d35] relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white/30"></div>
          <div className="absolute bottom-40 right-10 w-48 h-48 rounded-full border-2 border-white/20"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/5"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/gob_iso.png"
              alt="Logo"
              width={48}
              height={48}
              className="brightness-0 invert"
            />
            <div>
              <span className="font-bold text-lg">Portal de Servicios</span>
              <p className="text-white/70 text-sm">Gobierno de Ceres</p>
            </div>
          </Link>

          {/* Contenido central */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                Conectamos profesionales<br />con quienes los necesitan
              </h1>
              <p className="text-white/80 text-lg max-w-md">
                La plataforma oficial de servicios profesionales para Ceres y la región
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span>Profesionales verificados por el municipio</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span>Más de 500 profesionales activos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span>Contacto directo sin intermediarios</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/60 text-sm">
            © 2025 Municipalidad de Ceres
          </p>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header móvil */}
        <div className="lg:hidden bg-[#006F4B] p-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/gob_iso.png"
              alt="Logo"
              width={40}
              height={40}
              className="brightness-0 invert"
            />
            <div>
              <span className="font-bold">Portal de Servicios</span>
              <p className="text-white/70 text-xs">Gobierno de Ceres</p>
            </div>
          </Link>
        </div>

        {/* Formulario centrado */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bienvenido de nuevo
                </h2>
                <p className="text-gray-500">
                  Ingresá a tu cuenta para continuar
                </p>
              </div>

              {/* OAuth Error */}
              {oauthError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Login con redes sociales</p>
                    <p className="text-amber-700">{oauthError}</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#006F4B] focus:ring-[#006F4B]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Contraseña
                    </Label>
                    <Link
                      href="/auth/recuperar"
                      className="text-sm text-[#006F4B] hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#006F4B] focus:ring-[#006F4B]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#006F4B] hover:bg-[#005a3d] text-white rounded-xl font-semibold text-base transition-all shadow-lg shadow-[#006F4B]/20"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Ingresando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Iniciar Sesión
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm">o continuá con</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading || socialLoading !== null}
                  className="h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium transition-all"
                >
                  {socialLoading === "google" ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span className="ml-2">Google</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={loading || socialLoading !== null}
                  className="h-12 rounded-xl border-2 border-gray-200 hover:border-[#1877F2] hover:bg-blue-50 font-medium transition-all"
                >
                  {socialLoading === "facebook" ? (
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <FacebookIcon />
                      <span className="ml-2">Facebook</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Divider 2 */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-xs">¿Sos profesional?</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Register CTA */}
              <div className="text-center">
                <Link href="/auth/registro">
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2 border-[#006F4B] text-[#006F4B] hover:bg-[#006F4B]/5 font-semibold"
                  >
                    Registrarme como profesional
                  </Button>
                </Link>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-gray-400 text-xs mt-6">
              Al continuar, aceptás nuestros{" "}
              <Link href="/terminos" className="underline hover:text-gray-600">
                Términos de Servicio
              </Link>{" "}
              y{" "}
              <Link href="/privacidad" className="underline hover:text-gray-600">
                Política de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
