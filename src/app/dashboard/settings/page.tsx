"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getLocations, GROUPS, SUBCATEGORIES_PROFESIONES } from "@/lib/taxonomy";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Award, Save, Loader2, Linkedin, Globe, Upload, FileText } from "lucide-react";
import { toast } from "sonner";


export default function SettingsPage() {
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

  const loadProfessionalData = async () => {
    try {
      const response = await fetch('/api/professional/me');
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          birthDate: data.user.birthDate ? new Date(data.user.birthDate).toISOString().split('T')[0] : "",
          location: data.user.location || "",
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
          serviceLocations: data.serviceLocations || [],
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
        if (value && typeof value === 'string' && !/^[a-zA-Z0-9._-]+$/.test(value)) {
          return 'Perfil de LinkedIn inválido';
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

  // Funciones para gestión de servicios
  const handleAddService = () => {
    // TODO: Implementar modal para agregar servicio
    toast.info('Función de agregar servicio próximamente');
  };

  const handleEditService = () => {
    // TODO: Implementar modal para editar servicio
    toast.info('Función de editar servicio próximamente');
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Configuración del Perfil</h1>
              {formData.professionalGroup && (
                <Badge 
                  variant={getProfileType() === "oficios" ? "default" : "secondary"}
                  className="text-sm"
                >
                  {getProfileType() === "oficios" ? "Oficios" : "Profesiones"}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {formData.professionalGroup 
                ? `Gestiona tu información como ${getProfileType() === "oficios" ? "profesional de oficios" : "profesional"}`
                : "Gestiona tu información personal y profesional"
              }
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Sin cambios'}
          </Button>
        </div>

        {/* Información Personal */}
        <Card>
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
        <Card>
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

              {/* Archivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="picture">Foto de Perfil</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                            } else {
                              toast.error('Error al subir la imagen');
                            }
                          } catch (error) {
                            console.error('Error uploading file:', error);
                            toast.error('Error al subir la imagen');
                          }
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG o GIF (máx. 5MB)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv">CV (Curriculum Vitae)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                            } else {
                              toast.error('Error al subir el CV');
                            }
                          } catch (error) {
                            console.error('Error uploading file:', error);
                            toast.error('Error al subir el CV');
                          }
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Solo archivos PDF (máx. 10MB)</p>
                </div>
              </div>

              {/* Mostrar archivos actuales si existen */}
              {(formData.picture || formData.cv) && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Archivos actuales:</p>
                  <div className="space-y-1">
                    {formData.picture && (
                      <p className="text-sm text-muted-foreground">
                        📷 Foto: {formData.picture}
                      </p>
                    )}
                    {formData.cv && (
                      <p className="text-sm text-muted-foreground">
                        📄 CV: {formData.cv}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Servicios */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Mis Servicios
              </CardTitle>
              <Button 
                onClick={handleAddService}
                size="sm"
                className="flex items-center gap-2"
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
                  <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{service.title}</h4>
                        <Badge variant="secondary" className="mt-1">
                          {service.category.name}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditService()}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
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
                  className="mt-4"
                >
                  Agregar mi primer servicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





