"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GROUPS, getAreasByGroup, getSubcategories, getLocations, getGenders } from "@/lib/taxonomy";
import type { CategoryGroup } from "@/types";
import { Eye, EyeOff, User, Mail, Lock, Phone, Building2, Award, Send, ArrowLeft, CheckCircle, MapPin, CircleUser, Upload, FileText, Globe, Linkedin, Instagram, Facebook, MessageCircle } from "lucide-react";
import Link from "next/link";
import { DateBirthPicker } from "./_components/date-birth-picker";

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
    location: "ceres",
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
    
    // Paso 3: Servicios
    services: [
      { areaSlug: "", categoryId: "", title: "", description: "" }
    ]
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const areas = useMemo(() => getAreasByGroup(formData.professionalGroup as CategoryGroup), [formData.professionalGroup]);
  const locations = useMemo(() => getLocations(), []);
  const genders = useMemo(() => getGenders(), []);

  // Inicializar serviceLocations con la localidad principal cuando cambie
  useEffect(() => {
    if (formData.location && !formData.serviceLocations.includes(formData.location)) {
      setFormData(prev => ({
        ...prev,
        serviceLocations: [formData.location, ...prev.serviceLocations]
      }));
    }
  }, [formData.location, formData.serviceLocations]);

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
        // Campos de redes sociales
        whatsapp: formData.whatsapp,
        instagram: formData.instagram,
        facebook: formData.facebook,
        linkedin: formData.linkedin,
        website: formData.website,
        portfolio: formData.portfolio,
        cv: formData.cv,
        picture: formData.picture,
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
        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
          Localidad
        </Label>
        <div className="relative mt-1">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Select
                        value={formData.location}
                    onValueChange={(value) => handleInputChange('location', value)}
                  >

                    <SelectTrigger className="w-full pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200">

                      <SelectValue placeholder="Selecciona una localidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        </div>
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
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
          Selecciona las localidades donde trabajas. Por defecto se incluye tu localidad principal.
        </p>
        
        <div className="space-y-3">
          {/* Localidad principal (no editable, solo informativa) */}
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {locations.find(l => l.id === formData.location)?.name || 'Localidad principal'}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Principal
              </span>
            </div>
          </div>

          {/* Selector de localidades adicionales */}
          <div className="relative">
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !formData.serviceLocations.includes(value)) {
                  handleInputChange('serviceLocations', [...formData.serviceLocations, value]);
                }
              }}
            >
              <SelectTrigger className="w-full rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200">
                <SelectValue placeholder="Agregar más localidades..." />
              </SelectTrigger>
              <SelectContent>
                {locations
                  .filter(location => location.id !== formData.location && !formData.serviceLocations.includes(location.id))
                  .map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                <SelectItem value="all-region">Toda la región (todas las ciudades)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Localidades seleccionadas */}
          {formData.serviceLocations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Localidades adicionales:</p>
              <div className="flex flex-wrap gap-2">
                {formData.serviceLocations.map((locationId) => {
                  const location = locations.find(l => l.id === locationId);
                  return (
                    <div
                      key={locationId}
                      className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                    >
                      <MapPin className="h-3 w-3 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {locationId === 'all-region' ? 'Toda la región' : location?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('serviceLocations', formData.serviceLocations.filter(id => id !== locationId));
                        }}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
              <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="pl-10 rounded-lg border-2 focus:ring-4 focus:ring-green-100 focus:border-[#006F4B] transition-all duration-200 border-gray-200"
                placeholder="+54 9 3491 123456"
              />
            </div>
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
                      
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        handleInputChange('picture', result.filename);
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
                      
                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const result = await response.json();
                      if (result.success) {
                        handleInputChange('cv', result.filename);
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
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden p-0">
          

          <CardContent className="p-8">
            {/* Stepper visual */}
            {renderStepIndicator()}

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex space-x-4 mt-8">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white py-4 px-6 rounded-lg font-semibold hover:from-[#008F5B] hover:to-[#006F4B] focus:ring-4 focus:ring-green-100 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white py-4 px-6 rounded-lg font-semibold hover:from-[#008F5B] hover:to-[#006F4B] focus:ring-4 focus:ring-green-100 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[#006F4B] mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Verificación:</span> Tu registro será revisado por nuestro equipo. Te notificaremos por email cuando sea aprobado.
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

