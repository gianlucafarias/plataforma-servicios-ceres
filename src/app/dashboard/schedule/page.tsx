"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Loader2, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  type DashboardSchedule,
  type DashboardScheduleDay,
  getDashboardProfile,
  updateDashboardSchedule,
} from "@/lib/api/dashboard";
import { getErrorMessage } from "@/lib/api/client";

interface ScheduleData extends DashboardScheduleDay {
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
  { id: 'wednesday', name: 'MiÃ©rcoles', short: 'X' },
  { id: 'thursday', name: 'Jueves', short: 'J' },
  { id: 'friday', name: 'Viernes', short: 'V' },
  { id: 'saturday', name: 'SÃ¡bado', short: 'S' },
  { id: 'sunday', name: 'Domingo', short: 'D' },
];

function buildDefaultSchedule(): Record<string, ScheduleData> {
  const defaultSchedule: Record<string, ScheduleData> = {};
  DAYS_OF_WEEK.forEach(day => {
    defaultSchedule[day.id] = {
      morning: { enabled: true, start: '08:00', end: '12:00' },
      afternoon: { enabled: true, start: '14:00', end: '18:00' },
      fullDay: false,
      workOnHolidays: false
    };
  });
  return defaultSchedule;
}

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleData>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        const professional = await getDashboardProfile();
        if (professional.schedule && typeof professional.schedule === 'object') {
          setScheduleData(professional.schedule as Record<string, ScheduleData>);
        } else {
          setScheduleData(buildDefaultSchedule());
        }
      } catch (error) {
        console.error('Error cargando horarios:', error);
        toast.error(getErrorMessage(error, 'Error al cargar los horarios'));
        setScheduleData(buildDefaultSchedule());
      } finally {
        setLoading(false);
      }
    };

    void loadScheduleData();
  }, []);

  const handleDayScheduleChange = (dayId: string, field: keyof ScheduleData, value: boolean | string | {enabled: boolean; start: string; end: string}) => {
    setScheduleData(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }));
    setHasChanges(true);
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
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDashboardSchedule(scheduleData as DashboardSchedule);
      toast.success('Horarios actualizados correctamente');
      setHasChanges(false);
    } catch (error) {
      console.error('Error actualizando horarios:', error);
      toast.error(getErrorMessage(error, 'Error al actualizar los horarios'));
    } finally {
      setSaving(false);
    }
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
    setHasChanges(true);
    toast.success('Horarios copiados a todos los dÃ­as');
  };

  const resetToDefault = () => {
    setScheduleData(buildDefaultSchedule());
    setHasChanges(true);
    toast.info('Horarios restaurados por defecto');
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="h-8 w-8 text-[#006F4B]" />
              Horarios de Disponibilidad
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura tus horarios de trabajo para que los clientes sepan cuÃ¡ndo estÃ¡s disponible
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetToDefault}
              disabled={saving}
            >
              Restaurar
            </Button>
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
              {saving ? 'Guardando...' : 'Guardar Horarios'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ConfiguraciÃ³n General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Trabajo en dÃ­as feriados</Label>
                <p className="text-sm text-muted-foreground">
                  Indica si trabajas durante los dÃ­as feriados
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
                  setHasChanges(true);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = scheduleData[day.id];
            if (!daySchedule) return null;

            return (
              <Card key={day.id}>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Todo el dÃ­a (24hs)</Label>
                      <p className="text-xs text-muted-foreground">
                        Disponible las 24 horas
                      </p>
                    </div>
                    <Switch
                      checked={daySchedule.fullDay}
                      onCheckedChange={(checked) => {
                        handleDayScheduleChange(day.id, 'fullDay', checked);
                        if (checked) {
                          handleDayScheduleChange(day.id, 'morning', { ...daySchedule.morning, enabled: false });
                          handleDayScheduleChange(day.id, 'afternoon', { ...daySchedule.afternoon, enabled: false });
                        }
                      }}
                    />
                  </div>

                  {!daySchedule.fullDay && (
                    <>
                      <Separator />
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Turno MaÃ±ana</Label>
                          <Switch
                            checked={daySchedule.morning.enabled}
                            onCheckedChange={(checked) => handleDayScheduleChange(day.id, 'morning', { ...daySchedule.morning, enabled: checked })}
                          />
                        </div>
                        {daySchedule.morning.enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Inicio</Label>
                              <input
                                type="time"
                                value={daySchedule.morning.start}
                                onChange={(e) => handleTimeChange(day.id, 'morning', 'start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Fin</Label>
                              <input
                                type="time"
                                value={daySchedule.morning.end}
                                onChange={(e) => handleTimeChange(day.id, 'morning', 'end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />
                      
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
                              <Label className="text-xs text-muted-foreground">Inicio</Label>
                              <input
                                type="time"
                                value={daySchedule.afternoon.start}
                                onChange={(e) => handleTimeChange(day.id, 'afternoon', 'start', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Fin</Label>
                              <input
                                type="time"
                                value={daySchedule.afternoon.end}
                                onChange={(e) => handleTimeChange(day.id, 'afternoon', 'end', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#006F4B] focus:border-[#006F4B]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

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

        <Card>
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
                    <div className="text-xs text-muted-foreground mt-1">
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
      </div>
    </div>
  );
}
