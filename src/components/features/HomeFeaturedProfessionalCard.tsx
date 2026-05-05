import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LOCATIONS } from "@/lib/taxonomy";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";
import { VerifiedIcon } from "@/components/ui/verified-icon";

type HomeFeaturedProfessionalCardProps = {
  professional: {
    id: string;
    user: { name: string };
    verified: boolean;
    primaryCategory?: { name: string };
    serviceTitles?: string[];
    location?: string;
    socialNetworks?: {
      profilePicture?: string;
    };
    whatsapp?: string;
    phone?: string;
  };
};

export function HomeFeaturedProfessionalCard({ professional }: HomeFeaturedProfessionalCardProps) {
  const formattedLocation = (() => {
    const raw = professional.location || "Ceres, Santa Fe";
    if (!raw.includes(",")) {
      const found = LOCATIONS.find((l) => l.id === raw);
      return found?.name || raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return raw;
  })();

  const primaryLabel =
    professional.primaryCategory?.name || professional.serviceTitles?.[0] || "Profesional";
  const chipTitles = (professional.serviceTitles ?? []).slice(0, 3);

  return (
    <Link
      href={`/profesionales/${professional.id}`}
      className="block rounded-2xl border border-[#e9ecef] bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#fafafa]"
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3">
        {professional.socialNetworks?.profilePicture ? (
          <Avatar className="h-[72px] w-[72px] shrink-0 rounded-xl">
            <div className="h-full w-full overflow-hidden rounded-xl">
              <Image
                src={resolvePublicUploadUrl(professional.socialNetworks.profilePicture)}
                alt={professional.user.name}
                width={72}
                height={72}
                className="h-full w-full object-cover"
              />
            </div>
          </Avatar>
        ) : (
          <Avatar className="h-[72px] w-[72px] shrink-0 rounded-xl">
            <AvatarFallback className="rounded-xl bg-[#ecfdf3] text-sm font-semibold text-[#127b45]">
              {professional.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 pt-0.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="truncate text-base leading-6 font-semibold tracking-normal text-[#1f2937]">{professional.user.name}</h3>
              {professional.verified ? (
                <VerifiedIcon className="h-3.5 w-3.5" />
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs font-medium text-[#006F4B]">{primaryLabel}</p>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-sm text-[#6b7280]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
            <span className="truncate">{formattedLocation.replace(", Argentina", "")}</span>
          </div>
          <div className="mt-2 min-h-[28px]">
            {chipTitles.length ? (
              <div className="flex flex-wrap gap-2">
                {chipTitles.map((serviceTitle) => (
                  <span
                    key={`${professional.id}-${serviceTitle}`}
                    className="rounded-full border border-[#e5e7eb] bg-[#f3f4f6] px-2.5 py-1 text-xs font-medium text-[#4b5563] leading-none"
                  >
                    {serviceTitle}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
