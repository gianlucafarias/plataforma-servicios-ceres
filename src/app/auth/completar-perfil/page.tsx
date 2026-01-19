"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GROUPS, getAreasByGroup, getSubcategories, getLocations } from "@/lib/taxonomy";
import type { CategoryGroup } from "@/types";
import { 
  Phone, 
  MapPin, 
  Briefcase, 
  Award, 
  Send, 
  ArrowLeft, 
  CheckCircle,
  Plus,
  Trash2,
  Building2,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function CompletarPerfilPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: "",
    experienceYears: "",
    professionalGroup: "" as "" | CategoryGroup,
    serviceLocations: [] as string[],
    services: [
      { areaSlug: "", categoryId: "", title: "", description: "" }
    ]
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const areas = useMemo(() => getAreasByGroup(formData.professionalGroup as CategoryGroup), [formData.professionalGroup]);
  const locations = useMemo(() => getLocations(), []);

  // Redirigir si no está logueado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Inicializar serviceLocations con la localidad principal
  useEffect(() => {
    if (formData.location && !formData.serviceLocations.includes(formData.location)) {
      setFormData(prev => ({
        ...prev,
        serviceLocations: [formData.location, ...prev.serviceLocations.filter(loc => loc !== formData.location)]
      }));
    }
  }, [formData.location, formData.serviceLocations]);

  const steps = [
    { id: 1, title: "Datos de Contacto", description: "Teléfono y ubicación" },
    { id: 2, title: "Perfil Profesional", description: "Experiencia y servicios" }
  ];

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      if (field === 'professionalGroup') {
        const newGroup = value as CategoryGroup | '';
        const resetServices = [{ areaSlug: '', categoryId: '', title: '', description: '' }];
        return { ...prev, professionalGroup: newGroup, services: resetServices };
      }
      return { ...prev, [field]: value };
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...formData.services];
    const updatedService = { ...newServices[index] };

    if (field === 'areaSlug') {
      updatedService.areaSlug = value;
      updatedService.categoryId = '';
      updatedService.title = '';
    } else if (field === 'categoryId') {
      updatedService.categoryId = value;
      const subcategories = getSubcategories((formData.professionalGroup || 'oficios') as CategoryGroup, updatedService.areaSlug || undefined);
      const selected = subcategories.find((sub) => sub.slug === value);
      updatedService.title = selected ? selected.name : '';
    } else if (field === 'title') {
      updatedService.title = value;
    } else if (field === 'description') {
      updatedService.description = value;
    }

    newServices[index] = updatedService;
    setFormData(prev => ({ ...prev, services: newServices }));
  };

  const addService = () => {
    if (formData.professionalGroup === 'profesiones') return;
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { areaSlug: "", categoryId: "", title: "", description: "" }]
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      const newServices = formData.services.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, services: newServices }));
    }
  };

  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido";
    if (!formData.location.trim()) newErrors.location = "La localidad es requerida";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.bio.trim()) newErrors.bio = "La descripción profesional es requerida";
    if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
      newErrors.experienceYears = "Los años de experiencia son requeridos";
    }
    if (!formData.professionalGroup) {
      newErrors.professionalGroup = "Debes elegir si ofreces Oficios o Profesiones";
    }
    
    formData.services.forEach((service, index) => {
      if (!service.categoryId) newErrors[`service_${index}_category`] = "La categoría es requerida";
      if (!service.description.trim()) newErrors[`service_${index}_description`] = "La descripción es requerida";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          experienceYears: parseInt(formData.experienceYears || '0'),
          professionalGroup: formData.professionalGroup,
          serviceLocations: formData.serviceLocations,
          services: formData.services.map((s) => ({
            categoryId: s.categoryId,
            title: s.title,
            description: s.description,
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Error al completar el perfil';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        setErrors({ general: errorMessage });
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        router.push("/dashboard");
      } else {
        setErrors({ general: result.error || "Error al completar el perfil" });
      }
    } catch (error) {
      console.error("Error al completar perfil:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al completar el perfil. Intenta nuevamente.";
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006F4B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#006F4B] via-[#008255] to-[#004d35] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-32 h-32 rounded-full border-2 border-white/30"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 rounded-full border-2 border-white/20"></div>
        </div>
        
        <div className="relative z-10 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver</span>
            </Link>
            
            <div className="text-center text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Completá tu Perfil Profesional
              </h1>
              <p className="text-white/80 text-lg">
                Hola {session?.user?.name || session?.user?.firstName}, solo faltan algunos datos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-12">
        <Card className="overflow-hidden shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        currentStep >= step.id
                          ? 'bg-[#006F4B] border-[#006F4B] text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {currentStep > step.id ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="font-semibold text-sm">{step.id}</span>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <p className={`text-xs font-medium ${
                          currentStep >= step.id ? 'text-[#006F4B]' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                        <p className={`text-xs ${
                          currentStep >= step.id ? 'text-[#006F4B]' : 'text-gray-400'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-20 h-0.5 mx-4 self-center">
                        <div className={`w-full h-full transition-all duration-300 ${
                          currentStep > step.id ? 'bg-[#006F4B]' : 'bg-gray-300'
                        }`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Step 1: Datos de Contacto */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos de Contacto</h2>
                  <p className="text-gray-600">¿Cómo pueden contactarte los clientes?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Teléfono *
                    </Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`pl-10 rounded-xl border-2 ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="Sin 0 y sin 15 (3491567890)"
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                      Localidad Principal *
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                      <Select
                        value={formData.location}
                        onValueChange={(value) => handleInputChange('location', value)}
                      >
                        <SelectTrigger className={`pl-10 rounded-xl border-2 ${errors.location ? 'border-red-300' : 'border-gray-200'}`}>
                          <SelectValue placeholder="Selecciona tu localidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
                  </div>
                </div>

                {/* Localidades adicionales */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    ¿En qué localidades ofrecés servicios?
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Tu localidad principal ya está incluida. Podés agregar más.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          const isSelected = formData.serviceLocations.includes(loc.id);
                          if (loc.id === formData.location) return; // No se puede quitar la principal
                          if (isSelected) {
                            handleInputChange('serviceLocations', formData.serviceLocations.filter(l => l !== loc.id));
                          } else {
                            handleInputChange('serviceLocations', [...formData.serviceLocations, loc.id]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          formData.serviceLocations.includes(loc.id)
                            ? 'bg-[#006F4B] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${loc.id === formData.location ? 'ring-2 ring-[#006F4B] ring-offset-1' : ''}`}
                      >
                        {loc.name}
                        {loc.id === formData.location && ' (principal)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Perfil Profesional */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu Perfil Profesional</h2>
                  <p className="text-gray-600">Contanos sobre tu experiencia y servicios</p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                    Descripción profesional *
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={`mt-1 rounded-xl border-2 min-h-[100px] ${errors.bio ? 'border-red-300' : 'border-gray-200'}`}
                    placeholder="Describí tu experiencia, especialidades y qué te diferencia..."
                  />
                  {errors.bio && <p className="text-red-600 text-sm mt-1">{errors.bio}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experienceYears" className="text-sm font-semibold text-gray-700">
                      Años de experiencia *
                    </Label>
                    <div className="relative mt-1">
                      <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="experienceYears"
                        type="number"
                        min="0"
                        value={formData.experienceYears}
                        onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                        className={`pl-10 rounded-xl border-2 ${errors.experienceYears ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="0"
                      />
                    </div>
                    {errors.experienceYears && <p className="text-red-600 text-sm mt-1">{errors.experienceYears}</p>}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Tipo de servicio *
                    </Label>
                    <div className="relative mt-1">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                      <Select
                        value={formData.professionalGroup}
                        onValueChange={(value) => handleInputChange('professionalGroup', value)}
                      >
                        <SelectTrigger className={`pl-10 rounded-xl border-2 ${errors.professionalGroup ? 'border-red-300' : 'border-gray-200'}`}>
                          <SelectValue placeholder="¿Oficios o Profesiones?" />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUPS.map((group) => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.professionalGroup && <p className="text-red-600 text-sm mt-1">{errors.professionalGroup}</p>}
                  </div>
                </div>

                {/* Servicios */}
                {formData.professionalGroup && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-gray-700">
                        Servicios que ofrecés *
                      </Label>
                      {formData.professionalGroup === 'oficios' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addService}
                          className="rounded-xl"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar
                        </Button>
                      )}
                    </div>

                    {formData.services.map((service, index) => (
                      <Card key={index} className="p-4 rounded-xl border-2 border-gray-100">
                        <div className="space-y-3">
                          {formData.professionalGroup === 'oficios' && areas.length > 0 && (
                            <Select
                              value={service.areaSlug}
                              onValueChange={(value) => handleServiceChange(index, 'areaSlug', value)}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Selecciona un área" />
                              </SelectTrigger>
                              <SelectContent>
                                {areas.map((area) => (
                                  <SelectItem key={area.slug} value={area.slug}>{area.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          <Select
                            value={service.categoryId}
                            onValueChange={(value) => handleServiceChange(index, 'categoryId', value)}
                          >
                            <SelectTrigger className={`rounded-xl ${errors[`service_${index}_category`] ? 'border-red-300' : ''}`}>
                              <SelectValue placeholder="Selecciona una especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSubcategories(formData.professionalGroup as CategoryGroup, service.areaSlug || undefined).map((sub) => (
                                <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`service_${index}_category`] && (
                            <p className="text-red-600 text-sm">{errors[`service_${index}_category`]}</p>
                          )}

                          <Textarea
                            value={service.description}
                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                            className={`rounded-xl min-h-[80px] ${errors[`service_${index}_description`] ? 'border-red-300' : ''}`}
                            placeholder="Describí este servicio..."
                          />
                          {errors[`service_${index}_description`] && (
                            <p className="text-red-600 text-sm">{errors[`service_${index}_description`]}</p>
                          )}

                          {formData.services.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              )}
              
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12 bg-[#006F4B] hover:bg-[#005a3d] rounded-xl"
                >
                  Continuar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 h-12 bg-[#006F4B] hover:bg-[#005a3d] rounded-xl"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Completar Perfil
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Verificación requerida</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Tu perfil será revisado por nuestro equipo antes de aparecer en búsquedas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
