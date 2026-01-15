"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Building2,
  AlertCircle,
  Clock,
  Save,
  Loader2,
  Calendar,
  CheckCircle,
  Star,
  Briefcase,
  MapPin,
  Award,
  FileText,
  Upload,
  X,
  Lightbulb
} from "lucide-react";
import { Professional, Service } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBCATEGORIES_OFICIOS, AREAS_OFICIOS } from "@/lib/taxonomy";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


type DashboardService = Service & { category?: { name: string } };
type ProfessionalWithServices = Professional & { 
  services?: DashboardService[];
  status?: 'pending' | 'active' | 'suspended';
};

interface ScheduleData {
  morning: {
    enabled: boolean;
    start: string;
    end: string;
  };
  afternoon: {
    enabled: boolean;
    start: string;
    end: string;
  };
  fullDay: boolean;
  workOnHolidays: boolean;
}

const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes', short: 'L' },
  { id: 'tuesday', name: 'Martes', short: 'M' },
  { id: 'wednesday', name: 'Miércoles', short: 'X' },
  { id: 'thursday', name: 'Jueves', short: 'J' },
  { id: 'friday', name: 'Viernes', short: 'V' },
  { id: 'saturday', name: 'Sábado', short: 'S' },
  { id: 'sunday', name: 'Domingo', short: 'D' },
];

type Stats = {
  services: {
    active: number;
    total: number;
    inactive: number;
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  profile: {
    verified: boolean;
    status: string;
    experienceYears: number;
    locations: number;
    since: string;
  };
};

type ProfessionalTip = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onClick: (opts: { setActiveTab: (tab: string) => void; router: ReturnType<typeof useRouter> }) => void;
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState<ProfessionalWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState({ categorySlug: "", title: "", description: "", priceRange: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", description: "", priceRange: "" });
  
  // Estados para certificaciones
  type Certification = {
    id: string;
    categoryId: string | null;
    certificationType: string;
    certificationNumber: string;
    issuingOrganization: string;
    issueDate: string | null;
    expiryDate: string | null;
    documentUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    category?: { id: string; name: string; slug: string } | null;
  };
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [showCertificationDialog, setShowCertificationDialog] = useState(false);
  const [newCertification, setNewCertification] = useState({
    categoryId: "",
    certificationType: "",
    certificationNumber: "",
    issuingOrganization: "",
    issueDate: "",
    expiryDate: "",
    documentFile: null as File | null,
    documentUrl: ""
  });
  const [uploadingCert, setUploadingCert] = useState(false);
  
  // Estados para horarios
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleData>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleHasChanges, setScheduleHasChanges] = useState(false);

  // Tips profesionales
  const professionalTips: ProfessionalTip[] = [
    {
      id: 'social',
      title: 'Completá tus redes sociales',
      description: 'Los perfiles más completos generan más confianza y visitas desde las redes.',
      actionLabel: 'Editar perfil',
      onClick: ({ router }) => router.push('/dashboard/settings'),
    },
    {
      id: 'schedule',
      title: 'Configurá tus horarios',
      description: 'Indicá en qué días y horarios atendés para que los vecinos sepan cuándo contactarte.',
      actionLabel: 'Configurar horarios',
      onClick: ({ setActiveTab }) => setActiveTab('horarios'),
    },
    {
      id: 'locations',
      title: 'Agregá más zonas donde trabajás',
      description: 'Mientras más localidades cubras, en más búsquedas de la ciudad vas a aparecer.',
      actionLabel: 'Editar zonas',
      onClick: ({ router }) => router.push('/dashboard/settings#locations'),
    },
    {
      id: 'certifications',
      title: 'Certificá tus servicios',
      description: 'Subí tu matrícula o certificaciones para mostrar un sello de confianza en tu perfil.',
      actionLabel: 'Certificar mis servicios',
      onClick: ({ }) => {
        // Abrimos el modal de certificación
        // Nota: usamos el setter directamente más abajo cuando renderizamos el tip
      },
    },
    {
      id: 'services',
      title: 'Agregá más servicios',
      description: 'Ofrecer varias opciones aumenta las chances de que los vecinos encuentren lo que buscan.',
      actionLabel: 'Gestionar servicios',
      onClick: ({ setActiveTab }) => setActiveTab('services'),
    },
    {
      id: 'share',
      title: 'Compartí tu perfil en redes',
      description: 'Compartir tu perfil en WhatsApp y redes sociales te ayuda a conseguir más clientes.',
      actionLabel: 'Ver mi perfil público',
      onClick: ({ router }) => router.push('/profesionales'),
    },
  ];

  const [currentTip, setCurrentTip] = useState<ProfessionalTip | null>(null);

  // Función para inicializar horarios por defecto
  const initializeDefaultSchedule = () => {
    const defaultSchedule: Record<string, ScheduleData> = {};
    DAYS_OF_WEEK.forEach(day => {
      defaultSchedule[day.id] = {
        morning: { enabled: true, start: '08:00', end: '12:00' },
        afternoon: { enabled: true, start: '14:00', end: '18:00' },
        fullDay: false,
        workOnHolidays: false
      };
    });
    setScheduleData(defaultSchedule);
  };

  // Funciones para manejar horarios
  const handleDayScheduleChange = (dayId: string, field: keyof ScheduleData, value: unknown) => {
    setScheduleData(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
    setScheduleHasChanges(true);
  };

  const handleTimeChange = (dayId: string, period: 'morning' | 'afternoon', field: 'start' | 'end', value: string) => {
    setScheduleData(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [period]: {
          ...prev[dayId][period],
          [field]: value
        }
      }
    }));
    setScheduleHasChanges(true);
  };

  const copyToAllDays = (dayId: string) => {
    const daySchedule = scheduleData[dayId];
    const newSchedule = { ...scheduleData };
    
    DAYS_OF_WEEK.forEach(day => {
      if (day.id !== dayId) {
        newSchedule[day.id] = { ...daySchedule };
      }
    });
    
    setScheduleData(newSchedule);
    setScheduleHasChanges(true);
    toast.success('Horarios copiados a todos los días');
  };

  const saveSchedule = async () => {
    setScheduleSaving(true);
    try {
      const response = await fetch('/api/professional/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule: scheduleData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Horarios actualizados correctamente');
        setScheduleHasChanges(false);
      } else {
        toast.error(result.message || result.error || 'Error al actualizar los horarios');
      }
    } catch (error) {
      console.error('Error actualizando horarios:', error);
      toast.error('Error al actualizar los horarios');
    } finally {
      setScheduleSaving(false);
    }
  };

  useEffect(() => {
    const fetchMyProfessional = async () => {
      try {
        const response = await fetch('/api/professional/me');
        const result = await response.json();
        
        // Si la respuesta es 401 (no autorizado), el usuario no está logueado
        if (response.status === 401 || result.error === 'unauthorized') {
          setIsUnauthorized(true);
          // Redirigir al login después de un breve delay para mostrar el mensaje
          setTimeout(() => {
            router.push('/auth/login?callbackUrl=/dashboard');
          }, 2000);
          return;
        }
        
        if (result.success) {
          setMe(result.data);
          
          // Cargar horarios
          if (result.data.schedule && typeof result.data.schedule === 'object') {
            setScheduleData(result.data.schedule as Record<string, ScheduleData>);
          } else {
            initializeDefaultSchedule();
          }
        }
      } catch (error) {
        console.error('Error cargando profesional:', error);
        // Si hay un error de red, podría ser que no esté autenticado
        setIsUnauthorized(true);
        setTimeout(() => {
          router.push('/auth/login?callbackUrl=/dashboard');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/professional/stats');
        const result = await response.json();
        console.log('Stats response:', result);

        // Si no está autorizado, no mostramos toast ni marcamos error visual
        if (response.status === 401 || result.error === 'unauthorized') {
          setStats(null);
          return;
        }

        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('Error en respuesta de stats:', result);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchCertifications = async () => {
      try {
        const response = await fetch('/api/professional/certifications');
        const result = await response.json();
        if (result.success) {
          setCertifications(result.data || []);
        }
      } catch (error) {
        console.error('Error cargando certificaciones:', error);
      }
    };

    // Tip profesional aleatorio al montar
    const pickRandomTip = () => {
      if (professionalTips.length > 0) {
        const index = Math.floor(Math.random() * professionalTips.length);
        setCurrentTip(professionalTips[index]);
      }
    };

    fetchMyProfessional();
    fetchStats();
    fetchCertifications();
    pickRandomTip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006F4B]"></div>
      </div>
    );
  }

  // Si el usuario no está autenticado, mostrar mensaje y redirigir
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="rounded-2xl shadow-xl border-0 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Debes iniciar sesión
            </h2>
            <p className="text-gray-600 mb-6">
              Para acceder al dashboard necesitas estar autenticado. Redirigiendo al login...
            </p>
            <Button asChild className="bg-[#006F4B] hover:bg-[#005a3d] text-white rounded-xl">
              <Link href="/auth/login?callbackUrl=/dashboard">
                Ir al login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si el usuario está autenticado pero no tiene perfil profesional
  if (!me) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#006F4B] via-[#008255] to-[#004d35] py-16 px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-4">¡Convertite en Profesional!</h1>
            <p className="text-white/80 text-lg">
              Completá tu perfil para ofrecer tus servicios en la plataforma oficial de Ceres
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 -mt-8">
          <Card className="rounded-2xl shadow-xl border-0">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Tu cuenta está lista
                  </h2>
                  <p className="text-gray-600">
                    Solo falta completar tu información profesional para que los vecinos puedan encontrarte
                  </p>
                </div>
                
                {/* Beneficios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div className="text-center p-4 rounded-xl bg-green-50">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <Eye className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-900">Visibilidad</p>
                    <p className="text-xs text-green-700">Aparecé en búsquedas</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-blue-900">Contactos</p>
                    <p className="text-xs text-blue-700">Recibí consultas</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-purple-50">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-purple-900">Crecé</p>
                    <p className="text-xs text-purple-700">Expandí tu negocio</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1 h-12 bg-[#006F4B] hover:bg-[#005a3d] rounded-xl">
                    <Link href="/auth/completar-perfil">
                      <Plus className="w-4 h-4 mr-2" />
                      Completar mi perfil profesional
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 h-12 rounded-xl">
                    <Link href="/">
                      Seguir como ciudadano
                    </Link>
                  </Button>
                </div>
                
                <p className="text-center text-xs text-gray-500">
                  Como ciudadano podés buscar y contactar profesionales. Como profesional, además podés ofrecer tus servicios.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isVerified = me.user?.verified ?? me.verified;
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-rutan">
                  Panel Profesional
                </h1>
                <p className="text-gray-600 mt-1">
                  Bienvenido, {me.user?.firstName} {me.user?.lastName}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Botón/Badge de Certificaciones */}
                {(() => {
                  const hasApprovedCertifications = certifications.some(c => c.status === 'approved');
                  const hasPendingCertifications = certifications.some(c => c.status === 'pending');
                  if (hasApprovedCertifications) {
                    return (
                      <Badge className="rounded-xl bg-green-100 text-green-800 flex items-center">
                        <Award className="h-3 w-3 mr-1" />
                        Certificado
                      </Badge>
                    );
                  }
                  return (
                    <Dialog open={showCertificationDialog} onOpenChange={setShowCertificationDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={hasPendingCertifications || uploadingCert}
                          className="rounded-xl border-[#006F4B] text-[#006F4B] hover:bg-[#006F4B] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Award className="h-4 w-4 mr-2" />
                          {hasPendingCertifications ? 'Certificación en revisión' : 'Certificar mis servicios'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-[#006F4B]" />
                            Certificar mis servicios
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-gray-600">
                            Subí tu matrícula o certificación profesional para que aparezca en tu perfil y te ayude a generar más confianza con los clientes.
                          </p>

                          {/* Categoría principal (solo informativa) */}
                          <div>
                            <Label>Categoría principal de tus servicios</Label>
                            <p className="mt-1 text-sm text-gray-700">
                              {me.services && me.services.length > 0 && me.services[0].category?.name
                                ? me.services[0].category?.name
                                : 'Usaremos la categoría principal que configuraste en tus servicios.'}
                            </p>
                          </div>

                          {/* Tipo de certificación */}
                          <div>
                            <Label htmlFor="cert-type">Tipo de certificación *</Label>
                            <Select 
                              value={newCertification.certificationType} 
                              onValueChange={(v) => setNewCertification(prev => ({ ...prev, certificationType: v }))}
                            >
                              <SelectTrigger className="rounded-xl mt-1">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="matricula">Matrícula profesional</SelectItem>
                                <SelectItem value="certificado">Certificado</SelectItem>
                                <SelectItem value="licencia">Licencia</SelectItem>
                                <SelectItem value="curso">Certificado de curso</SelectItem>
                                <SelectItem value="otro">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Número de certificación */}
                          <div>
                            <Label htmlFor="cert-number">Número de matrícula/certificado *</Label>
                            <Input
                              id="cert-number"
                              placeholder="Ej: 12345"
                              value={newCertification.certificationNumber}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, certificationNumber: e.target.value }))}
                              className="rounded-xl mt-1"
                            />
                          </div>

                          {/* Organización emisora */}
                          <div>
                            <Label htmlFor="cert-org">Organización emisora *</Label>
                            <Input
                              id="cert-org"
                              placeholder="Ej: Colegio de Abogados de Santa Fe"
                              value={newCertification.issuingOrganization}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                              className="rounded-xl mt-1"
                            />
                          </div>

                          {/* Fechas */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="cert-issue-date">Fecha de emisión (opcional)</Label>
                              <Input
                                id="cert-issue-date"
                                type="date"
                                value={newCertification.issueDate}
                                onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                                className="rounded-xl mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cert-expiry-date">Fecha de vencimiento (opcional)</Label>
                              <Input
                                id="cert-expiry-date"
                                type="date"
                                value={newCertification.expiryDate}
                                onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                                className="rounded-xl mt-1"
                              />
                            </div>
                          </div>

                          {/* Subir documento (opcional) */}
                          <div>
                            <Label htmlFor="cert-document">Documento de certificación (opcional)</Label>
                            <div className="mt-2">
                              {newCertification.documentFile ? (
                                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-50">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm text-gray-700">{newCertification.documentFile.name}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setNewCertification(prev => ({ ...prev, documentFile: null, documentUrl: "" }))}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-500">
                                      <span className="font-semibold">Click para subir</span> o arrastra el archivo
                                    </p>
                                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (máx. 15MB)</p>
                                  </div>
                                  <input
                                    id="cert-document"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setNewCertification(prev => ({ ...prev, documentFile: file }));
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={async () => {
                              if (!newCertification.certificationType || !newCertification.certificationNumber || !newCertification.issuingOrganization) {
                                toast.error('Completá todos los campos requeridos (tipo, número y organización)');
                                return;
                              }

                              setUploadingCert(true);
                              try {
                                let documentUrl: string | null = null;

                                // Si se subió un archivo, primero subirlo
                                if (newCertification.documentFile) {
                                  const formData = new FormData();
                                  formData.append('file', newCertification.documentFile);
                                  formData.append('type', 'cv'); // Usar el mismo endpoint de upload

                                  const uploadRes = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  });

                                  const uploadResult = await uploadRes.json();
                                  if (!uploadResult.success) {
                                    toast.error(uploadResult.error || 'Error al subir el documento');
                                    return;
                                  }
                                  documentUrl = uploadResult.path;
                                }

                                // Crear la certificación (con o sin documento)
                                const certRes = await fetch('/api/professional/certifications', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    categoryId: newCertification.categoryId || null,
                                    certificationType: newCertification.certificationType,
                                    certificationNumber: newCertification.certificationNumber,
                                    issuingOrganization: newCertification.issuingOrganization,
                                    issueDate: newCertification.issueDate || null,
                                    expiryDate: newCertification.expiryDate || null,
                                    documentUrl
                                  })
                                });

                                const certResult = await certRes.json();
                                if (certResult.success) {
                                  toast.success('Certificación enviada para revisión. Será revisada por nuestro equipo.', {
                                    duration: 5000
                                  });
                                  setCertifications(prev => [certResult.data, ...prev]);
                                  setShowCertificationDialog(false);
                                  setNewCertification({
                                    categoryId: "",
                                    certificationType: "",
                                    certificationNumber: "",
                                    issuingOrganization: "",
                                    issueDate: "",
                                    expiryDate: "",
                                    documentFile: null,
                                    documentUrl: ""
                                  });
                                } else {
                                  toast.error(certResult.message || 'Error al crear la certificación');
                                }
                              } catch (error) {
                                console.error('Error:', error);
                                toast.error('Error al procesar la certificación');
                              } finally {
                                setUploadingCert(false);
                              }
                            }}
                            disabled={uploadingCert}
                            className="bg-[#006F4B] text-white rounded-xl"
                          >
                            {uploadingCert ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              'Enviar para revisión'
                            )}
                          </Button>
                          <DialogClose asChild>
                            <Button variant="outline" className="rounded-xl">Cancelar</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  );
                })()}
                <Button 
                  asChild
                  className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]"
                >
                  <Link href="/dashboard/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Ajustes
                  </Link>
                </Button>
              </div>
            </div>
          </div>

            {/* Banner de estado pendiente */}
            {me.status === 'pending' && (
            <Card className="rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">
                      Tu perfil está en revisión
                    </h3>
                    <p className="text-amber-800 text-sm leading-relaxed mb-3">
                      Tu perfil está siendo revisado por nuestro equipo de administración. Una vez aprobado, será visible públicamente para todos los usuarios de la plataforma.
                    </p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      Mientras tanto, puedes seguir editando tu perfil y servicios desde aquí. Te notificaremos por email cuando tu perfil sea aprobado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

            {/* Banner de estado de verificación (solo si no está pendiente) */}
            {!isVerified && me.status !== 'pending' && (
            <Card className="rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 ">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">
                      Tu perfil aún no ha sido verificado
                    </h3>
                    <p className="text-orange-800 text-sm leading-relaxed">
                      Nuestro equipo está revisando tu información. Mientras tanto, puedes editar tu perfil 
                      pero no aparecerás en los resultados de búsqueda hasta ser aprobado. 
                      Te notificaremos por email cuando tu perfil esté verificado.
                    </p>
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          )}



          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl">Estadísticas</TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl">Mis Servicios</TabsTrigger>
              <TabsTrigger value="horarios" className="rounded-xl">Horarios</TabsTrigger>
            </TabsList>

            {/* Tab Estadísticas */}
            <TabsContent value="overview" className="space-y-6">
              {statsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006F4B]"></div>
                </div>
              ) : stats ? (
                <>
              {/* Estadísticas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Servicios Activos */}
                    <Card className="rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Servicios Activos</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.services.active}</p>
                            <p className="text-xs text-gray-500 mt-1">de {stats.services.total} totales</p>
                      </div>
                          <div className="p-3 rounded-2xl bg-emerald-100">
                            <Briefcase className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                    {/* Rating */}
                    <Card className="rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Calificación</p>
                            <div className="flex items-center gap-2">
                              <p className="text-3xl font-bold text-gray-900">
                                {stats.rating.average > 0 ? stats.rating.average.toFixed(1) : 'N/A'}
                              </p>
                              {stats.rating.average > 0 && (
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              )}
                      </div>
                            <p className="text-xs text-gray-500 mt-1">{stats.rating.totalReviews} {stats.rating.totalReviews === 1 ? 'reseña' : 'reseñas'}</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-yellow-100">
                            <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                    {/* Experiencia */}
                    <Card className="rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Años de experiencia</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {stats.profile.experienceYears || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">según tu perfil</p>
                      </div>
                          <div className="p-3 rounded-2xl bg-blue-100">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                    {/* Cobertura geográfica */}
                    <Card className="rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Zonas donde trabajas</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {stats.profile.locations}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">localidades configuradas</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-emerald-100">
                            <MapPin className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
              </div>

                  {/* Información adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estado de tu perfil */}
                    <Card className="rounded-2xl border border-gray-100">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#006F4B]" />
                          Estado de tu perfil
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <span className="font-medium">Estado: </span>
                            {stats.profile.status === 'active' ? 'Activo' : stats.profile.status === 'pending' ? 'Pendiente de revisión' : 'Suspendido'}
                          </p>
                          <p>
                            <span className="font-medium">Verificación: </span>
                            {stats.profile.verified ? 'Perfil verificado' : 'Aún no verificado'}
                          </p>
                          <p>
                            <span className="font-medium">En la plataforma desde: </span>
                            {stats.profile.since ? new Date(stats.profile.since).toLocaleDateString('es-AR') : 'N/A'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tips profesionales */}
                    {currentTip && (
                      <Card className="rounded-2xl border border-emerald-100 bg-emerald-50/40">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-amber-500" />
                            Tips profesionales
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="font-medium text-gray-900">{currentTip.title}</p>
                            <p className="text-gray-600 text-sm">{currentTip.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 rounded-xl border-[#006F4B] text-[#006F4B] hover:bg-[#006F4B] hover:text-white"
                            onClick={() => {
                              if (currentTip.id === 'certifications') {
                                setShowCertificationDialog(true);
                              } else {
                                currentTip.onClick({ setActiveTab, router });
                              }
                            }}
                          >
                            {currentTip.actionLabel}
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              ) : (
                <Card className="rounded-2xl border border-gray-100">
                  <CardContent className="p-6 text-center text-gray-500">
                    No se pudieron cargar las estadísticas
                </CardContent>
              </Card>
              )}
            </TabsContent>

            {/* Tab Servicios */}
            <TabsContent value="services" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 font-rutan">Mis Servicios</h2>
                <Dialog open={creating} onOpenChange={setCreating}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Agregar Servicio</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Categoría organizada por áreas */}
                      <div>
                        <Label htmlFor="category">Categoría *</Label>
                        <Select value={newService.categorySlug} onValueChange={(v) => {
                          const selectedCategory = SUBCATEGORIES_OFICIOS.find(cat => cat.slug === v);
                          setNewService(s => ({ 
                            ...s, 
                            categorySlug: v,
                            // Auto-completar título con el nombre de la categoría si no hay título personalizado
                            title: s.title || selectedCategory?.name || ''
                          }));
                        }}>
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
                        <Label htmlFor="title">Título personalizado (opcional)</Label>
                        <Input 
                          id="title"
                          placeholder={newService.categorySlug ? SUBCATEGORIES_OFICIOS.find(c => c.slug === newService.categorySlug)?.name || 'Título del servicio' : 'Seleccioná una categoría primero'} 
                          value={newService.title} 
                          onChange={e => setNewService(s => ({ ...s, title: e.target.value }))}
                          className="rounded-xl mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Si no especificás un título, se usará el nombre de la categoría
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe tu servicio en detalle..."
                          value={newService.description}
                          onChange={e => setNewService(s => ({ ...s, description: e.target.value }))}
                          className="rounded-xl mt-1 min-h-[100px]"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priceRange">Rango de precio (opcional)</Label>
                        <Input 
                          id="priceRange"
                          placeholder="Ej: $5000 - $10000" 
                          value={newService.priceRange} 
                          onChange={e => setNewService(s => ({ ...s, priceRange: e.target.value }))}
                          className="rounded-xl mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!newService.categorySlug || !newService.description) {
                            toast.error('Completá la categoría y la descripción');
                            return;
                          }
                          // Si no hay título personalizado, usar el nombre de la categoría
                          const categoryName = SUBCATEGORIES_OFICIOS.find(c => c.slug === newService.categorySlug)?.name || '';
                          const serviceToSave = {
                            ...newService,
                            title: newService.title.trim() || categoryName
                          };
                          const res = await fetch('/api/services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(serviceToSave),
                          });
                          const json = await res.json();
                          if (json.success) {
                            toast.success('Servicio agregado correctamente');
                            setMe(prev => prev ? { ...prev, services: [ ...(prev.services || []), json.data as DashboardService ] } : prev);
                            setCreating(false);
                            setNewService({ categorySlug: '', title: '', description: '', priceRange: '' });
                          } else {
                            toast.error(json.message || 'Error al crear el servicio');
                          }
                        }}
                        className="bg-[#006F4B] text-white rounded-xl">
                        Guardar
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">Cancelar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Aviso si no hay servicios activos */}
              {me.services && me.services.filter((s) => s.available).length === 0 && (
                <Card className="rounded-2xl border-2 border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4 text-sm text-yellow-900">
                    No tenés servicios activos. Mientras no actives al menos uno, tu perfil no aparecerá en la página pública.
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {me.services?.map((service: DashboardService) => (
                  <Card key={service.id} className="rounded-2xl border border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-rutan">{service.title}</CardTitle>
                          <Badge variant="outline" className="rounded-xl text-xs mt-2">
                            {service.category?.name || 'Sin categoría'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={service.available}
                            onCheckedChange={async (checked) => {
                              const res = await fetch(`/api/services/${service.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ available: !!checked }),
                              });
                              const json = await res.json();
                              if (json.success) {
                                setMe(prev => prev ? { ...prev, services: prev.services?.map((s) => s.id === service.id ? { ...s, available: !!checked } : s) } : prev);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-600">{service.available ? 'Activo' : 'Inactivo'}</span>
                        </div>

                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{service.description || 'Sin descripción'}</p>
                     
                      
                      <div className="text-sm text-gray-500 mb-4">{service.priceRange}</div>

                      <div className="flex space-x-2">
                        
                        <Dialog open={editingId === service.id} onOpenChange={(open) => { setEditingId(open ? service.id : null); if (!open) setEditData({ title: '', description: '', priceRange: '' }); }}>
                          <DialogTrigger asChild>
                            <Button onClick={() => { setEditData({ title: service.title, description: service.description, priceRange: service.priceRange || '' }); }} variant="outline" size="sm" className="flex-1 rounded-xl">
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Editar Servicio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">Título personalizado (opcional)</Label>
                                <Input 
                                  id="edit-title"
                                  placeholder={service.category?.name || 'Título del servicio'} 
                                  value={editData.title} 
                                  onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))}
                                  className="rounded-xl mt-1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Si no especificás un título, se usará el nombre de la categoría
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Descripción *</Label>
                                <Textarea
                                  id="edit-description"
                                  placeholder="Describe tu servicio en detalle..."
                                  value={editData.description}
                                  onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))}
                                  className="rounded-xl mt-1 min-h-[100px]"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-priceRange">Rango de precio (opcional)</Label>
                                <Input 
                                  id="edit-priceRange"
                                  placeholder="Ej: $5000 - $10000" 
                                  value={editData.priceRange} 
                                  onChange={(e) => setEditData(d => ({ ...d, priceRange: e.target.value }))}
                                  className="rounded-xl mt-1"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={async () => {
                                  if (!editData.description) {
                                    toast.error('La descripción es requerida');
                                    return;
                                  }
                                  const payload: Record<string, string> = {};
                                  // Si hay título personalizado, usarlo; sino usar el nombre de la categoría
                                  const categoryName = service.category?.name || '';
                                  payload.title = editData.title.trim() || categoryName;
                                  payload.description = editData.description;
                                  if (editData.priceRange) payload.priceRange = editData.priceRange;
                                  const res = await fetch(`/api/services/${service.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify(payload),
                                  });
                                  const json = await res.json();
                                  if (json.success) {
                                    toast.success('Servicio actualizado correctamente');
                                    setMe(prev => prev ? { ...prev, services: prev.services?.map((s) => s.id === service.id ? { ...s, ...(payload as Partial<DashboardService>) } : s) } : prev);
                                    setEditingId(null);
                                    setEditData({ title: '', description: '', priceRange: '' });
                                  } else {
                                    toast.error(json.message || 'Error al actualizar el servicio');
                                  }
                                }}
                                className="bg-[#006F4B] text-white rounded-xl">
                                Guardar
                              </Button>
                              <DialogClose asChild>
                                <Button variant="outline" className="rounded-xl">Cancelar</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <ConfirmDialog
                          title="Eliminar servicio"
                          description={
                            <span>
                              ¿Estás seguro de que querés eliminar el servicio{" "}
                              <span className="font-semibold">
                                {service.title || service.category?.name}
                              </span>
                              ? Esta acción no se puede deshacer.
                            </span>
                          }
                          confirmLabel="Eliminar definitivamente"
                          cancelLabel="Cancelar"
                          confirmVariant="destructive"
                          onConfirm={async () => {
                            const res = await fetch(`/api/services/${service.id}`, { method: 'DELETE', credentials: 'include' });
                            const json = await res.json();
                            if (json.success) {
                              setMe(prev => prev ? { ...prev, services: prev.services?.filter((s) => s.id !== service.id) } : prev);
                              toast.success('Servicio eliminado correctamente');
                            } else {
                              toast.error(json.message || 'Error al eliminar el servicio');
                            }
                          }}
                          trigger={
                            <Button
                              type="button"
                              variant="outline" 
                              size="sm" 
                              className="rounded-xl text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

            </TabsContent>



            {/* Tab Horarios */}
            <TabsContent value="horarios" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-rutan flex items-center gap-3">
                    <Clock className="h-6 w-6 text-[#006F4B]" />
                    Horarios de Disponibilidad
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Configura tus horarios de trabajo para que los clientes sepan cuándo estás disponible
                  </p>
                </div>
                <Button 
                  onClick={saveSchedule} 
                  disabled={scheduleSaving || !scheduleHasChanges}
                  className="flex items-center gap-2"
                >
                  {scheduleSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {scheduleSaving ? 'Guardando...' : 'Guardar Horarios'}
                </Button>
              </div>

              {/* Configuración General */}
              <Card className="rounded-2xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Configuración General
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Trabajo en días feriados</Label>
                      <p className="text-sm text-gray-600">
                        Indica si trabajas durante los días feriados
                      </p>
                    </div>
                    <Switch
                      checked={scheduleData.monday?.workOnHolidays || false}
                      onCheckedChange={(checked) => {
                        const newSchedule = { ...scheduleData };
                        DAYS_OF_WEEK.forEach(day => {
                          newSchedule[day.id] = {
                            ...newSchedule[day.id],
                            workOnHolidays: checked
                          };
                        });
                        setScheduleData(newSchedule);
                        setScheduleHasChanges(true);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Horarios por Día */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {DAYS_OF_WEEK.map((day) => {
                  const daySchedule = scheduleData[day.id];
                  if (!daySchedule) return null;

                  return (
                    <Card key={day.id} className="rounded-2xl border border-gray-100">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              {day.short}
                            </Badge>
                            {day.name}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToAllDays(day.id)}
                            className="text-xs"
                          >
                            Copiar a todos
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 24 Horas */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Todo el día (24hs)</Label>
                            <p className="text-xs text-gray-600">
                              Disponible las 24 horas
                            </p>
                          </div>
                          <Switch
                            checked={daySchedule.fullDay}
                            onCheckedChange={(checked) => {
                              handleDayScheduleChange(day.id, 'fullDay', checked);
                              if (checked) {
                                // Desactivar mañana y tarde si se activa 24hs
                                handleDayScheduleChange(day.id, 'morning', { ...daySchedule.morning, enabled: false });
                                handleDayScheduleChange(day.id, 'afternoon', { ...daySchedule.afternoon, enabled: false });
                              }
                            }}
                          />
                        </div>

                        {!daySchedule.fullDay && (
                          <>
                            <Separator />
                            
                            {/* Horario Mañana */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Turno Mañana</Label>
                                <Switch
                                  checked={daySchedule.morning.enabled}
                                  onCheckedChange={(checked) => handleDayScheduleChange(day.id, 'morning', { ...daySchedule.morning, enabled: checked })}
                                />
                              </div>
                              {daySchedule.morning.enabled && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-600">Inicio</Label>
                                    <input
                                      type="time"
                                      value={daySchedule.morning.start}
                                      onChange={(e) => handleTimeChange(day.id, 'morning', 'start', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600">Fin</Label>
                                    <input
                                      type="time"
                                      value={daySchedule.morning.end}
                                      onChange={(e) => handleTimeChange(day.id, 'morning', 'end', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <Separator />
                            
                            {/* Horario Tarde */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Turno Tarde</Label>
                                <Switch
                                  checked={daySchedule.afternoon.enabled}
                                  onCheckedChange={(checked) => handleDayScheduleChange(day.id, 'afternoon', { ...daySchedule.afternoon, enabled: checked })}
                                />
                              </div>
                              {daySchedule.afternoon.enabled && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-gray-600">Inicio</Label>
                                    <input
                                      type="time"
                                      value={daySchedule.afternoon.start}
                                      onChange={(e) => handleTimeChange(day.id, 'afternoon', 'start', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-600">Fin</Label>
                                    <input
                                      type="time"
                                      value={daySchedule.afternoon.end}
                                      onChange={(e) => handleTimeChange(day.id, 'afternoon', 'end', e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Estado del día */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">
                              {daySchedule.fullDay 
                                ? 'Disponible 24 horas'
                                : daySchedule.morning.enabled || daySchedule.afternoon.enabled
                                  ? 'Disponible en horarios configurados'
                                  : 'No disponible'
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Resumen */}
              <Card className="rounded-2xl border border-gray-100">
                <CardHeader>
                  <CardTitle>Resumen de Horarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {DAYS_OF_WEEK.map((day) => {
                      const daySchedule = scheduleData[day.id];
                      return (
                        <div key={day.id} className="text-center p-3 border rounded-lg">
                          <div className="font-medium text-sm">{day.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {daySchedule?.fullDay 
                              ? '24hs'
                              : daySchedule?.morning.enabled || daySchedule?.afternoon.enabled
                                ? 'Horarios'
                                : 'Cerrado'
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
