"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { GROUPS, getAreasByGroup, getSubcategories, getLocations, getGenders } from "@/lib/taxonomy";
import type { CategoryGroup } from "@/types";
import { Eye, EyeOff, User, Mail, Lock, Phone, Building2, Award, Send, ArrowLeft, CheckCircle, MapPin, CircleUser, Upload, FileText, Globe, Linkedin, Instagram, Facebook, Store } from "lucide-react";
import WhatsAppIcon from "@/components/ui/whatsapp";
import Link from "next/link";
import { DateBirthPicker } from "./_components/date-birth-picker";
import { normalizeWhatsAppNumber, validateWhatsAppNumber } from "@/lib/whatsapp-normalize";

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

export default function RegistroPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Información personal
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    picture: "",
    email: "",
    confirmEmail: "",
    phone: "",
    location: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    
    // Paso 1: Perfil profesional de redes sociales
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    website: "",
    portfolio: "",
    cv: "",
    
    // Paso 2: Información profesional
    bio: "",
    experienceYears: "",
    specialties: [] as string[],
    professionalGroup: "" as "" | CategoryGroup,
    serviceLocations: [] as string[], // Lugares donde ofrece servicios
    hasPhysicalStore: false,
    physicalStoreAddress: "",
    
    // Paso 3: Servicios
    services: [
      { areaSlug: "", categoryId: "", title: "", description: "" }
    ]
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const areas = useMemo(() => getAreasByGroup(formData.professionalGroup as CategoryGroup), [formData.professionalGroup]);
  const locations = useMemo(() => getLocations(), []);
  const genders = useMemo(() => getGenders(), []);

  // Registrarse con redes sociales y luego completar perfil profesional
  const handleSocialRegister = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    setErrors({}); // Limpiar errores previos
    
    try {
      // Redirige a OAuth y luego a completar-perfil
      const result = await signIn(provider, { 
        callbackUrl: "/auth/completar-perfil",
        redirect: false 
      });
      
      // Si hay un error, mostrarlo
      if (result?.error) {
        const errorMessages: Record<string, string> = {
          AccessDenied: "El acceso con redes sociales no está disponible en este momento.",
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
        
        const errorMessage = errorMessages[result.error] || errorMessages.Default;
        console.error(`Error en registro con ${provider}:`, result.error, result);
        setErrors({ general: `Error al registrarse con ${provider === "google" ? "Google" : "Facebook"}: ${errorMessage}` });
        setSocialLoading(null);
        return;
      }
      
      // Si es exitoso, redirigir manualmente
      if (result?.ok && result.url) {
        window.location.href = result.url;
        return;
      }
      
      // Si no hay URL pero es ok, podría ser que ya estamos autenticados
      if (result?.ok) {
        router.push("/auth/completar-perfil");
        return;
      }
      
    } catch (err) {
      console.error(`Error con ${provider}:`, err);
      setErrors({ 
        general: `Error al registrarse con ${provider === "google" ? "Google" : "Facebook"}. Por favor, intentá nuevamente o usá el formulario de registro.` 
      });
      setSocialLoading(null);
    }
  };

  // Cuando cambia la localidad principal, agregarla a serviceLocations si no está
  useEffect(() => {
    if (formData.location && !formData.serviceLocations.includes(formData.location)) {
      setFormData(prev => ({
        ...prev,
        serviceLocations: [formData.location, ...prev.serviceLocations]
      }));
    }
  }, [formData.location]);

  const steps = [
    { id: 1, title: "Datos Personales", description: "Información básica" },
    { id: 2, title: "Perfil Profesional", description: "Experiencia y bio" },
    { id: 3, title: "Servicios", description: "Servicios ofrecidos" }
  ];

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => {
      // Si cambia el grupo profesional a 'profesiones', forzar un único servicio sin área
      if (field === 'professionalGroup') {
        const newGroup = value as CategoryGroup | '';
        const resetServices = [{ areaSlug: '', categoryId: '', title: '', description: '', priceRange: '' }];
        return { ...prev, professionalGroup: newGroup, services: resetServices };
      }
      
      // Para WhatsApp: NO normalizar mientras escribe, solo guardar lo que el usuario escribe
      // La normalización se hará al enviar el formulario
      return { ...prev, [field]: value };
    });
    
    // Validar WhatsApp en tiempo real pero sin normalizar
    if (field === 'whatsapp' && typeof value === 'string') {
      const error = validateWhatsAppNumber(value);
      setErrors(prev => ({ ...prev, whatsapp: error || "" }));
    } else if (errors[field]) {
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

    // Limpiar errores relacionados si aplica
    setErrors((prev) => {
      const next = { ...prev } as { [key: string]: string };
      if (field === 'areaSlug') {
        delete next[`service_${index}_category`];
        delete next[`service_${index}_title`];
      }
      if (field === 'categoryId') {
        delete next[`service_${index}_category`];
        delete next[`service_${index}_title`];
      }
      if (field === 'title') delete next[`service_${index}_title`];
      if (field === 'description') delete next[`service_${index}_description`];
      return next;
    });
  };

  const addService = () => {
    if (formData.professionalGroup === 'profesiones') return; // Profesiones: un solo registro
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

    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida"
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age
        
      if (actualAge < 18) {
        newErrors.birthDate = "Debes ser mayor de 18 años para registrarte"
      }
    }

    if (!formData.firstName.trim()) newErrors.firstName = "El nombre es requerido";
    if (!formData.lastName.trim()) newErrors.lastName = "El apellido es requerido";
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Ingresa un email válido";
    }
    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = "Confirma tu email";
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = "Los emails no coinciden";
    }
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido";
    if (!formData.location.trim()) newErrors.location = "La localidad es requerida";
    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
    }

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

    // Validar que haya al menos una localidad donde ofrece servicios
    if (!formData.serviceLocations || formData.serviceLocations.length === 0) {
      newErrors.serviceLocations = "Debes agregar al menos una localidad donde ofreces tus servicios";
    }

    // Validar WhatsApp si está presente
    if (formData.whatsapp) {
      const error = validateWhatsAppNumber(formData.whatsapp);
      if (error) {
        newErrors.whatsapp = error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: {[key: string]: string} = {};

    formData.services.forEach((service, index) => {
      if (!service.categoryId) newErrors[`service_${index}_category`] = "La categoría es requerida";
      if (!service.description.trim()) newErrors[`service_${index}_description`] = "La descripción es requerida";
      // priceRange eliminado
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }

    // Paso 1: Validar que el email no exista
    if (isValid && currentStep === 1) {
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
        });
        if (!response.ok) {
          throw new Error('Error al verificar el email');
        }
        const data = await response.json();
        if (data.exists) {
          setErrors(prev => ({ ...prev, email: "Ya existe un usuario con este email" }));
          return; // No avanzar
        }
      } catch (error) {
        console.error('Error al verificar el email:', error);
        setErrors(prev => ({ ...prev, email: 'Error al verificar el email' }));
        return; // No avanzar
      }
      }

    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsLoading(true);
    
    try {
      // Usar el hook useAuth para registrar al usuario
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        birthDate: formData.birthDate,
        location: formData.location,
        bio: formData.bio,
        experienceYears: parseInt(String(formData.experienceYears || '0')),
        professionalGroup: formData.professionalGroup as CategoryGroup,
        serviceLocations: formData.serviceLocations,
        // Campos de redes sociales - normalizar WhatsApp antes de enviar
        whatsapp: normalizeWhatsAppNumber(formData.whatsapp) ?? undefined,
        instagram: formData.instagram,
        facebook: formData.facebook,
        linkedin: formData.linkedin,
        website: formData.website,
        portfolio: formData.portfolio,
        cv: formData.cv,
        picture: formData.picture,
        // Local físico
        hasPhysicalStore: formData.hasPhysicalStore,
        physicalStoreAddress: formData.physicalStoreAddress,
        services: formData.services.map((s) => ({
          categoryId: s.categoryId,
          title: s.title,
          description: s.description,
        })),
      });
      
      // Redirigir a página de éxito
      router.push("/auth/registro/exito");
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: error instanceof Error ? error.message : "Error al registrar. Intenta nuevamente." });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
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
              <div className="w-16 h-0.5 mx-4 self-center">
                <div className={`w-full h-full transition-all duration-300 ${
                  currentStep > step.id ? 'bg-[#006F4B]' : 'bg-gray-300'
                }`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Información Personal
        </h2>
        <p className="text-gray-600">
          Completa tus datos básicos
        </p>
      </div>

      {/* Registro rápido con redes sociales */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <p className="text-sm text-center text-gray-600 mb-4">
          <span className="font-medium text-gray-900">Registro rápido:</span> Usá tu cuenta de Google o Facebook
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialRegister("google")}
            disabled={isLoading || socialLoading !== null}
            className="h-11 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-white font-medium transition-all"
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
            onClick={() => handleSocialRegister("facebook")}
            disabled={isLoading || socialLoading !== null}
            className="h-11 rounded-xl border-2 border-gray-200 hover:border-[#1877F2] hover:bg-blue-50 font-medium transition-all"
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
        <p className="text-xs text-center text-gray-500 mt-3">
          Después de autenticarte, completarás tu perfil profesional
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-gray-400 text-sm">o completá el formulario</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
            Nombre
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.firstName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Tu nombre"
            />
          </div>
          {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
            Apellido
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.lastName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="Tu apellido"
            />
          </div>
          {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.email ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="tucorreo@correo.com"
            />
          </div>
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="confirmEmail" className="text-sm font-semibold text-gray-700">
            Confirmar Email
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirmEmail"
              type="email"
              value={formData.confirmEmail}
              onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
              className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.confirmEmail ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="tucorreo@correo.com"
            />
          </div>
          {errors.confirmEmail && <p className="text-red-600 text-sm mt-1">{errors.confirmEmail}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birthDate" className="text-sm font-semibold text-gray-700">
            Fecha de nacimiento
          </Label>
          <div className="relative mt-1">
            <DateBirthPicker value={formData.birthDate} onChange={(date) => handleInputChange('birthDate', date)} error={errors.birthDate} />
          </div>
          {errors.birthDate && <p className="text-red-600 text-sm mt-1">{errors.birthDate}</p>}
        </div>

        <div>
          <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
            Género
          </Label>
          <div className="relative mt-1">
          <CircleUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
              
            >
              <SelectTrigger className="w-full pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
          Teléfono
        </Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
              errors.phone ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Sin 0 y sin 15 (3491567890) "
          />
        </div>
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
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
            <SelectTrigger className={`w-full pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
              errors.location ? 'border-red-300' : 'border-gray-200'
            }`}>
              <SelectValue placeholder="Selecciona tu localidad principal" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Selecciona la localidad donde resides. Podrás agregar más localidades donde ofreces servicios en el siguiente paso.
        </p>
      </div>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Contraseña
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`pl-10 pr-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.password ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
            Confirmar contraseña
          </Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`pl-10 pr-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>


      <div className="pt-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
              Acepto los términos y condiciones
            </Label>
            <p className="text-sm text-gray-500">
              He leído y acepto los{" "}
              <Link href="/terminos" className="text-[#006F4B] hover:text-[#008F5B] underline">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="text-[#006F4B] hover:text-[#008F5B] underline">
                política de privacidad
              </Link>{" "}
              de la plataforma.
            </p>
            {errors.acceptTerms && <p className="text-red-600 text-sm">{errors.acceptTerms}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
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
              WhatsApp *
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

        {/* Local Físico */}
        <div className="mt-6 pt-6 border-t border-gray-200">
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
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', 'image'); // Indicar explícitamente que es una imagen
                      
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        // Usar value si existe (normalizado), sino filename para local o url para R2
                        const pictureValue = result.value || (result.storage === 'r2' ? result.url : result.filename);
                        handleInputChange('picture', pictureValue);
                        setErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.picture;
                          return newErrors;
                        });
                      } else {
                        setErrors(prev => ({ ...prev, picture: result.error || 'Error al subir la imagen' }));
                      }
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      setErrors(prev => ({ ...prev, picture: 'Error al subir la imagen' }));
                    }
                  }
                }}
                className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, WEBP (máx. 10MB)</p>
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
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', 'cv'); // Indicar explícitamente que es un CV
                      
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        handleInputChange(
                          'cv',
                          result.url || result.path || result.filename
                        );
                        setErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.cv;
                          return newErrors;
                        });
                      } else {
                        setErrors(prev => ({ ...prev, cv: result.error || 'Error al subir el CV' }));
                      }
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
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formData.professionalGroup === 'profesiones' ? 'Tu profesión' : 'Servicios que Ofreces'}
        </h2>
        <p className="text-gray-600">
          {formData.professionalGroup === 'profesiones' 
            ? 'Seleccioná tu profesión y describí tu oferta'
            : 'Agregá los servicios que brindás'}
        </p>
      </div>

      {formData.services.map((service, index) => (
        <Card key={index} className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {formData.professionalGroup === 'profesiones' ? 'Profesión' : `Servicio ${index + 1}`}
              </h3>
              {formData.professionalGroup !== 'profesiones' && formData.services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {formData.professionalGroup === 'oficios' && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Área</Label>
                  <Select
                    value={service.areaSlug}
                    onValueChange={(value) => handleServiceChange(index, 'areaSlug', value)}
                  >
                    <SelectTrigger className="mt-1 w-full rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200">
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => (
                        <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className={`${formData.professionalGroup === 'oficios' ? '' : 'md:col-span-2'}`}>
                <Label className="text-sm font-semibold text-gray-700">{formData.professionalGroup === 'profesiones' ? 'Profesión' : 'Categoría	'}</Label>
                <Select
                  value={service.categoryId}
                  onValueChange={(value) => handleServiceChange(index, 'categoryId', value)}
                >
                  <SelectTrigger
                    disabled={formData.professionalGroup === 'oficios' && !service.areaSlug}
                    className={`mt-1 w-full rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                      errors[`service_${index}_category`] ? 'border-red-300' : 'border-gray-200'
                    } ${formData.professionalGroup === 'oficios' && !service.areaSlug ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <SelectValue placeholder={
                      formData.professionalGroup === 'profesiones'
                        ? 'Selecciona tu profesión'
                        : (service.areaSlug ? 'Selecciona una categoría' : 'Selecciona un área primero')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategories((formData.professionalGroup || 'oficios') as CategoryGroup, service.areaSlug || undefined).map((sub) => (
                      <SelectItem key={sub.slug} value={sub.slug}>{sub.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[`service_${index}_category`] && (
                  <p className="text-red-600 text-sm mt-1">{errors[`service_${index}_category`]}</p>
                )}
                {formData.professionalGroup === 'oficios' && (
                  <p className="text-xs text-gray-500 mt-2">Podés agregar más servicios abajo.</p>
                )}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-dashed border-gray-200 p-4 bg-white/60">
              <Label className="text-sm font-semibold text-gray-700">Título del servicio</Label>
              <Input
                value={service.title}
                onChange={(e) => handleServiceChange(index, 'title', e.target.value)}
                disabled
                readOnly
                className={`mt-1 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 ${
                  errors[`service_${index}_title`] ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Selecciona un servicio"
              />
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <Label className="text-sm font-semibold text-gray-700">Descripción</Label>
              <Textarea
                value={service.description}
                onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                className={`mt-1 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 resize-none bg-white ${
                  errors[`service_${index}_description`] ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder={formData.professionalGroup === 'profesiones' ? 'Contanos tu formación, matrícula (si aplica) y áreas de práctica...' : 'Describe detalladamente qué incluye este servicio...'}
                rows={3}
              />
              {errors[`service_${index}_description`] && (
                <p className="text-red-600 text-sm mt-1">{errors[`service_${index}_description`]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {formData.professionalGroup !== 'profesiones' && (
        <button
          type="button"
          onClick={addService}
          className="w-full bg-gray-50 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-100 font-medium transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-gray-400"
        >
          + Agregar otro servicio
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#006F4B] via-[#008255] to-[#004d35] relative overflow-hidden">
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-32 h-32 rounded-full border-2 border-white/30"></div>
          <div className="absolute bottom-10 right-20 w-24 h-24 rounded-full border-2 border-white/20"></div>
        </div>
        
        <div className="relative z-10 px-4 pt-8 pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver al inicio</span>
            </Link>
            
            <div className="text-center text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Registrate como Profesional
              </h1>
              <p className="text-white/80 text-lg max-w-2xl mx-auto">
                Completá tu perfil y comenzá a ofrecer tus servicios en la plataforma oficial de Ceres en Red
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 md:-mt-10 pb-12 relative z-10">
        <Card className="overflow-hidden shadow-xl border-0">
          <CardContent className="p-6 md:p-8">
            {/* Stepper visual */}
            {renderStepIndicator()}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl hover:bg-gray-200 font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-[#006F4B] hover:bg-[#005a3d] text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#006F4B]/20 cursor-pointer"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-[#006F4B] hover:bg-[#005a3d] text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[#006F4B]/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Registro
                    </>
                  )}
                </button>
              )}
            </div>

            {currentStep === 1 && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  ¿Ya tienes cuenta?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-[#006F4B] hover:text-[#008F5B] font-semibold transition-colors"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">Verificación requerida</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Tu registro será revisado por nuestro equipo. Te notificaremos por email cuando sea aprobado.
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

