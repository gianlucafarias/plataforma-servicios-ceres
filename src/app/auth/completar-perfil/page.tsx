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
import { ProfessionalDocumentationFields } from "@/components/features/ProfessionalDocumentationFields";
import { ServiceSelectionCard } from "@/components/features/ServiceSelectionCard";
import { GROUPS, getLocations, getGenders } from "@/lib/taxonomy";
import type { CategoryGroup, PrivateDocumentFile, ProfessionalDocumentation } from "@/types";
import { 
  Phone, 
  MapPin, 
  Award, 
  Send, 
  ArrowLeft, 
  CheckCircle,
  Plus,
  Trash2,
  Building2,
  Loader2,
  IdCard,
  CircleUser,
  Upload,
  FileText,
  Globe,
  Linkedin,
  Instagram,
  Facebook,
  Store,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DateBirthPicker } from "../registro/_components/date-birth-picker";
import WhatsAppIcon from "@/components/ui/whatsapp";
import { Switch } from "@/components/ui/switch";
import { normalizeWhatsAppNumber, validateWhatsAppNumber } from "@/lib/whatsapp-normalize";
import { completeProfessionalProfile } from "@/lib/api/auth";
import { getErrorMessage } from "@/lib/api/client";
import { resolveStoredUploadValue, uploadExternalOAuthImage, uploadFile } from "@/lib/api/uploads";
import { uploadPrivateDocument } from "@/lib/api/private-documents";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";
import { usePublicCategoriesTree } from "@/hooks/usePublicCategoriesTree";
import { validateProfessionalDocumentation } from "@/lib/validation/professional-documentation";
import { trackEvent } from "@/lib/analytics/gtag";

const ALLOWED_OAUTH_IMAGE_HOSTS = new Set([
  "graph.facebook.com",
  "lookaside.facebook.com",
  "platform-lookaside.fbsbx.com",
]);

const ALLOWED_OAUTH_IMAGE_SUFFIXES = [".googleusercontent.com", ".fbcdn.net"];

function shouldUploadOAuthImage(imageUrl: string) {
  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    return (
      ALLOWED_OAUTH_IMAGE_HOSTS.has(hostname) ||
      ALLOWED_OAUTH_IMAGE_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

export default function CompletarPerfilPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: categoryTree, loading: categoriesLoading, error: categoriesError } = usePublicCategoriesTree();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Datos personales obligatorios
    dni: "",
    gender: "",
    birthDate: "",
    phone: "",
    location: "",
    // Paso 2: Datos profesionales
    bio: "",
    experienceYears: "",
    professionalGroup: "" as "" | CategoryGroup,
    serviceLocations: [] as string[],
    // Redes sociales y perfil profesional
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    website: "",
    portfolio: "",
    cv: "",
    picture: "",
    // Local físico
    hasPhysicalStore: false,
    physicalStoreAddress: "",
    services: [
      { areaSlug: "", categoryId: "", title: "", description: "" }
    ],
    documentation: {
      criminalRecord: null,
      laborReferences: [],
    } as ProfessionalDocumentation,
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const areas = useMemo(
    () =>
      formData.professionalGroup === "oficios"
        ? categoryTree.areas.filter((area) => area.active)
        : [],
    [categoryTree.areas, formData.professionalGroup]
  );
  const oficioSubcategoriesByArea = useMemo(() => {
    const byArea = new Map<string, Array<{ slug: string; name: string }>>();

    for (const subcategory of categoryTree.subcategoriesOficios) {
      if (!subcategory.active || !subcategory.areaSlug) {
        continue;
      }

      const current = byArea.get(subcategory.areaSlug) ?? [];
      current.push({ slug: subcategory.slug, name: subcategory.name });
      byArea.set(subcategory.areaSlug, current);
    }

    return byArea;
  }, [categoryTree.subcategoriesOficios]);
  const professionCategories = useMemo(
    () =>
      categoryTree.subcategoriesProfesiones
        .filter((subcategory) => subcategory.active)
        .map((subcategory) => ({ slug: subcategory.slug, name: subcategory.name })),
    [categoryTree.subcategoriesProfesiones]
  );
  const areaNameBySlug = useMemo(() => {
    const bySlug = new Map<string, string>();

    for (const area of categoryTree.areas) {
      if (area.active) {
        bySlug.set(area.slug, area.name);
      }
    }

    return bySlug;
  }, [categoryTree.areas]);
  const categoryNameBySlug = useMemo(() => {
    const bySlug = new Map<string, string>();

    for (const area of categoryTree.areas) {
      if (area.active) {
        bySlug.set(area.slug, area.name);
      }
    }

    for (const subcategory of categoryTree.subcategoriesOficios) {
      if (subcategory.active) {
        bySlug.set(subcategory.slug, subcategory.name);
      }
    }

    for (const subcategory of categoryTree.subcategoriesProfesiones) {
      if (subcategory.active) {
        bySlug.set(subcategory.slug, subcategory.name);
      }
    }

    return bySlug;
  }, [categoryTree.areas, categoryTree.subcategoriesOficios, categoryTree.subcategoriesProfesiones]);
  const locations = useMemo(() => getLocations(), []);
  const genders = useMemo(() => getGenders(), []);

  const getAvailableCategories = (group: CategoryGroup | "", areaSlug?: string) => {
    if (group === "profesiones") {
      return professionCategories;
    }

    if (group === "oficios" && areaSlug) {
      return oficioSubcategoriesByArea.get(areaSlug) ?? [];
    }

    return [];
  };
  const areaHasSelectableSubcategories = (areaSlug?: string) => {
    if (!areaSlug) {
      return false;
    }

    return (oficioSubcategoriesByArea.get(areaSlug)?.length ?? 0) > 0;
  };

  // Redirigir si no está logueado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Inicializar y descargar la foto de perfil del proveedor OAuth cuando la sesión esté disponible
  useEffect(() => {
    if (status === "authenticated" && session?.user?.image) {
      setFormData(prev => {
        // Solo procesar si no hay una foto ya establecida
        if (prev.picture) {
          return prev;
        }

        const imageUrl = session.user.image;
        
        // Si es una URL externa (OAuth), descargarla y guardarla en R2
        if (imageUrl && shouldUploadOAuthImage(imageUrl)) {
          // Descargar y guardar la imagen en R2 de forma asíncrona
          uploadExternalOAuthImage(imageUrl)
            .then((result) => {
              setFormData(current => ({ ...current, picture: result.url || result.value }));
            })
            .catch(error => {
              console.error('Error al descargar imagen OAuth:', error);
              // Si falla, usar la URL original como fallback
              setFormData(current => ({ ...current, picture: imageUrl }));
            });
          
          // Retornar el estado actual mientras se descarga
          return prev;
        } else if (imageUrl) {
          // Si ya es una URL local, usarla directamente
          return { ...prev, picture: imageUrl };
        }
        
        return prev;
      });
    }
  }, [status, session?.user?.image]);

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
    { id: 1, title: "Datos Personales", description: "Información básica requerida" },
    { id: 2, title: "Perfil Profesional", description: "Experiencia y servicios" },
    { id: 3, title: "Documentación", description: "Antecedentes y referencias" }
  ];

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      if (field === 'professionalGroup') {
        const newGroup = value as CategoryGroup | '';
        const resetServices = [{ areaSlug: '', categoryId: '', title: '', description: '' }];
        return { ...prev, professionalGroup: newGroup, services: resetServices };
      }
      
      // Para WhatsApp: validar en tiempo real pero sin normalizar
      if (field === 'whatsapp' && typeof value === 'string') {
        const error = validateWhatsAppNumber(value);
        setErrors(prev => ({ ...prev, whatsapp: error || "" }));
      }
      
      return { ...prev, [field]: value };
    });
    if (errors[field] && field !== 'whatsapp') {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const uploadPrivateFile = async (file: File): Promise<PrivateDocumentFile> => {
    const result = await uploadPrivateDocument(file);
    return {
      objectKey: result.objectKey,
      fileName: result.fileName,
    };
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...formData.services];
    const updatedService = { ...newServices[index] };

    if (field === 'areaSlug') {
      updatedService.areaSlug = value;
      if (value && !areaHasSelectableSubcategories(value)) {
        updatedService.categoryId = value;
        updatedService.title = areaNameBySlug.get(value) || "";
      } else {
        updatedService.categoryId = '';
        updatedService.title = '';
      }
    } else if (field === 'categoryId') {
      updatedService.categoryId = value;
      updatedService.title = categoryNameBySlug.get(value) || '';
    } else if (field === 'title') {
      updatedService.title = value;
    } else if (field === 'description') {
      updatedService.description = value;
    }

    newServices[index] = updatedService;
    setFormData(prev => ({ ...prev, services: newServices }));

    setErrors((prev) => {
      const next = { ...prev } as { [key: string]: string };
      if (field === 'areaSlug') {
        delete next[`service_${index}_area`];
        delete next[`service_${index}_category`];
      }
      if (field === 'categoryId') {
        delete next[`service_${index}_category`];
      }
      if (field === 'description') {
        delete next[`service_${index}_description`];
      }
      return next;
    });
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
    
    // Validar DNI
    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido";
    } else if (!/^\d{7,8}$/.test(formData.dni.trim())) {
      newErrors.dni = "El DNI debe tener entre 7 y 8 dígitos";
    }
    
    // Validar género
    if (!formData.gender.trim()) {
      newErrors.gender = "El género es requerido";
    }
    
    // Validar fecha de nacimiento
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
        
      if (actualAge < 18) {
        newErrors.birthDate = "Debes ser mayor de 18 años para registrarte";
      }
    }
    
    // Validar teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    }
    
    // Validar localidad
    if (!formData.location.trim()) {
      newErrors.location = "La localidad es requerida";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateStep2 = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.bio.trim()) newErrors.bio = "La descripción profesional es requerida";
    if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
      newErrors.experienceYears = "Los años de experiencia son requeridos";
    }
    if (!formData.professionalGroup) {
      newErrors.professionalGroup = "Debes elegir si ofreces Oficios o Profesiones";
    }
    
    // Validar que haya al menos una localidad donde ofrece servicios
    if (!formData.serviceLocations || formData.serviceLocations.length === 0) {
      newErrors.serviceLocations = "Debes agregar al menos una localidad donde ofreces tus servicios";
    }
    
    // Validar WhatsApp (obligatorio)
    if (!formData.whatsapp || !formData.whatsapp.trim()) {
      newErrors.whatsapp = "El WhatsApp es requerido";
    } else {
      const error = validateWhatsAppNumber(formData.whatsapp);
      if (error) {
        newErrors.whatsapp = error;
      }
    }
    
    // Validar dirección del local físico si tiene local
    if (formData.hasPhysicalStore && !formData.physicalStoreAddress?.trim()) {
      newErrors.physicalStoreAddress = "La dirección del local es requerida si tienes un local físico";
    }
    
    formData.services.forEach((service, index) => {
      if (!service.categoryId) newErrors[`service_${index}_category`] = "La categoría es requerida";
      if (!service.description.trim()) newErrors[`service_${index}_description`] = "La descripción es requerida";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: {[key: string]: string} = {};
    const validation = validateProfessionalDocumentation(formData.documentation);

    if (validation.errors.laborReferences) {
      newErrors.documentationReferences = validation.errors.laborReferences;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfessionalStep = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.bio.trim()) newErrors.bio = "La descripcion profesional es requerida";
    if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
      newErrors.experienceYears = "Los anios de experiencia son requeridos";
    }
    if (!formData.professionalGroup) {
      newErrors.professionalGroup = "Debes elegir si ofreces Oficios o Profesiones";
    }
    if (!formData.serviceLocations || formData.serviceLocations.length === 0) {
      newErrors.serviceLocations = "Debes agregar al menos una localidad donde ofreces tus servicios";
    }
    if (!formData.whatsapp || !formData.whatsapp.trim()) {
      newErrors.whatsapp = "El WhatsApp es requerido";
    } else {
      const error = validateWhatsAppNumber(formData.whatsapp);
      if (error) {
        newErrors.whatsapp = error;
      }
    }
    if (formData.hasPhysicalStore && !formData.physicalStoreAddress?.trim()) {
      newErrors.physicalStoreAddress = "La direccion del local es requerida si tienes un local fisico";
    }

    formData.services.forEach((service, index) => {
      if (formData.professionalGroup === "oficios" && !service.areaSlug) {
        newErrors[`service_${index}_area`] = "Elegi un area para este servicio";
      }

      const requiresSpecificCategory =
        formData.professionalGroup === "profesiones" ||
        areaHasSelectableSubcategories(service.areaSlug);

      if (requiresSpecificCategory && !service.categoryId) {
        newErrors[`service_${index}_category`] =
          formData.professionalGroup === "profesiones"
            ? "Elegi una profesion"
            : "Elegi una subcategoria";
      }

      if (!service.description.trim()) {
        newErrors[`service_${index}_description`] = "La descripcion es requerida";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateProfessionalStep();
        break;
      default:
        isValid = true;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    const documentationValidation = validateProfessionalDocumentation(formData.documentation);

    setIsLoading(true);
    
    try {
      await completeProfessionalProfile({
          dni: formData.dni.trim(),
          gender: formData.gender,
          birthDate: formData.birthDate,
          phone: normalizeWhatsAppNumber(formData.whatsapp) || formData.phone, // Usar WhatsApp normalizado como teléfono
          location: formData.location,
          bio: formData.bio,
          experienceYears: parseInt(formData.experienceYears || '0'),
          professionalGroup: formData.professionalGroup as CategoryGroup,
          serviceLocations: formData.serviceLocations,
          // Campos de redes sociales
          whatsapp: normalizeWhatsAppNumber(formData.whatsapp) ?? undefined,
          instagram: formData.instagram,
          facebook: formData.facebook,
          linkedin: formData.linkedin,
          website: formData.website,
          portfolio: formData.portfolio,
          cv: formData.cv,
          picture: formData.picture || undefined, // Enviar undefined si está vacío
          // Local físico
          hasPhysicalStore: formData.hasPhysicalStore,
          physicalStoreAddress: formData.physicalStoreAddress,
          documentation: documentationValidation.sanitized,
          services: formData.services.map((s) => ({
            categoryId: s.categoryId,
            title: s.title,
            description: s.description,
          })),
      });

      trackEvent("complete_profile", { step: "professional_profile_submitted" });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error al completar perfil:", error);
      setErrors({
        general: getErrorMessage(error, "Error al completar el perfil. Intenta nuevamente."),
      });
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

            {/* Step 1: Datos Personales */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos Personales</h2>
                  <p className="text-gray-600">Completá tu información básica requerida</p>
                </div>

                {/* DNI y Género */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dni" className="text-sm font-semibold text-gray-700">
                      DNI *
                    </Label>
                    <div className="relative mt-1">
                      <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="dni"
                        type="text"
                        value={formData.dni}
                        onChange={(e) => {
                          // Solo permitir números
                          const value = e.target.value.replace(/\D/g, '');
                          handleInputChange('dni', value);
                        }}
                        className={`pl-10 rounded-xl border-2 ${errors.dni ? 'border-red-300' : 'border-gray-200'}`}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>
                    {errors.dni && <p className="text-red-600 text-sm mt-1">{errors.dni}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Documento Nacional de Identidad (sin puntos ni espacios)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                      Género *
                    </Label>
                    <div className="relative mt-1">
                      <CircleUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange('gender', value)}
                      >
                        <SelectTrigger className={`pl-10 rounded-xl border-2 ${errors.gender ? 'border-red-300' : 'border-gray-200'}`}>
                          <SelectValue placeholder="Selecciona un género" />
                        </SelectTrigger>
                        <SelectContent>
                          {genders.map((g) => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
                  </div>
                </div>

                {/* Fecha de nacimiento */}
                <div>
                  <Label htmlFor="birthDate" className="text-sm font-semibold text-gray-700">
                    Fecha de nacimiento *
                  </Label>
                  <div className="mt-1">
                    <DateBirthPicker 
                      value={formData.birthDate} 
                      onChange={(date) => handleInputChange('birthDate', date)} 
                      error={errors.birthDate}
                    />
                  </div>
                  {errors.birthDate && <p className="text-red-600 text-sm mt-1">{errors.birthDate}</p>}
                </div>

                {/* Teléfono y Localidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                      Teléfono (WhatsApp) *
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
                    <p className="text-xs text-gray-500 mt-1">
                      Este número se usará como tu teléfono de contacto
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                      Localidad *
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
              </div>
            )}

            {/* Step 2: Perfil Profesional */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Información Profesional
                  </h2>
                  <p className="text-gray-600">
                    Cuéntanos sobre tu experiencia
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">
                    Descripción profesional *
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={`mt-1 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-none ${
                      errors.bio ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="Describe tu experiencia, especialidades y qué te diferencia..."
                    rows={4}
                  />
                  {errors.bio && <p className="text-red-600 text-sm mt-1">{errors.bio}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.bio.length}/3000 caracteres
                  </p>
                </div>

                <div>
                  <Label htmlFor="experience" className="text-sm font-semibold text-gray-700">
                    Años de experiencia *
                  </Label>
                  <div className="relative mt-1">
                    <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experienceYears}
                      onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                      className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                        errors.experienceYears ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="15"
                    />
                  </div>
                  {errors.experienceYears && <p className="text-red-600 text-sm mt-1">{errors.experienceYears}</p>}
                </div>

                {/* Lugares donde ofrece servicios */}
                <div>
                  <Label htmlFor="serviceLocations" className="text-sm font-semibold text-gray-700">
                    Lugares donde ofreces tus servicios *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Selecciona las localidades donde trabajas. La primera será tu localidad principal.
                  </p>
                  
                  <div className="space-y-3">
                    {/* Selector de localidades */}
                    <div className="relative">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.serviceLocations.includes(value)) {
                            if (value === 'all-region') {
                              // Si se agrega "Toda la región", mantener solo la principal y agregar "all-region"
                              const principalLocation = formData.serviceLocations[0] || formData.location;
                              handleInputChange('serviceLocations', principalLocation ? [principalLocation, 'all-region'] : ['all-region']);
                            } else {
                              // Si se agrega una localidad normal y ya existe "all-region", eliminarlo primero
                              const newLocations = formData.serviceLocations.filter(loc => loc !== 'all-region');
                              handleInputChange('serviceLocations', [...newLocations, value]);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className={`w-full rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                          errors.serviceLocations ? 'border-red-300' : 'border-gray-200'
                        }`}>
                          <SelectValue placeholder="Agregar localidades..." />
                        </SelectTrigger>
                        <SelectContent>
                          {locations
                            .filter(location => !formData.serviceLocations.includes(location.id))
                            .map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          {!formData.serviceLocations.includes('all-region') && (
                            <SelectItem value="all-region">Toda la región (todas las ciudades)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Localidades seleccionadas */}
                    {formData.serviceLocations.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {formData.serviceLocations.map((locationId, index) => {
                            const location = locations.find(l => l.id === locationId);
                            const isPrincipal = index === 0;
                            return (
                              <div
                                key={locationId}
                                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                                  isPrincipal 
                                    ? 'bg-green-50 border border-green-200' 
                                    : 'bg-blue-50 border border-blue-200'
                                }`}
                              >
                                <MapPin className={`h-3 w-3 ${isPrincipal ? 'text-green-600' : 'text-blue-600'}`} />
                                <span className={`text-sm ${isPrincipal ? 'text-green-800' : 'text-blue-800'}`}>
                                  {locationId === 'all-region' ? 'Toda la región' : location?.name}
                                </span>
                                {isPrincipal && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Principal
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange('serviceLocations', formData.serviceLocations.filter(id => id !== locationId));
                                  }}
                                  className={`ml-1 hover:opacity-70 transition-opacity ${
                                    isPrincipal ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
                                  }`}
                                  aria-label="Eliminar localidad"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  
                  {errors.serviceLocations && <p className="text-red-600 text-sm mt-1">{errors.serviceLocations}</p>}
                </div>

                {/* Sección de Perfil Profesional de Redes Sociales */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Perfil Profesional de Redes Sociales
                    </h3>
                    <p className="text-sm text-gray-600">
                      Agrega tus perfiles profesionales para que los clientes puedan conocerte mejor (opcional)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700">
                        WhatsApp (Teléfono de contacto) *
                      </Label>
                      <div className="relative mt-1">
                        <WhatsAppIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                          className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                            errors.whatsapp ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Sin 0 y sin 15 (ej: 349112345678)"
                        />
                      </div>
                      {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        Este número se usará como tu teléfono de contacto
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="instagram" className="text-sm font-semibold text-gray-700">
                        Instagram
                      </Label>
                      <div className="relative mt-1">
                        <Instagram className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => handleInputChange('instagram', e.target.value)}
                          className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                          placeholder="@tuusuario"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="facebook" className="text-sm font-semibold text-gray-700">
                        Facebook
                      </Label>
                      <div className="relative mt-1">
                        <Facebook className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="facebook"
                          value={formData.facebook}
                          onChange={(e) => handleInputChange('facebook', e.target.value)}
                          className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                          placeholder="/tu-pagina"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="linkedin" className="text-sm font-semibold text-gray-700">
                        LinkedIn
                      </Label>
                      <div className="relative mt-1">
                        <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                          placeholder="/in/tuperfil"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
                        Sitio Web
                      </Label>
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                          placeholder="https://tusitio.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="portfolio" className="text-sm font-semibold text-gray-700">
                        Portfolio
                      </Label>
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="portfolio"
                          value={formData.portfolio}
                          onChange={(e) => handleInputChange('portfolio', e.target.value)}
                          className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                          placeholder="https://tuportfolio.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local Físico */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Local Físico
                    </h3>
                    <p className="text-sm text-gray-600">
                      Si tenés un local físico, podés agregar la dirección (opcional)
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="hasPhysicalStore"
                        checked={formData.hasPhysicalStore}
                        onCheckedChange={(checked) => handleInputChange('hasPhysicalStore', checked)}
                      />
                      <Label htmlFor="hasPhysicalStore" className="text-sm font-semibold text-gray-700 cursor-pointer">
                        Tengo un local físico
                      </Label>
                    </div>

                    {formData.hasPhysicalStore && (
                      <div>
                        <Label htmlFor="physicalStoreAddress" className="text-sm font-semibold text-gray-700">
                          Dirección del local *
                        </Label>
                        <div className="relative mt-1">
                          <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="physicalStoreAddress"
                            value={formData.physicalStoreAddress}
                            onChange={(e) => handleInputChange('physicalStoreAddress', e.target.value)}
                            className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                            placeholder="Ej: Av. San Martín 123, Ceres"
                          />
                        </div>
                        {errors.physicalStoreAddress && (
                          <p className="text-red-600 text-sm mt-1">{errors.physicalStoreAddress}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="picture" className="text-sm font-semibold text-gray-700">
                      Foto de Perfil
                    </Label>
                    
                    {/* Mostrar foto actual si existe */}
                    {formData.picture && formData.picture.trim() !== "" && (
                      <div className="mt-2 mb-3 relative inline-block">
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                          <Image
                            src={resolvePublicUploadUrl(formData.picture)}
                            alt="Foto de perfil"
                            fill
                            className="object-cover"
                            onError={() => console.error("Error cargando imagen:", formData.picture)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('picture', '');
                            // Resetear el input file
                            const fileInput = document.getElementById('picture') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-sm z-10"
                          aria-label="Eliminar foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="relative mt-1">
                      <Upload className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="picture"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await uploadFile(file, 'image');
                              const pictureValue = resolveStoredUploadValue(result);
                              handleInputChange('picture', pictureValue);
                              setErrors(prev => {
                                const newErrors = {...prev};
                                delete newErrors.picture;
                                return newErrors;
                              });
                            } catch (error) {
                              console.error('Error uploading file:', error);
                              setErrors(prev => ({ ...prev, picture: 'Error al subir la imagen' }));
                            }
                          }
                        }}
                        className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.picture ? 'Hacé clic en la X para eliminar o subí una nueva imagen' : 'PNG, JPG, JPEG, WEBP (máx. 10MB)'}
                    </p>
                    {errors.picture && <p className="text-xs text-red-600 mt-1">{errors.picture}</p>}
                  </div>

                  <div>
                    <Label htmlFor="cv" className="text-sm font-semibold text-gray-700">
                      CV (Curriculum Vitae)
                    </Label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="cv"
                        type="file"
                        accept=".pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await uploadFile(file, 'cv');
                              handleInputChange(
                                'cv',
                                resolveStoredUploadValue(result)
                              );
                              setErrors(prev => {
                                const newErrors = {...prev};
                                delete newErrors.cv;
                                return newErrors;
                              });
                            } catch (error) {
                              console.error('Error uploading file:', error);
                              setErrors(prev => ({ ...prev, cv: 'Error al subir el CV' }));
                            }
                          }
                        }}
                        className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (máx. 15MB)</p>
                    {errors.cv && <p className="text-xs text-red-600 mt-1">{errors.cv}</p>}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Tipo de registro *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {GROUPS.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleInputChange('professionalGroup', g.id)}
                        className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
                          formData.professionalGroup === g.id
                            ? 'border-[#006F4B] bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">{g.name}</div>
                          <div className={`h-3 w-3 rounded-full ${formData.professionalGroup === g.id ? 'bg-[#006F4B]' : 'bg-gray-300'}`} />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          {g.id === 'oficios'
                            ? 'Trabajos manuales y técnicos por oficio (ej: plomería, electricidad, mantenimiento).'
                            : 'Profesiones colegiadas o formales (ej: enfermería, arquitectura, abogacía).'}
                        </p>
                      </button>
                    ))}
                  </div>
                  {errors.professionalGroup && <p className="text-red-600 text-sm mt-1">{errors.professionalGroup}</p>}
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

                    {categoriesError && (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        No se pudieron cargar las categorias actualizadas. Intenta nuevamente en unos segundos.
                      </p>
                    )}

                    {formData.services.map((service, index) => (
                      <ServiceSelectionCard
                        key={`service-selector-${index}`}
                        group={formData.professionalGroup as CategoryGroup}
                        index={index}
                        service={service}
                        areas={areas.map((area) => ({ slug: area.slug, name: area.name }))}
                        categoryOptions={getAvailableCategories(formData.professionalGroup, service.areaSlug)}
                        selectedAreaName={service.areaSlug ? areaNameBySlug.get(service.areaSlug) : ""}
                        selectedServiceName={service.title}
                        categoriesLoading={categoriesLoading}
                        areaError={errors[`service_${index}_area`]}
                        categoryError={errors[`service_${index}_category`]}
                        descriptionError={errors[`service_${index}_description`]}
                        canRemove={formData.professionalGroup !== 'profesiones' && formData.services.length > 1}
                        onAreaChange={(value) => handleServiceChange(index, 'areaSlug', value)}
                        onCategoryChange={(value) => handleServiceChange(index, 'categoryId', value)}
                        onDescriptionChange={(value) => handleServiceChange(index, 'description', value)}
                        onRemove={() => removeService(index)}
                      />
                    ))}

                    {false && formData.services.map((service, index) => (
                      <Card key={index} className="p-4 rounded-xl border-2 border-gray-100">
                        <div className="space-y-3">
                          {formData.professionalGroup === 'oficios' && (
                            <Select
                              value={service.areaSlug}
                              onValueChange={(value) => handleServiceChange(index, 'areaSlug', value)}
                              disabled={categoriesLoading || areas.length === 0}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder={categoriesLoading ? "Cargando áreas..." : "Selecciona un área"} />
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
                            <SelectTrigger
                              disabled={
                                categoriesLoading ||
                                (formData.professionalGroup === 'oficios' && !service.areaSlug)
                              }
                              className={`rounded-xl ${errors[`service_${index}_category`] ? 'border-red-300' : ''}`}
                            >
                              <SelectValue
                                placeholder={
                                  categoriesLoading
                                    ? "Cargando categorías..."
                                    : formData.professionalGroup === "profesiones"
                                      ? "Selecciona tu profesión"
                                      : service.areaSlug
                                        ? "Selecciona una subcategoría"
                                        : "Selecciona un área primero"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCategories(formData.professionalGroup, service.areaSlug).map((sub) => (
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

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Documentación</h2>
                  <p className="text-gray-600">
                    El certificado de antecedentes penales es obligatorio para que tu perfil pueda aparecer en la plataforma.
                    Las referencias laborales son opcionales.
                  </p>
                </div>

                <ProfessionalDocumentationFields
                  value={formData.documentation}
                  onChange={(documentation) => {
                    setFormData((prev) => ({ ...prev, documentation }));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.documentationReferences;
                      return next;
                    });
                  }}
                  uploadDocument={uploadPrivateFile}
                  errors={{
                    laborReferences: errors.documentationReferences,
                  }}
                  helperText="Si no lo tienes ahora, podrás cargarlo más tarde desde la configuración de tu perfil."
                />
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
              
              {currentStep < 3 ? (
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

