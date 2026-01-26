"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useState, useMemo, useCallback, memo, useEffect } from "react";

interface ProfessionalAvatarProps {
  name: string;
  profilePicture?: string;
  className?: string;
}

// Helper para determinar si es URL externa
function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function ProfessionalAvatarComponent({ name, profilePicture, className }: ProfessionalAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Memoizar cálculo de iniciales
  const initials = useMemo(() => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    [name]
  );

  // Determinar la URL de la imagen
  const imageSrc = useMemo(() => {
    if (!profilePicture) return null;
    
    // Si es URL externa, retornar tal cual
    if (isExternalUrl(profilePicture)) {
      return profilePicture;
    }
    
    // Si ya tiene la ruta completa, retornar tal cual
    if (profilePicture.startsWith('/uploads/profiles/')) {
      return profilePicture;
    }
    
    // Si es solo el nombre del archivo, agregar la ruta
    return `/uploads/profiles/${profilePicture}`;
  }, [profilePicture]);

  // Marcar como montado solo en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Resetear error cuando cambia la imagen
  useEffect(() => {
    if (imageSrc) {
      setImageError(false);
    } else {
      setImageError(true);
    }
  }, [imageSrc]);

  // Handlers
  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  // Determinar el tamaño del texto según el tamaño del avatar
  const textSize = useMemo(() => {
    if (className?.includes('h-8') || className?.includes('w-8')) return 'text-xs';
    if (className?.includes('h-10') || className?.includes('w-10')) return 'text-sm';
    if (className?.includes('h-12') || className?.includes('w-12')) return 'text-sm';
    return 'text-lg';
  }, [className]);

  // Si hay imagen y no hay error, mostrar la imagen
  if (imageSrc && !imageError && isMounted) {
    return (
      <Avatar className={className}>
        <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-100">
          {isExternalUrl(imageSrc) ? (
            // Para URLs externas (OAuth), usar img nativo
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={handleError}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={name}
              fill
              className="object-cover z-10"
              onError={handleError}
            />
          )}
        </div>
      </Avatar>
    );
  }

  // Fallback: mostrar iniciales si no hay imagen, hay error, o no está montado
  return (
    <Avatar className={className}>
      <AvatarFallback className={`bg-white text-[#006F4B] ${textSize} font-bold border-2 border-gray-100`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export const ProfessionalAvatar = memo(ProfessionalAvatarComponent);
