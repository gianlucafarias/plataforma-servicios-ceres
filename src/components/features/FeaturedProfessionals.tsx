"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CitySelect } from "@/components/features/CitySelect";
import { HomeFeaturedProfessionalCard } from "@/components/features/HomeFeaturedProfessionalCard";
import type { FeaturedHomeProfessional } from "@/lib/server/public-professionals";

type FeaturedProfessionalsProps = {
  professionals: FeaturedHomeProfessional[];
};

export function FeaturedProfessionals({ professionals }: FeaturedProfessionalsProps) {
  const [selectedLocation, setSelectedLocation] = useState("all");

  const grouped = useMemo(() => {
    const filteredProfessionals =
      selectedLocation === "all"
        ? professionals
        : professionals.filter((professional) => {
            const normalizedLocation = professional.location ?? "";

            return (
              normalizedLocation === selectedLocation ||
              professional.serviceLocations.includes(selectedLocation) ||
              professional.serviceLocations.includes("all-region")
            );
          });

    const randomized = [...filteredProfessionals];
    for (let i = randomized.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
    }

    return randomized.slice(0, 6);
  }, [professionals, selectedLocation]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
            Profesionales destacados
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Verificados y listos para ayudarte
          </p>
        </div>

        <div className="sm:pt-1">
          <CitySelect
            value={selectedLocation}
            onValueChange={setSelectedLocation}
            excludeIds={["otra"]}
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-10 text-center text-sm text-muted-foreground dark:border-gray-700 dark:bg-gray-900/30">
          No hay profesionales destacados para esta ciudad por ahora.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grouped.map((professional) => {
              return (
                <HomeFeaturedProfessionalCard
                  key={professional.id}
                  professional={{
                    id: professional.id,
                    user: { name: professional.user.name },
                    verified: professional.verified,
                    primaryCategory: professional.primaryCategory?.name
                      ? { name: professional.primaryCategory.name }
                      : undefined,
                    serviceTitles: professional.serviceTitles,
                    location: professional.location || undefined,
                    socialNetworks: {
                      profilePicture: professional.ProfilePicture || undefined,
                    },
                    whatsapp: professional.whatsapp || undefined,
                    phone: professional.phone || undefined,
                  }}
                />
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/servicios"
              className="rounded-full border border-[#d0d7de] bg-white px-6 py-3 text-sm font-semibold text-[#2f363d] transition-colors hover:bg-[#f6f8fa]"
            >
              Ver todos los profesionales
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
