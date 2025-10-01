import { describe, it, expect } from 'vitest';
import { checkProfessionalAvailability, type ProfessionalSchedule } from '@/lib/availability';

describe('availability', () => {
  describe('checkProfessionalAvailability', () => {
    it('retorna disponible si no hay horario configurado', () => {
      const result = checkProfessionalAvailability(null);
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
      expect(result.reason).toBe('Horarios no configurados');
    });

    it('retorna no disponible si no hay horario para el día actual', () => {
      const schedule: ProfessionalSchedule = {
        monday: {
          morning: { enabled: true, start: '09:00', end: '12:00' }
        }
      };
      
      // Usar un martes para que no haya horario configurado
      const testDate = new Date('2025-09-30T10:00:00'); // Martes
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe('No especificado');
      expect(result.reason).toContain('Sin horario configurado');
    });

    it('retorna disponible cuando fullDay está habilitado', () => {
      const schedule: ProfessionalSchedule = {
        monday: {
          fullDay: true
        }
      };
      
      // Lunes 10:00
      const testDate = new Date('2025-09-29T10:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
      expect(result.reason).toBe('Disponible 24 horas');
    });

    it('retorna disponible durante horario de mañana', () => {
      const schedule: ProfessionalSchedule = {
        monday: {
          morning: { enabled: true, start: '09:00', end: '12:00' }
        }
      };
      
      // Lunes 10:30 - dentro del horario de mañana
      const testDate = new Date('2025-09-29T10:30:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
    });

    it('retorna disponible durante horario de tarde', () => {
      const schedule: ProfessionalSchedule = {
        tuesday: {
          afternoon: { enabled: true, start: '14:00', end: '18:00' }
        }
      };
      
      // Martes 15:30 - dentro del horario de tarde
      const testDate = new Date('2025-09-30T15:30:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
    });

    it('retorna no disponible fuera de horario', () => {
      const schedule: ProfessionalSchedule = {
        monday: {
          morning: { enabled: true, start: '09:00', end: '12:00' }
        }
      };
      
      // Lunes 13:00 - fuera del horario
      const testDate = new Date('2025-09-29T13:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(false);
      expect(result.status).toBe('No especificado');
    });

    it('retorna no disponible en feriados si no trabaja feriados', () => {
      const schedule: ProfessionalSchedule = {
        thursday: {
          morning: { enabled: true, start: '09:00', end: '12:00' }
        },
        workOnHolidays: false
      };
      
      // 1 de Mayo 2025 es jueves
      const testDate = new Date('2025-05-01T10:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('Día feriado');
    });

    it('retorna disponible en feriados si trabaja feriados', () => {
      const schedule: ProfessionalSchedule = {
        thursday: {
          morning: { enabled: true, start: '09:00', end: '12:00' }
        },
        workOnHolidays: true
      };
      
      // 1 de Mayo (Día del Trabajador, jueves) a las 10:00
      const testDate = new Date('2025-05-01T10:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
    });

    it('retorna disponible cuando está en uno de dos turnos habilitados', () => {
      const schedule: ProfessionalSchedule = {
        friday: {
          morning: { enabled: true, start: '09:00', end: '12:00' },
          afternoon: { enabled: true, start: '14:00', end: '18:00' }
        }
      };
      
      // Viernes 16:00 - en horario de tarde
      const testDate = new Date('2025-10-03T16:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(true);
      expect(result.status).toBe('Disponible');
    });

    it('retorna no disponible entre turnos', () => {
      const schedule: ProfessionalSchedule = {
        wednesday: {
          morning: { enabled: true, start: '09:00', end: '12:00' },
          afternoon: { enabled: true, start: '14:00', end: '18:00' }
        }
      };
      
      // Miércoles 13:00 - entre turnos
      const testDate = new Date('2025-10-01T13:00:00');
      const result = checkProfessionalAvailability(schedule, testDate);
      
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('Disponible desde las 14:00');
    });
  });
});

