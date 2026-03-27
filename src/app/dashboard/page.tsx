"use client";

import { useState, useEffect, useMemo } from "react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, getErrorMessage } from "@/lib/api/client";
import {
  createDashboardCertification,
  type DashboardProfile,
  type DashboardStats,
  getDashboardProfile,
  getDashboardStats,
  listDashboardCertifications,
  type ProfessionalCertification,
  updateDashboardSchedule,
} from "@/lib/api/dashboard";
import { createService, deleteService, updateService } from "@/lib/api/services";
import { uploadFile } from "@/lib/api/uploads";
import { usePublicCategoriesTree } from "@/hooks/usePublicCategoriesTree";

type DashboardService = DashboardProfile["services"][number];

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

type ProfessionalTip = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onClick: (opts: { setActiveTab: (tab: string) => void; router: ReturnType<typeof useRouter> }) => void;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: categoryTree, loading: categoriesLoading, error: categoriesError } = usePublicCategoriesTree();
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState({ categorySlug: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ description: "" });
  const [editCategorySlug, setEditCategorySlug] = useState<string>("");
  
  // Estados para certificaciones
  const [certifications, setCertifications] = useState<ProfessionalCertification[]>([]);
  const [showCertificationDialog, setShowCertificationDialog] = useState(false);
  const [selectedServiceForCertification, setSelectedServiceForCertification] = useState<DashboardService | null>(null);
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

  // Estado para confirmar desactivación de servicios
  const [serviceToDisable, setServiceToDisable] = useState<DashboardService | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

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
      actionLabel: 'Ir a mis servicios',
      onClick: ({ setActiveTab }) => setActiveTab('services'),
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
  const oficioAreas = useMemo(
    () => categoryTree.areas.filter((area) => area.active),
    [categoryTree.areas]
  );
  const oficioCategoriesByArea = useMemo(() => {
    const byArea = new Map<string, Array<{ id: string; slug: string; name: string }>>();

    for (const subcategory of categoryTree.subcategoriesOficios) {
      if (!subcategory.active || !subcategory.areaSlug) {
        continue;
      }

      const current = byArea.get(subcategory.areaSlug) ?? [];
      current.push({ id: subcategory.id, slug: subcategory.slug, name: subcategory.name });
      byArea.set(subcategory.areaSlug, current);
    }

    return byArea;
  }, [categoryTree.subcategoriesOficios]);
  const professionCategories = useMemo(
    () =>
      categoryTree.subcategoriesProfesiones
        .filter((subcategory) => subcategory.active)
        .map((subcategory) => ({ id: subcategory.id, slug: subcategory.slug, name: subcategory.name })),
    [categoryTree.subcategoriesProfesiones]
  );
  const dashboardGroup = me?.professionalGroup ?? 'oficios';
  const serviceCategoryOptions = useMemo(() => {
    if (dashboardGroup === 'profesiones') {
      return professionCategories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        areaSlug: null as string | null,
      }));
    }

    return oficioAreas.flatMap((area) => {
      const subcategories = oficioCategoriesByArea.get(area.slug) ?? [];

      if (subcategories.length === 0) {
        return [
          {
            id: area.id,
            slug: area.slug,
            name: area.name,
            areaSlug: area.slug,
          },
        ];
      }

      return subcategories.map((subcategory) => ({
        id: subcategory.id,
        slug: subcategory.slug,
        name: subcategory.name,
        areaSlug: area.slug,
      }));
    });
  }, [dashboardGroup, oficioAreas, oficioCategoriesByArea, professionCategories]);
  const categoryNameBySlug = useMemo(() => {
    const bySlug = new Map<string, string>();

    for (const category of serviceCategoryOptions) {
      bySlug.set(category.slug, category.name);
    }

    return bySlug;
  }, [serviceCategoryOptions]);
  const categorySlugById = useMemo(() => {
    const byId = new Map<string, string>();

    for (const category of serviceCategoryOptions) {
      byId.set(category.id, category.slug);
    }

    return byId;
  }, [serviceCategoryOptions]);
  const usedCategoryIds = useMemo(
    () => new Set((me?.services ?? []).map((service) => service.categoryId)),
    [me?.services]
  );
  const createSelectableCategoryIds = useMemo(() => {
    const available = new Set<string>();

    for (const category of serviceCategoryOptions) {
      if (!usedCategoryIds.has(category.id)) {
        available.add(category.id);
      }
    }

    return available;
  }, [serviceCategoryOptions, usedCategoryIds]);

  const getEditableCategoryIds = (serviceId: string) => {
    const usedByOtherServices = new Set(
      (me?.services ?? [])
        .filter((service) => service.id !== serviceId)
        .map((service) => service.categoryId)
    );

    const available = new Set<string>();

    for (const category of serviceCategoryOptions) {
      if (!usedByOtherServices.has(category.id)) {
        available.add(category.id);
      }
    }

    return available;
  };

  const renderServiceCategoryOptions = (availableIds: Set<string>) => {
    if (dashboardGroup === 'profesiones') {
      return professionCategories
        .filter((category) => availableIds.has(category.id))
        .map((category) => (
          <SelectItem key={category.slug} value={category.slug}>
            {category.name}
          </SelectItem>
        ));
    }

    return oficioAreas.map((area) => {
      const subcategories = oficioCategoriesByArea.get(area.slug) ?? [];

      if (subcategories.length === 0) {
        if (!availableIds.has(area.id)) {
          return null;
        }

        return (
          <SelectItem key={area.slug} value={area.slug}>
            {area.name}
          </SelectItem>
        );
      }

      const availableSubcategories = subcategories.filter((subcategory) =>
        availableIds.has(subcategory.id)
      );

      if (availableSubcategories.length === 0) {
        return null;
      }

      return (
        <div key={area.slug}>
          <div className="px-2 py-1.5 text-xs font-semibold uppercase text-gray-500">
            {area.name}
          </div>
          {availableSubcategories.map((category) => (
            <SelectItem key={category.slug} value={category.slug} className="pl-6">
              {category.name}
            </SelectItem>
          ))}
        </div>
      );
    });
  };

  const resetCertificationForm = () => {
    setNewCertification({
      categoryId: "",
      certificationType: "",
      certificationNumber: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
      documentFile: null,
      documentUrl: "",
    });
  };

  const openCertificationDialog = (service: DashboardService) => {
    setSelectedServiceForCertification(service);
    setNewCertification({
      categoryId: service.categoryId,
      certificationType: "",
      certificationNumber: "",
      issuingOrganization: "",
      issueDate: "",
      expiryDate: "",
      documentFile: null,
      documentUrl: "",
    });
    setShowCertificationDialog(true);
  };

  const handleCertificationDialogChange = (open: boolean) => {
    setShowCertificationDialog(open);
    if (!open && !uploadingCert) {
      setSelectedServiceForCertification(null);
      resetCertificationForm();
    }
  };

  const getCertificationForService = (service: DashboardService) =>
    certifications.find(
      (certification) =>
        certification.categoryId === service.categoryId && certification.status === "approved"
    ) ??
    certifications.find(
      (certification) =>
        certification.categoryId === service.categoryId && certification.status === "pending"
    ) ??
    certifications.find(
      (certification) => certification.categoryId === service.categoryId
    ) ??
    null;

  const getCertificationUi = (service: DashboardService) => {
    const certification = getCertificationForService(service);

    if (!certification) {
      return {
        badgeVariant: "outline" as const,
        badgeClassName: "border-dashed border-[#006F4B]/15 bg-white text-gray-600",
        badgeLabel: "Sin certificar",
        helperText: "Todavia no subiste una matricula o certificado para este servicio.",
        buttonLabel: "Certificar servicio",
        buttonDisabled: false,
        buttonClassName:
          "h-11 rounded-full bg-gradient-to-r from-[#006F4B] to-[#008F5B] px-5 text-white shadow-sm transition-all hover:from-[#008F5B] hover:to-[#006F4B]",
      };
    }

    if (certification.status === "approved") {
      return {
        badgeVariant: "secondary" as const,
        badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
        badgeLabel: "Certificado",
        helperText: "Este servicio ya cuenta con una certificacion aprobada.",
        buttonLabel: "Ya certificado",
        buttonDisabled: true,
        buttonClassName:
          "h-11 rounded-full border border-emerald-200 bg-white px-5 text-emerald-700 opacity-100",
      };
    }

    if (certification.status === "pending") {
      return {
        badgeVariant: "secondary" as const,
        badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
        badgeLabel: "En revision",
        helperText: "Tu documentacion fue enviada y esta siendo revisada.",
        buttonLabel: "En revision",
        buttonDisabled: true,
        buttonClassName:
          "h-11 rounded-full border border-amber-200 bg-white px-5 text-amber-700 opacity-100",
      };
    }

    return {
      badgeVariant: "outline" as const,
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
      badgeLabel: "Observado",
      helperText: "La ultima certificacion fue observada. Podes volver a enviarla.",
      buttonLabel: "Reenviar certificacion",
      buttonDisabled: false,
      buttonClassName:
        "h-11 rounded-full border border-[#006F4B]/15 bg-white px-5 text-[#006F4B] shadow-sm transition-colors hover:bg-[#006F4B]/5",
    };
  };

  const primaryDashboardActionClass =
    "h-11 rounded-full bg-gradient-to-r from-[#006F4B] to-[#008F5B] px-5 text-white shadow-sm transition-all hover:from-[#008F5B] hover:to-[#006F4B]";
  const secondaryDashboardActionClass =
    "h-11 rounded-full border border-[#006F4B]/15 bg-white px-5 text-[#006F4B] shadow-sm transition-colors hover:bg-[#006F4B]/5";

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
      await updateDashboardSchedule(scheduleData);
      toast.success('Horarios actualizados correctamente');
      setScheduleHasChanges(false);
    } catch (error) {
      console.error('Error actualizando horarios:', error);
      toast.error(getErrorMessage(error, 'Error al actualizar los horarios'));
    } finally {
      setScheduleSaving(false);
    }
  };

  useEffect(() => {
    const fetchMyProfessional = async () => {
      try {
        const profile = await getDashboardProfile();
        const response = { status: 200 } as Response;
        const result = {
          success: true,
          data: profile,
          error: undefined as string | undefined,
        };
        setMe(profile);
        
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
        if (error instanceof ApiClientError && error.status === 404) {
          setMe(null);
          initializeDefaultSchedule();
          return;
        }

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
        const response = { status: 200 } as Response;
        const result = {
          success: true,
          data: await getDashboardStats(),
          error: undefined as string | undefined,
        };

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
        const result = {
          success: true,
          data: await listDashboardCertifications(),
        };
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

  const isVerified = me.verified;
  const needsCriminalRecordAlert =
    me.documentationRequired === true && me.criminalRecordPresent !== true;
 
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="rounded-[28px] border border-emerald-100 bg-white/95 p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#006F4B]">
                    Espacio profesional
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-gray-900 font-rutan sm:text-3xl">
                    Panel Profesional
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
                    Bienvenido, {me.user?.firstName} {me.user?.lastName}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button
                    asChild
                    className={`w-full sm:w-auto ${primaryDashboardActionClass}`}
                  >
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Ajustes
                    </Link>
                  </Button>
                </div>
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



          {needsCriminalRecordAlert && (
            <Card className="mb-6 rounded-2xl border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Te falta cargar el certificado de antecedentes penales
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Tu perfil no podrá aparecer en la plataforma hasta que subas este documento.
                      Puedes hacerlo ahora desde la configuración de tu perfil.
                    </p>
                  </div>
                </div>
                <Button asChild className="rounded-xl bg-amber-600 text-white hover:bg-amber-700">
                  <Link href="/dashboard/settings">
                    <FileText className="mr-2 h-4 w-4" />
                    Cargar antecedentes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Dialog open={showCertificationDialog} onOpenChange={handleCertificationDialogChange}>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl overflow-hidden rounded-[28px] border border-gray-100 p-0 shadow-2xl">
              <DialogHeader className="border-b border-gray-100 bg-white px-5 py-5 sm:px-6">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-[#006F4B]" />
                  Certificar servicio
                </DialogTitle>
                <p className="pr-8 text-sm text-gray-600">
                  Subi tu matricula o certificacion profesional para reforzar la confianza en este servicio.
                </p>
              </DialogHeader>
              <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <p className="hidden text-sm text-gray-600">
                  Subí tu matrícula o certificación profesional para reforzar la confianza en este servicio.
                </p>

                <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Servicio seleccionado
                  </p>
                  <p className="mt-3 text-base font-semibold text-gray-900">
                    {selectedServiceForCertification?.title || "Sin servicio seleccionado"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedServiceForCertification?.category?.name || "Sin categoría asociada"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="cert-type">Tipo de certificación *</Label>
                  <Select
                    value={newCertification.certificationType}
                    onValueChange={(v) => setNewCertification(prev => ({ ...prev, certificationType: v }))}
                  >
                    <SelectTrigger className="mt-1 h-11 rounded-2xl border-gray-200">
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

                <div>
                  <Label htmlFor="cert-number">Número de matrícula/certificado *</Label>
                  <Input
                    id="cert-number"
                    placeholder="Ej: 12345"
                    value={newCertification.certificationNumber}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, certificationNumber: e.target.value }))}
                    className="mt-1 h-11 rounded-2xl border-gray-200"
                  />
                </div>

                <div>
                  <Label htmlFor="cert-org">Organización emisora *</Label>
                  <Input
                    id="cert-org"
                    placeholder="Ej: Colegio de Abogados de Santa Fe"
                    value={newCertification.issuingOrganization}
                    onChange={(e) => setNewCertification(prev => ({ ...prev, issuingOrganization: e.target.value }))}
                    className="mt-1 h-11 rounded-2xl border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="cert-issue-date">Fecha de emisión (opcional)</Label>
                    <Input
                      id="cert-issue-date"
                      type="date"
                      value={newCertification.issueDate}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="mt-1 h-11 rounded-2xl border-gray-200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cert-expiry-date">Fecha de vencimiento (opcional)</Label>
                    <Input
                      id="cert-expiry-date"
                      type="date"
                      value={newCertification.expiryDate}
                      onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="mt-1 h-11 rounded-2xl border-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cert-document">Documento de certificación (opcional)</Label>
                  <div className="mt-2">
                    {newCertification.documentFile ? (
                      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span className="line-clamp-2 text-sm text-gray-700">{newCertification.documentFile.name}</span>
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
                      <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#006F4B]/20 bg-[#F6FBF8] px-4 text-center transition-colors hover:bg-[#EEF8F2]">
                        <div className="flex flex-col items-center justify-center">
                          <Upload className="mb-2 h-8 w-8 text-[#006F4B]" />
                          <p className="mb-2 text-sm text-gray-600">
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
                    if (!selectedServiceForCertification) {
                      toast.error('Seleccioná un servicio antes de cargar la certificación');
                      return;
                    }

                    if (!newCertification.certificationType || !newCertification.certificationNumber || !newCertification.issuingOrganization) {
                      toast.error('Completá todos los campos requeridos (tipo, número y organización)');
                      return;
                    }

                    setUploadingCert(true);
                    try {
                      let documentUrl: string | null = null;

                      if (newCertification.documentFile) {
                        const uploadResult = await uploadFile(newCertification.documentFile, 'cv');
                        documentUrl = uploadResult.url || uploadResult.path || uploadResult.filename;
                      }

                      const certResult = (
                        await createDashboardCertification({
                          categoryId: selectedServiceForCertification.categoryId,
                          certificationType: newCertification.certificationType,
                          certificationNumber: newCertification.certificationNumber,
                          issuingOrganization: newCertification.issuingOrganization,
                          issueDate: newCertification.issueDate || null,
                          expiryDate: newCertification.expiryDate || null,
                          documentUrl,
                        })
                      ).certification;

                      toast.success('Certificación enviada para revisión. Será revisada por nuestro equipo.', {
                        duration: 5000,
                      });
                      setCertifications(prev => [certResult, ...prev]);
                      setShowCertificationDialog(false);
                      setSelectedServiceForCertification(null);
                      resetCertificationForm();
                    } catch (error) {
                      console.error('Error:', error);
                      toast.error(getErrorMessage(error, 'Error al procesar la certificación'));
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

                    {/* Visitas al perfil */}
                    <Card className="rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Visitas a tu perfil</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {stats.profile.views}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">clicks en tus servicios</p>
                          </div>
                          <div className="p-3 rounded-2xl bg-purple-100">
                            <Eye className="h-6 w-6 text-purple-600" />
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
                            onClick={() => currentTip.onClick({ setActiveTab, router })}
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-gray-900 font-rutan">Mis Servicios</h2>
                <Dialog open={creating} onOpenChange={setCreating}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full rounded-xl bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white hover:from-[#008F5B] hover:to-[#006F4B] sm:w-auto"
                      disabled={categoriesLoading || createSelectableCategoryIds.size === 0}
                    >
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
                      {categoriesError && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          No se pudieron cargar las categorias actualizadas. Intenta nuevamente en unos segundos.
                        </p>
                      )}
                      <div>
                        <Label htmlFor="category">Categoria *</Label>
                        <Select
                          value={newService.categorySlug}
                          onValueChange={(v) => setNewService((s) => ({ ...s, categorySlug: v }))}
                          disabled={categoriesLoading}
                        >
                          <SelectTrigger className="rounded-xl mt-1">
                            <SelectValue placeholder={categoriesLoading ? "Cargando categorias..." : "Seleccionar categoria"} />
                          </SelectTrigger>
                          <SelectContent>
                            {renderServiceCategoryOptions(createSelectableCategoryIds)}
                          </SelectContent>
                        </Select>
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
</div>
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!newService.categorySlug || !newService.description) {
                            toast.error('Completá la categoría y la descripción');
                            return;
                          }
                          // Si no hay título personalizado, usar el nombre de la categoría
                          const categoryName = categoryNameBySlug.get(newService.categorySlug) || '';
                          const selectedCategory = serviceCategoryOptions.find(
                            (category) => category.slug === newService.categorySlug
                          );

                          if (!selectedCategory) {
                            toast.error('Selecciona una categoria valida');
                            return;
                          }

                          if (usedCategoryIds.has(selectedCategory.id)) {
                            toast.error('Ese servicio ya esta cargado en tu perfil');
                            return;
                          }

                          const serviceToSave = {
                            categorySlug: newService.categorySlug,
                            description: newService.description,
                            title: categoryName
                          };
                          try {
                            const createdService = await createService(serviceToSave);
                            toast.success('Servicio agregado correctamente');
                            setMe(prev => prev ? { ...prev, services: [ ...(prev.services || []), createdService as DashboardService ] } : prev);
                            setCreating(false);
                            setNewService({ categorySlug: '', description: '' });
                          } catch (error) {
                            toast.error(getErrorMessage(error, 'Error al crear el servicio'));
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {me.services?.map((service: DashboardService) => {
                  const certificationUi = getCertificationUi(service);

                  return (
                  <Card key={service.id} className="rounded-2xl border border-gray-100">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg font-rutan">{service.title}</CardTitle>
                          <Badge variant="outline" className="rounded-xl text-xs mt-2">
                            {service.category?.name || 'Sin categoría'}
                          </Badge>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                          <Switch
                            checked={service.available}
                            onCheckedChange={async (checked) => {
                              // Si se intenta desactivar, abrir diálogo de confirmación
                              if (!checked) {
                                setServiceToDisable(service);
                                setDisableDialogOpen(true);
                                return;
                              }

                              // Activar directamente sin confirmación adicional
                              try {
                                await updateService(service.id, { available: true });
                                setMe(prev =>
                                  prev
                                    ? {
                                        ...prev,
                                        services: prev.services?.map((s) =>
                                          s.id === service.id ? { ...s, available: true } : s
                                        ),
                                      }
                                    : prev
                                );
                              } catch (error) {
                                console.error('Error actualizando servicio:', error);
                                toast.error(getErrorMessage(error, 'Error al actualizar el servicio'));
                              }
                            }}
                          />
                          <span className="text-xs text-gray-600">
                            {service.available ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {service.available ? 'Visible en tu perfil' : 'Oculto en tu perfil'}
                          </span>
                        </div>

                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{service.description || 'Sin descripción'}</p>
                     
                      

                      <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                              Certificacion
                            </p>
                            <div className="mt-2">
                              <Badge
                                variant={certificationUi.badgeVariant}
                                className={`rounded-xl ${certificationUi.badgeClassName}`}
                              >
                                {certificationUi.badgeLabel}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {certificationUi.helperText}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant={certificationUi.buttonDisabled ? "outline" : "default"}
                            className={`w-full rounded-xl sm:w-auto ${
                              certificationUi.buttonDisabled
                                ? "cursor-not-allowed"
                                : "bg-[#006F4B] text-white hover:bg-[#00563A]"
                            }`}
                            disabled={certificationUi.buttonDisabled}
                            onClick={() => openCertificationDialog(service)}
                          >
                            <Award className="mr-2 h-4 w-4" />
                            {certificationUi.buttonLabel}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Dialog
                          open={editingId === service.id}
                          onOpenChange={(open) => {
                            setEditingId(open ? service.id : null);
                            if (!open) {
                              setEditData({ description: '' });
                              setEditCategorySlug("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setEditData({
                                  description: service.description,
                                });
                                const matchedCategorySlug = categorySlugById.get(service.categoryId) || '';
                                setEditCategorySlug(matchedCategorySlug);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl sm:flex-none"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Editar Servicio</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              {categoriesError && (
                                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                  No se pudieron cargar las categorias actualizadas. Intenta nuevamente en unos segundos.
                                </p>
                              )}
                              <div>
                        <Label htmlFor={`edit-category-${service.id}`}>Categoria *</Label>
                        <Select
                                  value={editCategorySlug}
                                  onValueChange={(v) => setEditCategorySlug(v)}
                                  disabled={categoriesLoading}
                                >
                                  <SelectTrigger
                                    id={`edit-category-${service.id}`}
                                    className="rounded-xl mt-1"
                                  >
                                    <SelectValue placeholder={categoriesLoading ? "Cargando categorias..." : "Seleccionar categoria"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {renderServiceCategoryOptions(getEditableCategoryIds(service.id))}
                                  </SelectContent>
                                </Select>
                              </div>
<div>
                                <Label htmlFor="edit-description">Descripción *</Label>
                                <Textarea
                                  id="edit-description"
                                  placeholder="Describe tu servicio en detalle..."
                                  value={editData.description}
                                  onChange={(e) =>
                                    setEditData((d) => ({ ...d, description: e.target.value }))
                                  }
                                  className="rounded-xl mt-1 min-h-[100px]"
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
                                  const selectedCategory = serviceCategoryOptions.find(
                                    (category) => category.slug === editCategorySlug
                                  );

                                  if (!selectedCategory) {
                                    toast.error('Selecciona una categoria valida');
                                    return;
                                  }

                                  if (!getEditableCategoryIds(service.id).has(selectedCategory.id)) {
                                    toast.error('Ese servicio ya esta cargado en tu perfil');
                                    return;
                                  }

                                  const payload: Record<string, string> = {};
                                  // Si hay título personalizado, usarlo; sino usar el nombre de la categoría
                                  const categoryName =
                                    categoryNameBySlug.get(editCategorySlug) || service.category?.name || '';
                                  payload.title = categoryName;
                                  payload.description = editData.description;
                                  try {
                                    const updatedService = await updateService(service.id, payload);
                                    toast.success('Servicio actualizado correctamente');
                                    setMe(prev => prev ? { ...prev, services: prev.services?.map((s) => s.id === service.id ? { ...s, ...(updatedService as Partial<DashboardService>) } : s) } : prev);
                                    setEditingId(null);
                                    setEditData({ description: '' });
                                  } catch (error) {
                                    toast.error(getErrorMessage(error, 'Error al actualizar el servicio'));
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
                            try {
                              await deleteService(service.id);
                              setMe(prev => prev ? { ...prev, services: prev.services?.filter((s) => s.id !== service.id) } : prev);
                              toast.success('Servicio eliminado correctamente');
                            } catch (error) {
                              toast.error(getErrorMessage(error, 'Error al eliminar el servicio'));
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
                )})}
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

          {/* Diálogo de confirmación para desactivar servicio */}
          <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Desactivar servicio
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <p className="text-sm text-gray-700">
                  ¿Estás seguro de que querés desactivar este servicio?
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">
                    {serviceToDisable?.title || serviceToDisable?.category?.name}
                  </span>
                  {" "}dejará de estar visible en tu perfil público y en los resultados de búsqueda.
                </p>
              </div>
              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setDisableDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    if (!serviceToDisable) return;
                    try {
                      await updateService(serviceToDisable.id, { available: false });
                      setMe(prev =>
                        prev
                          ? {
                              ...prev,
                              services: prev.services?.map((s) =>
                                s.id === serviceToDisable.id ? { ...s, available: false } : s
                              ),
                            }
                          : prev
                      );
                      toast.success('Servicio desactivado. Ya no es visible en la plataforma.');
                    } catch (error) {
                      console.error('Error desactivando servicio:', error);
                      toast.error(getErrorMessage(error, 'Error al desactivar el servicio'));
                    } finally {
                      setDisableDialogOpen(false);
                      setServiceToDisable(null);
                    }
                  }}
                >
                  Sí, desactivar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}





