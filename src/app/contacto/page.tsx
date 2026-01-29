"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Send,
  Mail,
  Clock,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactoPage() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [openedAt, setOpenedAt] = useState<number>(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // honeypot
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
      setOpenedAt(Date.now());
    }
  }, []);

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "",
    });
    setFormState("idle");
    setErrorMessage(null);
    setOpenedAt(Date.now());
  };

  const mapSubjectToTopic = (
    subject: string
  ): "general" | "bug" | "improvement" => {
    switch (subject) {
      case "technical":
        return "bug";
      case "claim":
        return "improvement";
      case "professional":
      case "other":
      default:
        return "general";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formState === "submitting") return;

    // Validación básica del lado del cliente
    if (!formData.email || !formData.message) {
      setErrorMessage("Por favor completa todos los campos obligatorios.");
      return;
    }

    setFormState("submitting");
    setErrorMessage(null);

    try {
      const topic = mapSubjectToTopic(formData.subject || "other");

      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          topic: topic,
          message: formData.message,
          origin: "contacto_page",
          url: currentUrl,
          website: formData.website || undefined,
          openedAt: openedAt || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo enviar el mensaje.");
      }

      setFormState("success");

      toast.success("Mensaje enviado", {
        description:
          "Gracias por escribirnos, vamos a revisar tu consulta o reporte.",
      });

      resetForm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta nuevamente.";
      setErrorMessage(message);
      setFormState("error");
    }
  };

  const isSubmitting = formState === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#006F4B] to-[#008F5B] overflow-hidden py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[url('/pattern.svg')] bg-repeat opacity-20"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-rutan">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
            Estamos aquí para escucharte. Ya seas un vecino buscando servicios o un
            profesional ofreciéndolos, nuestro equipo está listo para asistirte.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-[#006F4B]/10 rounded-xl flex items-center justify-center">
                    <Send className="h-6 w-6 text-[#006F4B]" />
                  </div>
                  <h2 className="text-2xl font-bold font-rutan">
                    Envíanos un mensaje
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">No completar este campo</label>
                    <input
                      id="website"
                      type="text"
                      autoComplete="off"
                      tabIndex={-1}
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        Nombre completo
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
                        placeholder="Ej: Juan Pérez"
                        maxLength={80}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        Correo electrónico
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className="rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
                        placeholder="juan@ejemplo.com"
                        required
                        maxLength={120}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="subject"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Asunto <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => handleChange("subject", value)}
                      required
                    >
                      <SelectTrigger className="w-full rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 h-12">
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Problemas técnicos</SelectItem>
                        <SelectItem value="professional">
                          Registro como profesional
                        </SelectItem>
                        <SelectItem value="claim">Reclamos o Sugerencias</SelectItem>
                        <SelectItem value="other">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="message"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Mensaje
                    </Label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      className="mt-1 block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 text-sm focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-y overflow-x-hidden bg-gray-50 dark:bg-gray-800/50"
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                      rows={5}
                      required
                      maxLength={2000}
                    />
                    <p className="text-xs text-gray-500 mt-1 break-words">
                      {formData.message.length}/2000 caracteres
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {errorMessage}
                      </p>
                    </div>
                  )}

                  {formState === "success" && (
                    <div className="flex items-start gap-2 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ¡Gracias! Recibimos tu mensaje y lo revisaremos a la brevedad.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#006F4B] to-[#008F5B] hover:from-[#008F5B] hover:to-[#006F4B] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#006F4B]/30 transition-all flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar mensaje</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Canales Directos */}
            <Card className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-[#006F4B] dark:text-emerald-400 mb-6 font-rutan">
                  Canales Directos
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    
                    
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#006F4B] rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        Correo Electrónico
                      </p>
                      <a
                        href="mailto:modernizacion@ceres.gob.ar"
                        className="text-ms font-bold text-[#006F4B] dark:text-emerald-400 hover:underline break-all"
                      >
                        modernizacion@ceres.gob.ar
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        Horarios de Atención
                      </p>
                      <p className="text-ms font-bold text-[#006F4B] dark:text-emerald-400">
                        Lun a Vie: 07:00 - 13:00
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500">
                      Avenida Italia e H. Yrigoyen, Ceres, Santa Fe, Argentina
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/como-funciona"
                  className="mt-8 flex items-center justify-center w-full py-3 bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[#006F4B] dark:text-emerald-300 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-800/50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Ver Preguntas Frecuentes
                </Link>
              </CardContent>
            </Card>

           
          </div>
        </div>
      </main>
    </div>
  );
}
