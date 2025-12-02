"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useState, useMemo, useCallback, memo } from "react";

interface ProfessionalAvatarProps {
  name: string;
  profilePicture?: string;
  className?: string;
}

function ProfessionalAvatarComponent({ name, profilePicture, className }: ProfessionalAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoizar cálculo de iniciales
  const initials = useMemo(() => 
    name.split(' ').map(n => n[0]).join('').toUpperCase(),
    [name]
  );

  // Memoizar handlers
  const handleError = useCallback(() => setImageError(true), []);
  const handleLoad = useCallback(() => setImageLoaded(true), []);

  if (profilePicture && !imageError) {
    return (
      <Avatar className={className}>
        <div className="w-full h-full rounded-full overflow-hidden relative">
          {/* Skeleton mientras carga */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-full">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
          
          <Image
            src={`/uploads/profiles/${profilePicture}`}
            alt={name}
            width={122}
            height={122}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={handleError}
            onLoad={handleLoad}
          />
        </div>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarFallback className="bg-[#006F4B]/10 text-[#006F4B] text-sm font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export const ProfessionalAvatar = memo(ProfessionalAvatarComponent);
