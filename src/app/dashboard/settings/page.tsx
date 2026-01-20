"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getLocations, GROUPS, SUBCATEGORIES_PROFESIONES, SUBCATEGORIES_OFICIOS, AREAS_OFICIOS } from "@/lib/taxonomy";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Award, Save, Loader2, Linkedin, Globe, Upload, FileText, X, Store, AlertCircle } from "lucide-react";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { toast } from "sonner";
import { ImageCropper } from "@/components/ui/image-cropper";


export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Datos personales
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    location: "",
    
    // Datos profesionales
    bio: "",
    experienceYears: 0,
    specialty: "", // Solo UNA especialidad para profesiones
    professionalGroup: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    website: "",
    portfolio: "",
    cv: "",
    picture: "",
    serviceLocations: [] as string[],
    hasPhysicalStore: false,
    physicalStoreAddress: "",
    
    // Servicios
    services: [] as Array<{
      id: string;
      title: string;
      description: string;
      category: { name: string };
    }>
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estados para el recorte de imagen
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  
  // Función para detectar el tipo de perfil
  const getProfileType = () => {
    return formData.professionalGroup as "oficios" | "profesiones" | "";
  };


  // Función para obtener las especialidades disponibles SOLO para profesiones
  const getAvailableSpecialties = () => {
    const profileType = getProfileType();
    // Solo mostrar especialidades para profesiones
    return profileType === "profesiones" ? SUBCATEGORIES_PROFESIONES : [];
  };

  useEffect(() => {
    loadProfessionalData();
  }, []);

  // Evitar perder cambios al recargar/cerrar pestaña (protección extra)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };

    if (hasChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  // Sincronizar serviceLocations con la ubicación principal
  useEffect(() => {
    if (formData.location) {
      setFormData(prev => {
        // Convertir location (nombre) a ID
        const locations = getLocations();
        const locationObj = locations.find(l => l.name === formData.location);
        const locationId = locationObj?.id || formData.location;
        
        // Si la localidad principal no está en serviceLocations, agregarla al inicio
        if (!prev.serviceLocations.includes(locationId)) {
          return {
            ...prev,
            serviceLocations: [locationId, ...prev.serviceLocations.filter(loc => loc !== locationId)]
          };
        }
        // Si la localidad principal cambió, actualizar serviceLocations
        if (prev.serviceLocations[0] !== locationId) {
          return {
            ...prev,
            serviceLocations: [locationId, ...prev.serviceLocations.filter(loc => loc !== locationId)]
          };
        }
        return prev;
      });
    }
  }, [formData.location]);

  const loadProfessionalData = async () => {
    try {
      const response = await fetch('/api/professional/me');
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Debug: ver qué está llegando
        console.log('birthDate recibido:', data.user.birthDate, typeof data.user.birthDate);
        
        // Formatear fecha correctamente
        let formattedBirthDate = "";
        if (data.user.birthDate) {
          try {
            let date: Date;
            
            // Prisma devuelve fechas como strings ISO cuando se serializa a JSON
            if (typeof data.user.birthDate === 'string') {
              date = new Date(data.user.birthDate);
            } else if (data.user.birthDate instanceof Date) {
              date = data.user.birthDate;
            } else {
              // Si viene como objeto con propiedades (puede pasar con Prisma)
              date = new Date(data.user.birthDate);
            }
            
            // Verificar que la fecha sea válida
            if (!isNaN(date.getTime())) {
              // Convertir a formato YYYY-MM-DD para el input type="date"
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              formattedBirthDate = `${year}-${month}-${day}`;
              console.log('Fecha formateada:', formattedBirthDate);
            } else {
              console.warn('Fecha inválida:', data.user.birthDate);
            }
          } catch (e) {
            console.error('Error formateando fecha:', e, data.user.birthDate);
          }
        } else {
          console.log('No hay birthDate en los datos');
        }

        // Formatear ubicación correctamente - buscar coincidencia en LOCATIONS
        let formattedLocation = "";
        const rawLocation = data.user.location || data.location || "";
        if (rawLocation) {
          // Buscar si la ubicación guardada coincide con alguna de LOCATIONS
          const locations = getLocations();
          // Primero buscar por nombre completo
          let foundLocation = locations.find(loc => loc.name === rawLocation);
          // Si no se encuentra, buscar por ID
          if (!foundLocation) {
            foundLocation = locations.find(loc => loc.id === rawLocation);
          }
          if (foundLocation) {
            formattedLocation = foundLocation.name; // Usar el nombre completo para el Select
          } else {
            // Si no coincide exactamente, usar el valor tal cual (puede ser una ubicación personalizada)
            formattedLocation = rawLocation;
          }
        }

        // Convertir serviceLocations a IDs si vienen como nombres
        const locations = getLocations();
        const formattedServiceLocations = (data.serviceLocations || []).map((loc: string) => {
          // Si es un nombre completo, buscar el ID
          const found = locations.find(l => l.name === loc);
          if (found) {
            return found.id; // Usar ID
          }
          // Si ya es un ID, mantenerlo
          return loc;
        });

        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          birthDate: formattedBirthDate,
          location: formattedLocation,
          bio: data.bio || "",
          experienceYears: data.experienceYears || 0,
          specialty: data.specialties?.[0] || "", // Solo tomar la primera especialidad
          professionalGroup: data.professionalGroup || "",
          whatsapp: data.whatsapp || "",
          instagram: data.instagram || "",
          facebook: data.facebook || "",
          linkedin: data.linkedin || "",
          website: data.website || "",
          portfolio: data.portfolio || "",
          cv: data.CV || "",
          picture: data.ProfilePicture || "",
          serviceLocations: formattedServiceLocations,
          hasPhysicalStore: data.hasPhysicalStore || false,
          physicalStoreAddress: data.physicalStoreAddress || "",
          services: data.services || []
        });
      }
    } catch (error) {
      console.error('Error cargando datos del profesional:', error);
      toast.error('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string, value: unknown): string => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          return 'Debe tener al menos 2 caracteres';
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value || (typeof value === 'string' && !emailRegex.test(value))) {
          return 'Email inválido';
        }
        break;
      case 'phone':
        if (value && typeof value === 'string' && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
          return 'Teléfono inválido';
        }
        break;
      case 'experienceYears':
        if (typeof value === 'number' && (value < 0 || value > 50)) {
          return 'Los años de experiencia deben estar entre 0 y 50';
        }
        break;
      case 'whatsapp':
        if (value && typeof value === 'string' && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
          return 'WhatsApp inválido';
        }
        break;
      case 'instagram':
        if (value && typeof value === 'string' && !/^@?[a-zA-Z0-9._]{1,30}$/.test(value)) {
          return 'Usuario de Instagram inválido';
        }
        break;
      case 'facebook':
        if (value && typeof value === 'string' && !/^[a-zA-Z0-9._]+$/.test(value)) {
          return 'Perfil de Facebook inválido';
        }
        break;
      case 'linkedin':
        if (value && typeof value === 'string') {
          // Permitir formatos comunes de LinkedIn:
          // - /in/username
          // - /company/companyname
          // - username (sin slash)
          // - linkedin.com/in/username
          const linkedinPattern = /^(\/)?(in|company|pub|school|edu)\/[a-zA-Z0-9._-]+$|^[a-zA-Z0-9._-]+$|^https?:\/\/(www\.)?linkedin\.com\/(in|company|pub|school|edu)\/[a-zA-Z0-9._-]+$/i;
          if (!linkedinPattern.test(value)) {
            return 'Perfil de LinkedIn inválido. Usa formato: /in/tuusuario o solo tuusuario';
          }
        }
        break;
      case 'website':
      case 'portfolio':
        if (value && typeof value === 'string' && !/^https?:\/\/.+\..+/.test(value)) {
          return 'URL inválida (debe empezar con http:// o https://)';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: unknown) => {
    // Validar el campo
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    setHasChanges(true);
  };

  // No necesitamos esta función para selección múltiple

  // Estados para gestión de servicios
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    categorySlug: '',
    title: '',
    description: '',
    priceRange: ''
  });
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Funciones para gestión de servicios
  const handleAddService = () => {
    setServiceForm({ categorySlug: '', title: '', description: '', priceRange: '' });
    setEditingServiceId(null);
    setShowServiceDialog(true);
  };

  const handleEditService = (serviceId: string) => {
    const service = formData.services.find(s => s.id === serviceId);
    if (service) {
      // Necesitamos obtener el slug de la categoría desde el nombre
      const category = SUBCATEGORIES_OFICIOS.find(cat => cat.name === service.category.name);
      setServiceForm({
        categorySlug: category?.slug || '',
        title: service.title,
        description: service.description,
        priceRange: '' // El priceRange no está en el tipo de service en settings
      });
      setEditingServiceId(serviceId);
      setShowServiceDialog(true);
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.categorySlug || !serviceForm.description) {
      toast.error('Completá la categoría y la descripción');
      return;
    }

    try {
      // Si no hay título personalizado, usar el nombre de la categoría
      const categoryName = SUBCATEGORIES_OFICIOS.find(c => c.slug === serviceForm.categorySlug)?.name || '';
      const serviceToSave = {
        ...serviceForm,
        title: serviceForm.title.trim() || categoryName
      };

      if (editingServiceId) {
        // Editar servicio existente
        const response = await fetch(`/api/services/${editingServiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: serviceToSave.title,
            description: serviceToSave.description,
            priceRange: serviceToSave.priceRange || null
          })
        });
        const result = await response.json();
        if (result.success) {
          toast.success('Servicio actualizado correctamente');
          setShowServiceDialog(false);
          await loadProfessionalData();
        } else {
          toast.error(result.message || 'Error al actualizar el servicio');
        }
      } else {
        // Crear nuevo servicio
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceToSave)
        });
        const result = await response.json();
        if (result.success) {
          toast.success('Servicio agregado correctamente');
          setShowServiceDialog(false);
          await loadProfessionalData();
        } else {
          toast.error(result.message || 'Error al crear el servicio');
        }
      }
    } catch (error) {
      console.error('Error guardando servicio:', error);
      toast.error('Error al guardar el servicio');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Servicio eliminado correctamente');
        await loadProfessionalData(); // Recargar datos
      } else {
        toast.error('Error al eliminar el servicio');
      }
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      toast.error('Error al eliminar el servicio');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar campos obligatorios
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    }

    // Validar todos los campos
    Object.keys(formData).forEach(field => {
      if (field !== 'services' && field !== 'specialties') {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) {
          newErrors[field] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/professional/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Perfil actualizado correctamente');
        setHasChanges(false);
        await loadProfessionalData(); // Recargar datos
      } else {
        toast.error(result.message || result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const availableSpecialties = getAvailableSpecialties();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header mejorado */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  Configuración del Perfil
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {formData.professionalGroup 
                    ? `Gestiona tu información como ${getProfileType() === "oficios" ? "profesional de oficios" : "profesional"}`
                    : "Gestiona tu información personal y profesional"
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                {formData.professionalGroup && (
                  <Badge 
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${getProfileType() === "oficios" ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
                  >
                    {getProfileType() === "oficios" ? "Oficios" : "Profesiones"}
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !hasChanges}
                    size="lg"
                    className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B] flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {hasChanges ? 'Guardar Cambios' : 'Sin cambios'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      if (!hasChanges) {
                        router.push("/dashboard");
                        return;
                      }
                      setShowLeaveDialog(true);
                    }}
                  >
                    Volver al dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">

          {/* Información Personal */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Tu nombre"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Tu apellido"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="tu@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => handleInputChange('location', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Selecciona tu ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {getLocations().map((location) => (
                        <SelectItem key={location.id} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Información Profesional */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Información Profesional
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre tu experiencia y especialidades..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Años de Experiencia</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.experienceYears ? "border-red-500" : ""}
                />
                {errors.experienceYears && (
                  <p className="text-sm text-red-500">{errors.experienceYears}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalGroup">Grupo Profesional</Label>
                <Select 
                  value={formData.professionalGroup} 
                  onValueChange={(value) => handleInputChange('professionalGroup', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPS.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Especialidades - Solo para Profesiones */}
            {getProfileType() === "profesiones" && (
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-base font-semibold">
                  Profesión
                </Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona tu profesión
                </p>
                <Select 
                  value={formData.specialty} 
                  onValueChange={(value) => handleInputChange('specialty', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu profesión" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSpecialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialty && (
                  <p className="text-sm text-red-500">{errors.specialty}</p>
                )}
              </div>
            )}

            {/* Mensaje para Oficios */}
            {getProfileType() === "oficios" && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Especialidades</Label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Para los profesionales de oficios, las especialidades se gestionan a través de los servicios que ofreces. 
                    Puedes agregar y editar tus servicios en la sección &quot;Mis Servicios&quot; más abajo.
                  </p>
                </div>
              </div>
            )}

            {/* Lugares donde ofrece servicios */}
            <Separator />
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceLocations" className="text-base font-semibold">
                  Lugares donde ofreces tus servicios
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Selecciona las localidades donde trabajas. Por defecto se incluye tu localidad principal.
                </p>
                
                <div className="space-y-3">
                  {/* Localidad principal (no editable, solo informativa) */}
                  {formData.location && (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          {formData.location}
                        </span>
                        <BadgeComponent className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 px-2 py-1 rounded-full">
                          Principal
                        </BadgeComponent>
                      </div>
                    </div>
                  )}

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
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Agregar más localidades..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getLocations()
                          .filter(location => {
                            // Convertir location principal a ID para comparar
                            const locations = getLocations();
                            const mainLocationObj = locations.find(l => l.name === formData.location);
                            const mainLocationId = mainLocationObj?.id || formData.location;
                            // Filtrar la ubicación principal y las ya agregadas
                            return location.id !== mainLocationId && 
                                   !formData.serviceLocations.includes(location.id);
                          })
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
                  {(() => {
                    // Filtrar la ubicación principal de las localidades adicionales
                    const locations = getLocations();
                    const mainLocationObj = locations.find(l => l.name === formData.location);
                    const mainLocationId = mainLocationObj?.id || formData.location;
                    const additionalLocations = formData.serviceLocations.filter(locId => locId !== mainLocationId);
                    
                    return additionalLocations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Localidades adicionales:</p>
                        <div className="flex flex-wrap gap-2">
                          {additionalLocations.map((locationId) => {
                            const location = locations.find(l => l.id === locationId);
                            return (
                              <div
                                key={locationId}
                                className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2"
                              >
                                <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                  {locationId === 'all-region' ? 'Toda la región' : (location?.name || locationId)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange('serviceLocations', formData.serviceLocations.filter(id => id !== locationId));
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 ml-1 font-bold"
                                  aria-label="Eliminar localidad"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                {errors.serviceLocations && (
                  <p className="text-sm text-red-500 mt-2">{errors.serviceLocations}</p>
                )}
              </div>
            </div>

            {/* Local Físico */}
            <Separator />
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">
                  Local Físico
                </Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Si tenés un local físico, podés agregar la dirección
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="hasPhysicalStore"
                      checked={formData.hasPhysicalStore}
                      onCheckedChange={(checked) => handleInputChange('hasPhysicalStore', checked)}
                    />
                    <Label htmlFor="hasPhysicalStore" className="text-sm font-medium cursor-pointer">
                      Tengo un local físico
                    </Label>
                  </div>

                  {formData.hasPhysicalStore && (
                    <div className="space-y-2">
                      <Label htmlFor="physicalStoreAddress">Dirección del local *</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="physicalStoreAddress"
                          value={formData.physicalStoreAddress}
                          onChange={(e) => handleInputChange('physicalStoreAddress', e.target.value)}
                          className="pl-10"
                          placeholder="Ej: Av. San Martín 123, Ceres"
                        />
                      </div>
                      {errors.physicalStoreAddress && (
                        <p className="text-sm text-red-500">{errors.physicalStoreAddress}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Redes Sociales y Perfil Profesional */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Redes Sociales y Perfil Profesional</h4>
              
              {/* Redes sociales básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className={errors.whatsapp ? "border-red-500" : ""}
                  />
                  {errors.whatsapp && (
                    <p className="text-sm text-red-500">{errors.whatsapp}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="@tu_usuario"
                    className={errors.instagram ? "border-red-500" : ""}
                  />
                  {errors.instagram && (
                    <p className="text-sm text-red-500">{errors.instagram}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    placeholder="facebook.com/tu_perfil"
                    className={errors.facebook ? "border-red-500" : ""}
                  />
                  {errors.facebook && (
                    <p className="text-sm text-red-500">{errors.facebook}</p>
                  )}
                </div>
              </div>

              {/* Redes profesionales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="/in/tuperfil"
                      className={`pl-10 ${errors.linkedin ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.linkedin && (
                    <p className="text-sm text-red-500">{errors.linkedin}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://tusitio.com"
                      className={`pl-10 ${errors.website ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.website && (
                    <p className="text-sm text-red-500">{errors.website}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio">Portfolio</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="portfolio"
                      value={formData.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value)}
                      placeholder="https://tuportfolio.com"
                      className={`pl-10 ${errors.portfolio ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.portfolio && (
                    <p className="text-sm text-red-500">{errors.portfolio}</p>
                  )}
                </div>
              </div>

              {/* Archivos - Sección completamente rediseñada */}
              <Separator className="my-6" />
              <div className="space-y-6">
                <h4 className="font-semibold text-lg">Archivos del Perfil</h4>
                
                {/* Foto de perfil - preview redimensionada y recorte */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <Label htmlFor="picture" className="text-base font-semibold mb-4 block">
                    Foto de Perfil
                  </Label>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Preview de la foto en tamaño más contenido */}
                    <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex-shrink-0 mx-auto md:mx-0">
                      {formData.picture ? (
                        <>
                          <Image
                            src={
                              formData.picture.startsWith('http')
                                ? formData.picture
                                : `/uploads/profiles/${formData.picture}`
                            }
                            alt="Foto de perfil"
                            fill
                            className="object-cover"
                            sizes="192px"
                          />
                          <button
                            onClick={() => {
                              handleInputChange('picture', '');
                              toast.info('Foto eliminada');
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            aria-label="Eliminar foto"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-sm text-gray-400">
                          <Upload className="h-12 w-12 mb-2 opacity-50" />
                          <span>Sin foto</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Controles de subida */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className="relative">
                        <Upload className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setImageToCrop(reader.result as string);
                                setShowCropper(true);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="pl-11 h-12 text-base cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Formatos:</strong> PNG, JPG, JPEG, WEBP
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Tamaño máximo:</strong> 10MB
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Podrás recortar y ajustar la imagen antes de subirla. La imagen se mostrará en formato circular en tu perfil.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CV con preview mejorado */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <Label htmlFor="cv" className="text-base font-semibold mb-4 block">
                    CV (Curriculum Vitae)
                  </Label>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Preview del CV */}
                    <div className="flex-shrink-0">
                      {formData.cv ? (
                        <a
                          href={
                            formData.cv.startsWith('http')
                              ? formData.cv
                              : `/uploads/profiles/${formData.cv}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center h-32 w-32 rounded-xl border-2 border-[#006F4B] bg-white hover:bg-[#006F4B] hover:text-white transition-all shadow-md group"
                        >
                          <FileText className="h-12 w-12 text-[#006F4B] group-hover:text-white mb-2" />
                          <span className="text-xs font-medium text-center px-2">Ver CV actual</span>
                        </a>
                      ) : (
                        <div className="h-32 w-32 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-400 text-center px-2">Sin CV</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Controles de subida */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="cv"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const formDataUpload = new FormData();
                                formDataUpload.append('file', file);
                                
                                const response = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formDataUpload,
                                });
                                
                                const result = await response.json();
                                if (result.success) {
                                  handleInputChange(
                                    'cv',
                                    result.url || result.path || result.filename
                                  );
                                  toast.success('CV subido correctamente');
                                } else {
                                  toast.error(result.error || 'Error al subir el CV');
                                }
                              } catch (error) {
                                console.error('Error uploading file:', error);
                                toast.error('Error al subir el CV');
                              }
                            }
                          }}
                          className="pl-11 h-12 text-base cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Formatos:</strong> PDF, DOC, DOCX, JPG, PNG
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Tamaño máximo:</strong> 15MB
                        </p>
                      </div>
                      {formData.cv && (
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              handleInputChange('cv', '');
                              toast.info('CV eliminado');
                            }}
                            className="text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Eliminar CV actual
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Servicios */}
          <Card className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Mis Servicios
                </CardTitle>
                <Button 
                  onClick={handleAddService}
                  size="sm"
                  className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B] flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Agregar Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.services.length > 0 ? (
                <div className="space-y-4">
                  {formData.services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{service.title}</h4>
                          <Badge variant="secondary" className="mt-1 rounded-xl">
                            {service.category.name}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service.id)}
                            className="rounded-xl"
                          >
                            Editar
                          </Button>
                          <ConfirmDialog
                            title="Eliminar servicio"
                            description={
                              <span>
                                ¿Estás seguro de que querés eliminar el servicio{" "}
                                <span className="font-semibold">
                                  {service.title}
                                </span>
                                ? Esta acción no se puede deshacer.
                              </span>
                            }
                            confirmLabel="Eliminar definitivamente"
                            cancelLabel="Cancelar"
                            confirmVariant="destructive"
                            onConfirm={async () => {
                              await handleDeleteService(service.id);
                            }}
                            trigger={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 rounded-xl"
                              >
                                Eliminar
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No tienes servicios registrados</p>
                  <p className="text-sm mt-1">
                    {getProfileType() === "oficios" 
                      ? "Agrega tus servicios de oficios para que los clientes puedan encontrarte"
                      : "Agrega tus servicios profesionales para mostrar tus especialidades"
                    }
                  </p>
                  <Button 
                    onClick={handleAddService}
                    className="mt-4 bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]"
                  >
                    Agregar mi primer servicio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* Modal para agregar/editar servicio */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingServiceId ? 'Editar Servicio' : 'Agregar Servicio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="service-category">Categoría *</Label>
              <Select 
                value={serviceForm.categorySlug} 
                onValueChange={(v) => {
                  const selectedCategory = SUBCATEGORIES_OFICIOS.find(cat => cat.slug === v);
                  setServiceForm(prev => ({ 
                    ...prev, 
                    categorySlug: v,
                    // Auto-completar título con el nombre de la categoría si no hay título personalizado
                    title: prev.title || selectedCategory?.name || ''
                  }));
                }}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS_OFICIOS.map(area => {
                    const subcategories = SUBCATEGORIES_OFICIOS.filter(sub => sub.areaSlug === area.slug);
                    if (subcategories.length === 0) return null;
                    return (
                      <div key={area.slug}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                          {area.name}
                        </div>
                        {subcategories.map(cat => (
                          <SelectItem key={cat.slug} value={cat.slug} className="pl-6">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service-title">Título personalizado (opcional)</Label>
              <Input 
                id="service-title"
                placeholder={serviceForm.categorySlug ? SUBCATEGORIES_OFICIOS.find(c => c.slug === serviceForm.categorySlug)?.name || 'Título del servicio' : 'Seleccioná una categoría primero'} 
                value={serviceForm.title} 
                onChange={e => setServiceForm(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-xl mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no especificás un título, se usará el nombre de la categoría
              </p>
            </div>
            <div>
              <Label htmlFor="service-description">Descripción *</Label>
              <Textarea
                id="service-description"
                placeholder="Describe tu servicio en detalle..."
                value={serviceForm.description}
                onChange={e => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                className="rounded-xl mt-1 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="service-priceRange">Rango de precio (opcional)</Label>
              <Input 
                id="service-priceRange"
                placeholder="Ej: $5000 - $10000" 
                value={serviceForm.priceRange} 
                onChange={e => setServiceForm(prev => ({ ...prev, priceRange: e.target.value }))}
                className="rounded-xl mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveService}
              className="bg-[#006F4B] text-white rounded-xl"
            >
              {editingServiceId ? 'Guardar cambios' : 'Agregar servicio'}
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de recorte de imagen */}
      <ImageCropper
        open={showCropper}
        onOpenChange={setShowCropper}
        imageSrc={imageToCrop}
        aspect={1}
        onCropComplete={async (croppedImageBlob) => {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', croppedImageBlob, 'profile.jpg');
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formDataUpload,
            });
            
            const result = await response.json();
            if (result.success) {
              handleInputChange(
                'picture',
                result.url || result.path || result.filename
              );
              toast.success('Imagen recortada y subida correctamente');
              setImageToCrop("");
            } else {
              toast.error(result.error || 'Error al subir la imagen');
            }
          } catch (error) {
            console.error('Error uploading cropped image:', error);
            toast.error('Error al subir la imagen');
          }
        }}
      />

      {/* Aviso flotante de cambios sin guardar (popup propio) */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-xl border border-amber-200 bg-amber-50 max-w-md">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Tenés cambios sin guardar
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Si salís de esta página sin guardar, vas a perder los cambios realizados en tu perfil.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={async () => {
                    await loadProfessionalData();
                    setHasChanges(false);
                    toast.info("Se descartaron los cambios no guardados.");
                  }}
                >
                  Descartar cambios
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl bg-[#006F4B] text-white hover:bg-[#005a3d]"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar ahora"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diálogo para confirmar salir de la página con cambios sin guardar */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Cambios sin guardar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-700">
              Tenés cambios sin guardar en tu perfil.
            </p>
            <p className="text-sm text-gray-600">
              Si salís de la página ahora, vas a perder los cambios que todavía no se guardaron.
            </p>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowLeaveDialog(false)}
            >
              Seguir editando
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setShowLeaveDialog(false);
                setHasChanges(false);
                router.push("/dashboard");
              }}
            >
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





