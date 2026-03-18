"use client";

import { useMemo, useState } from "react";
import { ProfessionalCard } from "@/components/features/ProfessionalCard";
import { CitySelect } from "@/components/features/CitySelect";
import { useFeaturedServices } from "@/hooks/useFeaturedCategories";

export function FeaturedProfessionals() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const locationFilter = selectedLocation !== "all" ? selectedLocation : undefined;
  const { services, loading, error } = useFeaturedServices(6, locationFilter);

  const grouped = useMemo(() => {
    const byProfessional = new Map<string, typeof services>();

    services
      .filter(
        (service) =>
          service.professional &&
          service.category &&
          service.professional.user &&
          service.professional.user.name
      )
      .forEach((service) => {
        const professionalId = service.professional!.id;

        if (!byProfessional.has(professionalId)) {
          byProfessional.set(professionalId, []);
        }

        byProfessional.get(professionalId)!.push(service);
      });

    return Array.from(byProfessional.values());
  }, [services]);

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

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-6 py-10 text-center text-sm text-muted-foreground dark:border-gray-700 dark:bg-gray-900/30">
          No hay profesionales destacados para esta ciudad por ahora.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {grouped.map((svcList) => {
            const first = svcList[0]!;
            const professional = first.professional!;

            return (
              <ProfessionalCard
                key={professional.id}
                professional={{
                  id: professional.id,
                  user: { name: professional.user!.name! },
                  bio: (professional as unknown as { bio?: string }).bio || first.description,
                  verified: professional.verified,
                  specialties: svcList.map((service) => service.title),
                  primaryCategory: { name: first.category!.name },
                  location:
                    (professional as unknown as { location?: string | null }).location || undefined,
                  socialNetworks: {
                    profilePicture:
                      (professional as unknown as { ProfilePicture?: string | null })
                        .ProfilePicture || undefined,
                  },
                  whatsapp:
                    (professional as unknown as { whatsapp?: string | null }).whatsapp || undefined,
                  phone:
                    (professional.user as unknown as { phone?: string | null }).phone || undefined,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
