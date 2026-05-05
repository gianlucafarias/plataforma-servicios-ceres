import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import WhatsAppIcon from "@/components/ui/whatsapp";
import { LOCATIONS } from "@/lib/taxonomy";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";

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

  const whatsappUrl = buildWhatsAppLink(
    professional.whatsapp || professional.phone,
    "Hola, vi tu perfil en Ceres en Red y me interesa contactarte."
  );
  const additionalServiceTitles = (professional.serviceTitles ?? []).slice(1, 4);

  return (
    <article className="rounded-2xl border border-[#e9ecef] bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-2 sm:grid-cols-[64px_minmax(0,1fr)_auto]">
        {professional.socialNetworks?.profilePicture ? (
          <Avatar className="h-16 w-16 shrink-0">
            <div className="h-full w-full overflow-hidden rounded-xl">
              <Image
                src={resolvePublicUploadUrl(professional.socialNetworks.profilePicture)}
                alt={professional.user.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
          </Avatar>
        ) : (
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="rounded-xl bg-[#ecfdf3] text-sm font-semibold text-[#127b45]">
              {professional.user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0">
          <div className="mb-1 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-base font-bold text-[#212529]">{professional.user.name}</h3>
                {professional.verified && (
                  <Image src="/verificado.png" alt="Verificado" width={14} height={14} />
                )}
              </div>
              {professional.primaryCategory?.name ? (
                <p className="truncate text-sm text-[#495057]">{professional.primaryCategory.name}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1 text-sm text-[#6c757d]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formattedLocation}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="min-h-[30px]">
            {additionalServiceTitles.length ? (
              <div className="flex flex-wrap gap-2">
                {additionalServiceTitles.map((serviceTitle) => (
                  <span
                    key={`${professional.id}-${serviceTitle}`}
                    className="max-w-[120px] truncate rounded-full border border-[#dee2e6] bg-[#f8f9fa] px-2.5 py-1 text-xs font-medium text-[#495057]"
                  >
                    {serviceTitle}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-start-2 mt-1 flex items-center justify-end gap-2 sm:col-start-3 sm:row-start-3 sm:mt-0 sm:self-end">
            <Link
              href={`/profesionales/${professional.id}`}
              className="rounded-full border border-[#ced4da] px-4 py-2 text-sm font-medium text-[#343a40] transition-colors hover:bg-[#f8f9fa]"
            >
              Ver perfil
            </Link>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Contactar a ${professional.user.name} por WhatsApp`}
                className="inline-flex items-center rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#20BD5C]"
              >
                <WhatsAppIcon className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
        </div>
      </div>
    </article>
  );
}
