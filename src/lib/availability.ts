/**
 * Determina si un profesional está disponible basándose en su horario y la hora actual
 */

export type DaySchedule = {
  fullDay?: boolean;
  morning?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  afternoon?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  workOnHolidays?: boolean;
};

export type ProfessionalSchedule = {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  workOnHolidays?: boolean;
};

/**
 * Convierte una hora en formato "HH:MM" a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Verifica si una hora está dentro de un rango de tiempo
 */
function isTimeInRange(currentMinutes: number, startTime: string, endTime: string): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Maneja horarios que cruzan medianoche
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Verifica si es un día feriado en Argentina
 * Lista básica de feriados fijos - se puede expandir
 */
function isHoliday(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Feriados fijos en Argentina
  const fixedHolidays = [
    { month: 1, day: 1 },   // Año Nuevo
    { month: 5, day: 1 },   // Día del Trabajador
    { month: 5, day: 25 },  // Revolución de Mayo
    { month: 7, day: 9 },   // Día de la Independencia
    { month: 12, day: 8 },  // Inmaculada Concepción
    { month: 12, day: 25 }, // Navidad
  ];
  
  return fixedHolidays.some(holiday => holiday.month === month && holiday.day === day);
}

/**
 * Determina si un profesional está disponible en este momento
 * @param schedule - Horarios del profesional
 * @param currentTime - Hora actual (opcional, por defecto usa la hora actual)
 * @returns Objeto con información de disponibilidad
 */
export function checkProfessionalAvailability(
  schedule: ProfessionalSchedule | null | undefined,
  currentTime?: Date
): {
  isAvailable: boolean;
  status: 'Disponible' | 'No disponible' | 'No especificado';
  reason?: string;
} {
  // Si no hay horarios configurados, asumir disponible
  if (!schedule) {
    return {
      isAvailable: true,
      status: 'Disponible',
      reason: 'Horarios no configurados'
    };
  }

  const now = currentTime || new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const currentMinutes = timeToMinutes(
    now.toLocaleTimeString('es-AR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  );

  // Mapear días de la semana
  const dayMap = [
    'sunday',    // 0
    'monday',    // 1
    'tuesday',   // 2
    'wednesday', // 3
    'thursday',  // 4
    'friday',    // 5
    'saturday'   // 6
  ];

  const todayKey = dayMap[currentDay] as keyof ProfessionalSchedule;
  const todaySchedule = schedule[todayKey];

  // Si no hay horario configurado para hoy
  if (!todaySchedule) {
    return {
      isAvailable: false,
      status: 'No especificado',
      reason: 'Sin horario configurado para hoy'
    };
  }

  // Verificar si es feriado
  const isHolidayToday = isHoliday(now);
  if (isHolidayToday && !schedule.workOnHolidays && !(todaySchedule as DaySchedule).workOnHolidays) {
    return {
      isAvailable: false,
      status: 'No especificado',
      reason: 'Día feriado'
    };
  }

  // Si está configurado para trabajar todo el día
  if ((todaySchedule as DaySchedule).fullDay) {
    return {
      isAvailable: true,
      status: 'Disponible',
      reason: 'Disponible 24 horas'
    };
  }

  // Verificar horario de mañana
  const morningAvailable = (todaySchedule as DaySchedule).morning?.enabled && 
    isTimeInRange(currentMinutes, (todaySchedule as DaySchedule).morning!.start, (todaySchedule as DaySchedule).morning!.end);

  // Verificar horario de tarde
  const afternoonAvailable = (todaySchedule as DaySchedule).afternoon?.enabled && 
    isTimeInRange(currentMinutes, (todaySchedule as DaySchedule).afternoon!.start, (todaySchedule as DaySchedule).afternoon!.end);

  // Si está en alguno de los horarios configurados
  if (morningAvailable || afternoonAvailable) {
    return {
      isAvailable: true,
      status: 'Disponible'
    };
  }

  // Determinar el próximo horario disponible
  let nextAvailableTime = '';
  let nextAvailableDay = '';
  
  // Primero buscar en el día actual
  if ((todaySchedule as DaySchedule).morning?.enabled && currentMinutes < timeToMinutes((todaySchedule as DaySchedule).morning!.start)) {
    nextAvailableTime = (todaySchedule as DaySchedule).morning!.start;
  } else if ((todaySchedule as DaySchedule).afternoon?.enabled && currentMinutes < timeToMinutes((todaySchedule as DaySchedule).afternoon!.start)) {
    nextAvailableTime = (todaySchedule as DaySchedule).afternoon!.start;
  } else {
    // Buscar en los próximos días
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDay + i) % 7;
      const nextDayKey = dayMap[nextDayIndex] as keyof ProfessionalSchedule;
      const nextDaySchedule = schedule[nextDayKey];
      
      if (nextDaySchedule && (nextDaySchedule as DaySchedule).fullDay) {
        nextAvailableDay = dayMap[nextDayIndex].charAt(0).toUpperCase() + dayMap[nextDayIndex].slice(1);
        nextAvailableTime = '00:00';
        break;
      } else if (nextDaySchedule) {
        const nextDayScheduleTyped = nextDaySchedule as DaySchedule;
        if (nextDayScheduleTyped.morning?.enabled) {
          nextAvailableDay = dayMap[nextDayIndex].charAt(0).toUpperCase() + dayMap[nextDayIndex].slice(1);
          nextAvailableTime = nextDayScheduleTyped.morning.start;
          break;
        } else if (nextDayScheduleTyped.afternoon?.enabled) {
          nextAvailableDay = dayMap[nextDayIndex].charAt(0).toUpperCase() + dayMap[nextDayIndex].slice(1);
          nextAvailableTime = nextDayScheduleTyped.afternoon.start;
          break;
        }
      }
    }
  }

  let reasonText = '';
  if (nextAvailableTime && nextAvailableDay) {
    reasonText = `Disponible el ${nextAvailableDay} desde las ${nextAvailableTime}`;
  } else if (nextAvailableTime) {
    reasonText = `Disponible desde las ${nextAvailableTime}`;
  } else {
    reasonText = 'Fuera de horario';
  }

  return {
    isAvailable: false,
    status: 'No especificado',
    reason: reasonText
  };
}

