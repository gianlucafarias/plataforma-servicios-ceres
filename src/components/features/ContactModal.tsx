"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Send } from "lucide-react";

interface ContactModalProps {
  professionalName: string;
  serviceName?: string;
}

export function ContactModal({ professionalName, serviceName }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario
    console.log("Enviando contacto:", formData);
    // Resetear formulario
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white px-6 py-3 rounded-xl font-semibold hover:from-[#008F5B] hover:to-[#006F4B] focus:ring-4 focus:ring-green-100 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center">
          <Phone className="h-4 w-4 mr-2" />
          Contactar Profesional
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-rutan">
            Contactar a {professionalName}
          </DialogTitle>
          <DialogDescription>
            {serviceName 
              ? `Envía un mensaje sobre: ${serviceName}`
              : "Envía un mensaje al profesional"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Nombre completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
                placeholder="Tu teléfono"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
              Mensaje
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="mt-1 rounded-xl border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-none"
              placeholder="Describe qué necesitas..."
              rows={4}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.message.length}/500 caracteres
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-[#006F4B] mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Nota:</span> Tu información de contacto se enviará al profesional para que pueda comunicarse contigo directamente.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200"
              >
                Cancelar
              </button>
            </DialogTrigger>
            
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white py-3 px-4 rounded-xl font-semibold hover:from-[#008F5B] hover:to-[#006F4B] focus:ring-4 focus:ring-green-100 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Mensaje
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

