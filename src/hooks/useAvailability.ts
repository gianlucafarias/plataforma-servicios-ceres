// import { useProfessionalAvailability } from '@/lib/availability';
import React from 'react';
import type { ProfessionalSchedule } from '@/lib/availability';

/**
 * Hook personalizado para obtener la disponibilidad en tiempo real
 * Se actualiza cada minuto
 */
export function useAvailability(schedule: ProfessionalSchedule | null | undefined) {
  const [availability, setAvailability] = React.useState(() => 
    checkProfessionalAvailability(schedule)
  );

  React.useEffect(() => {
    // Actualizar inmediatamente
    setAvailability(checkProfessionalAvailability(schedule));

    // Configurar intervalo para actualizar cada minuto
    const interval = setInterval(() => {
      setAvailability(checkProfessionalAvailability(schedule));
    }, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, [schedule]);

  return availability;
}

// Importar la función desde el archivo de utilidades
import { checkProfessionalAvailability } from '@/lib/availability';
