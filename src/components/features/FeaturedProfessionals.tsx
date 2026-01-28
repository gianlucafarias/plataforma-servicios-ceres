"use client";

import { useMemo } from "react";
import { useFeaturedServices } from "@/hooks/useFeaturedCategories";
import { ProfessionalCard } from "@/components/features/ProfessionalCard";

export function FeaturedProfessionals() {
  const { services, loading, error } = useFeaturedServices(6);

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
        const pid = service.professional!.id;
        if (!byProfessional.has(pid)) {
          byProfessional.set(pid, []);
        }
        byProfessional.get(pid)!.push(service);
      });

    return Array.from(byProfessional.values());
  }, [services]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (grouped.length === 0) {
    return <div className="text-muted-foreground">No hay servicios para mostrar aún.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {grouped.map((svcList) => {
        const first = svcList[0]!;
        const prof = first.professional!;
        return (
          <ProfessionalCard
            key={prof.id}
            professional={{
              id: prof.id,
              user: { name: prof.user!.name! },
              bio: (prof as unknown as { bio?: string }).bio || first.description,
              verified: prof.verified,
              specialties: svcList.map((s) => s.title),
              primaryCategory: { name: first.category!.name },
              location: (prof as unknown as { location?: string | null }).location || undefined,
              socialNetworks: {
                profilePicture: (prof as unknown as { ProfilePicture?: string | null }).ProfilePicture || undefined,
              },
              whatsapp: (prof as unknown as { whatsapp?: string | null }).whatsapp || undefined,
              phone: (prof.user as unknown as { phone?: string | null }).phone || undefined,
            }}
          />
        );
      })}
    </div>
  );
}
