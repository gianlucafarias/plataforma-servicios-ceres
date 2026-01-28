"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SupportContactModalProps {
  origin?: string;
  triggerVariant?: "primary" | "outline";
  triggerClassName?: string;
  triggerLabel?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export function SupportContactModal({
  origin,
  triggerVariant = "primary",
  triggerClassName,
  triggerLabel,
}: SupportContactModalProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "general" as "general" | "bug" | "improvement",
    message: "",
    website: "",
    openedAt: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      topic: "general",
      message: "",
      website: "",
      openedAt: 0,
    });
    setFormState("idle");
    setErrorMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
    if (nextOpen) {
      setFormData((prev) => ({
        ...prev,
        openedAt: Date.now(),
      }));
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formState === "submitting") return;

    setFormState("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          topic: formData.topic,
          message: formData.message,
          origin: origin ?? "support_contact_modal",
          url: currentUrl,
          website: formData.website || undefined,
          openedAt: formData.openedAt || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo enviar el mensaje.");
      }

      setFormState("success");

      toast.success("Mensaje enviado", {
        description: "Gracias por escribirnos, vamos a revisar tu consulta o reporte.",
      });

      setOpen(false);
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

  const defaultTriggerClassName =
    triggerVariant === "primary"
      ? "bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-full shadow-lg px-8 py-3 hover:from-[#008F5B] hover:to-[#006F4B] transition-all font-bold"
      : "bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-all";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={triggerClassName || defaultTriggerClassName}
        >
          {triggerLabel || "Contactar soporte"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-rutan">
            Contactar al equipo de soporte
          </DialogTitle>
          <DialogDescription>
            Dejanos tu mensaje y un medio de contacto. Lo usaremos solo para responder tu
            consulta o reporte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="support-website">No completar este campo</label>
            <input
              id="support-website"
              type="text"
              autoComplete="off"
              tabIndex={-1}
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="support-name" className="text-sm font-semibold text-gray-700">
              Nombre (opcional)
            </Label>
            <Input
              id="support-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
              placeholder="Tu nombre"
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="support-email" className="text-sm font-semibold text-gray-700">
              Tu email
            </Label>
            <Input
              id="support-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
              placeholder="Para que podamos responderte"
              required
              maxLength={120}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-700">
              Motivo del contacto
            </Label>
            <div className="mt-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support-topic"
                  value="general"
                  checked={formData.topic === "general"}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className="h-4 w-4 text-[#006F4B]"
                />
                <span>Consulta general o ayuda</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support-topic"
                  value="bug"
                  checked={formData.topic === "bug"}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className="h-4 w-4 text-[#006F4B]"
                />
                <span>Encontré un problema en la plataforma</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="support-topic"
                  value="improvement"
                  checked={formData.topic === "improvement"}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className="h-4 w-4 text-[#006F4B]"
                />
                <span>Tengo una sugerencia de mejora</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="support-message" className="text-sm font-semibold text-gray-700">
              Mensaje
            </Label>
            <textarea
              id="support-message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-y overflow-x-hidden"
              placeholder="Contanos brevemente qué necesitás o qué problema encontraste."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1 break-words">
              {formData.message.length}/2000 caracteres
            </p>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          {formState === "success" && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              ¡Gracias! Recibimos tu mensaje y lo revisaremos a la brevedad.
            </p>
          )}

          <div className="flex space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white hover:from-[#008F5B] hover:to-[#006F4B]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar mensaje"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

