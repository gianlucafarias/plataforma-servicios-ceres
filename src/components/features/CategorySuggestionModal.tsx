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

interface CategorySuggestionModalProps {
  origin?: string;
  triggerClassName?: string;
  triggerLabel?: string;
}

type FormState = "idle" | "submitting" | "success" | "error";

export function CategorySuggestionModal({ origin, triggerClassName, triggerLabel }: CategorySuggestionModalProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    suggestedName: "",
    details: "",
    email: "",
    website: "", // honeypot
    openedAt: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      suggestedName: "",
      details: "",
      email: "",
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formState === "submitting") return;

    setFormState("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/support/category-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suggestedName: formData.suggestedName,
          description: formData.details,
          email: formData.email,
          origin: origin ?? "category_suggestion_modal",
          url: currentUrl,
          website: formData.website || undefined,
          openedAt: formData.openedAt || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "No se pudo enviar la sugerencia.");
      }

      setFormState("success");

      toast.success("Sugerencia enviada", {
        description: "Gracias, vamos a revisar tu propuesta de categoría.",
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

  const defaultTriggerClass =
    "bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-full shadow-lg px-8 py-3 hover:from-[#008F5B] hover:to-[#006F4B] transition-all font-bold";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={triggerClassName || defaultTriggerClass}
        >
          {triggerLabel || "Sugerir Categoría"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-rutan">
            Sugerir una nueva categoría
          </DialogTitle>
          <DialogDescription>
            Contanos qué categoría te gustaría que agreguemos a la plataforma. Esto nos
            ayuda a priorizar los próximos servicios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Honeypot para bots: no debe ser visible ni usable para usuarios reales */}
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

          <div>
            <Label
              htmlFor="suggestedName"
              className="text-sm font-semibold text-gray-700"
            >
              Nombre de la categoría
            </Label>
            <Input
              id="suggestedName"
              value={formData.suggestedName}
              onChange={(e) => handleChange("suggestedName", e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
              placeholder="Ej: Flete, Fisioterapia, Diseño gráfico..."
              required
              maxLength={80}
            />
          </div>

          <div>
            <Label htmlFor="details" className="text-sm font-semibold text-gray-700">
              Detalles (opcional)
            </Label>
            <textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleChange("details", e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-y overflow-x-hidden"
              placeholder="Contanos brevemente para qué usarías esta categoría o qué tipo de trabajos incluiría."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1 break-words">
              {formData.details.length}/1000 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Tu email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
              placeholder="Para que podamos contactarte si necesitamos más información"
              required
              maxLength={120}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMessage}
            </p>
          )}

          {formState === "success" && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              ¡Gracias! Registramos tu sugerencia y la tendremos en cuenta para las
              próximas categorías.
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
              {isSubmitting ? "Enviando..." : "Enviar sugerencia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

