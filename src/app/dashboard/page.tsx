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
  CheckCircle
} from "lucide-react";
import { Professional, Service } from "@/types";
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBCATEGORIES_OFICIOS } from "@/lib/taxonomy";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
// Datos mock para el dashboard (solo estadísticas temporales)

const mockStats = {
  totalViews: 340,
  monthlyViews: [85, 92, 78, 105, 120, 98, 110, 134, 156, 189, 203, 225],
  avgRating: 4.8,
  totalServices: 3,
  profileViews: 145,
  serviceViews: 195,
};


type DashboardService = Service & { category?: { name: string } };
type ProfessionalWithServices = Professional & { services?: DashboardService[] };

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [me, setMe] = useState<ProfessionalWithServices | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newService, setNewService] = useState({ categorySlug: "", title: "", description: "", priceRange: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", description: "", priceRange: "" });
  
  // Estados para horarios
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleData>>({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleHasChanges, setScheduleHasChanges] = useState(false);

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
        console.log(result);
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
        initializeDefaultSchedule();
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfessional();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006F4B]"></div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes perfil profesional aún</h2>
          <p className="text-gray-600 mb-4">Completa tu registro para acceder al dashboard</p>
          <Button asChild>
            <a href="/auth/registro">Completar registro</a>
          </Button>
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
                <Badge className={`rounded-xl ${isVerified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center`}>
                  <Building2 className="h-3 w-3 mr-1" />
                  {isVerified ? 'Verificado' : 'Pendiente de verificación'}
                </Badge>
                <Button className="bg-gradient-to-r from-[#006F4B] to-[#008F5B] text-white rounded-xl hover:from-[#008F5B] hover:to-[#006F4B]">
                  <Settings className="h-4 w-4 mr-2" />
                  Ajustes
                </Button>
              </div>
            </div>
          </div>

            {/* Banner de estado de verificación */}
            {!isVerified && (
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
              <TabsTrigger value="overview" className="rounded-xl">Resumen</TabsTrigger>
              <TabsTrigger value="services" className="rounded-xl">Mis Servicios</TabsTrigger>
              <TabsTrigger value="horarios" className="rounded-xl">Horarios</TabsTrigger>
            </TabsList>

            {/* Tab Resumen */}
            <TabsContent value="overview" className="space-y-6">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-2xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-2xl bg-blue-100">
                        <Eye className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Visualizaciones</p>
                        <p className="text-2xl font-bold text-gray-900">{mockStats.totalViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-2xl bg-green-100">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Vistas del Perfil</p>
                        <p className="text-2xl font-bold text-gray-900">{mockStats.profileViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-2xl bg-purple-100">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Vistas de Servicios</p>
                        <p className="text-2xl font-bold text-gray-900">{mockStats.serviceViews}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

               
              </div>

              {/* Gráfico de visualizaciones */}
              <Card className="rounded-2xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="font-rutan">Visualizaciones de los últimos 12 meses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {mockStats.monthlyViews.map((views, index) => {
                      const maxViews = Math.max(...mockStats.monthlyViews);
                      const height = (views / maxViews) * 100;
                      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-gradient-to-t from-[#006F4B] to-[#008F5B] rounded-t-md transition-all duration-300 hover:opacity-80"
                            style={{ height: `${height}%` }}
                            title={`${months[index]}: ${views} visualizaciones`}
                          />
                          <span className="text-xs text-gray-500 mt-2">{months[index]}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Tendencia: <span className="text-green-600 font-medium">+32% este mes</span>
                  </div>
                </CardContent>
              </Card>

              
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
                    <div className="space-y-3">
                      {/* Área (solo oficios) y Subcategoría */}
                      <Select value={newService.categorySlug} onValueChange={(v) => setNewService(s => ({ ...s, categorySlug: v }))}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Seleccionar subcategoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBCATEGORIES_OFICIOS.map(cat => (
                            <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Título" value={newService.title} onChange={e => setNewService(s => ({ ...s, title: e.target.value }))} />
                      <Input placeholder="Descripción" value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} />
                      <Input placeholder="Rango de precio (opcional)" value={newService.priceRange} onChange={e => setNewService(s => ({ ...s, priceRange: e.target.value }))} />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          const res = await fetch('/api/services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(newService),
                          });
                          const json = await res.json();
                          if (json.success) {
                            setMe(prev => prev ? { ...prev, services: [ ...(prev.services || []), json.data as DashboardService ] } : prev);
                            setCreating(false);
                            setNewService({ categorySlug: '', title: '', description: '', priceRange: '' });
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
                      {editingId === service.id ? (
                        <div className="space-y-2 mb-4">
                          <Input placeholder="Título" value={editData.title} onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))} />
                          <Input placeholder="Descripción" value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} />
                          <Input placeholder="Rango de precio (opcional)" value={editData.priceRange} onChange={(e) => setEditData(d => ({ ...d, priceRange: e.target.value }))} />
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{service.description}</p>
                      )}
                     
                      
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
                            <div className="space-y-3">
                              {/* En edición no cambiamos categoría por ahora */}
                              <Input placeholder="Título" value={editData.title} onChange={(e) => setEditData(d => ({ ...d, title: e.target.value }))} />
                              <Input placeholder="Descripción" value={editData.description} onChange={(e) => setEditData(d => ({ ...d, description: e.target.value }))} />
                              <Input placeholder="Rango de precio (opcional)" value={editData.priceRange} onChange={(e) => setEditData(d => ({ ...d, priceRange: e.target.value }))} />
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={async () => {
                                  const payload: Record<string, string> = {};
                                  if (editData.title) payload.title = editData.title;
                                  if (editData.description) payload.description = editData.description;
                                  if (editData.priceRange) payload.priceRange = editData.priceRange;
                                  const res = await fetch(`/api/services/${service.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify(payload),
                                  });
                                  const json = await res.json();
                                  if (json.success) {
                                    setMe(prev => prev ? { ...prev, services: prev.services?.map((s) => s.id === service.id ? { ...s, ...(payload as Partial<DashboardService>) } : s) } : prev);
                                    setEditingId(null);
                                    setEditData({ title: '', description: '', priceRange: '' });
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
                        <Button
                          onClick={async () => {
                            if (!confirm('¿Eliminar este servicio?')) return;
                            const res = await fetch(`/api/services/${service.id}`, { method: 'DELETE', credentials: 'include' });
                            const json = await res.json();
                            if (json.success) {
                              setMe(prev => prev ? { ...prev, services: prev.services?.filter((s) => s.id !== service.id) } : prev);
                            }
                          }}
                          variant="outline" size="sm" className="rounded-xl text-red-600 hover:text-red-800">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Modal simple inline para crear servicio */}
              {creating && (
                <Card className="rounded-2xl border border-gray-100">
                  <CardHeader>
                    <CardTitle className="font-rutan">Agregar Servicio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={newService.categorySlug} onValueChange={(v) => setNewService(s => ({ ...s, categorySlug: v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBCATEGORIES_OFICIOS.map(cat => (
                          <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Título" value={newService.title} onChange={e => setNewService(s => ({ ...s, title: e.target.value }))} />
                    <Input placeholder="Descripción" value={newService.description} onChange={e => setNewService(s => ({ ...s, description: e.target.value }))} />
                    <Input placeholder="Rango de precio (opcional)" value={newService.priceRange} onChange={e => setNewService(s => ({ ...s, priceRange: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          const res = await fetch('/api/services', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(newService),
                          });
                          const json = await res.json();
                          if (json.success) {
                            setMe(prev => prev ? { ...prev, services: [ ...(prev.services || []), json.data as DashboardService ] } : prev);
                            setCreating(false);
                            setNewService({ categorySlug: '', title: '', description: '', priceRange: '' });
                          }
                        }}
                        className="bg-[#006F4B] text-white rounded-xl">
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setCreating(false)} className="rounded-xl">Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
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
