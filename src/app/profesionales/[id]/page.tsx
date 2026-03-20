import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProfessionalAvatar } from "@/components/features/ProfessionalAvatar";
import { getLocations } from "@/lib/taxonomy";
import { 
  MapPin, 
  Clock, 
  Phone,
  Award,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  FileText,
  Briefcase,
  CalendarDays,
  ArrowLeft,
  Star,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Store
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import WhatsAppIcon from "@/components/ui/whatsapp";
import { checkProfessionalAvailability } from "@/lib/availability";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import type { Metadata } from "next";
import { getBaseUrl, generateProfessionalStructuredData, generateBreadcrumbsStructuredData } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ProfileViewTracker } from "@/components/features/ProfileViewTracker";
import {
  getProfessionalProfileContext,
  toProfessionalPageProfile,
  type ProfessionalPageProfile,
} from "@/lib/server/professional-profile";

type ApiProfessional = ProfessionalPageProfile;

// Función helper para obtener datos del profesional directamente desde la BD
async function getProfessionalData(id: string, viewerUserId?: string): Promise<ApiProfessional | null> {
  const context = await getProfessionalProfileContext(id, viewerUserId);
  if (!context.found) return null;
  return toProfessionalPageProfile(context);
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getProfessionalData(id);
  
  if (!data) {
    return {
      title: "Profesional no encontrado",
      description: "El profesional que buscas no está disponible.",
    };
  }

  const baseUrl = getBaseUrl();
  const professionalName = `${data.user.firstName} ${data.user.lastName}`.trim();
  const category = data.services[0]?.category?.name || "Profesional";
  const location = data.location || data.user.location || "Ceres, Santa Fe";
  const bio = data.bio || `Profesional ${category} en ${location}`;
  const imageUrl = data.ProfilePicture || data.user.image 
    ? (data.ProfilePicture?.startsWith('http') 
        ? data.ProfilePicture 
        : `${baseUrl}${data.ProfilePicture?.startsWith('/') ? '' : '/'}${data.ProfilePicture || data.user.image}`)
    : `${baseUrl}/gob_iso.png`;
  
  const pageUrl = `${baseUrl}/profesionales/${id}`;
  const title = `${professionalName} - ${category} en Ceres | Ceres en Red`;
  const description = `${bio.substring(0, 155)}${bio.length > 155 ? '...' : ''} | ${location}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Ceres en Red",
      locale: "es_AR",
      type: "profile",
      images: [
        {
          url: imageUrl,
          width: 400,
          height: 400,
          alt: `${professionalName} - ${category}`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: data.status === 'active',
      follow: data.status === 'active',
    },
  };
}

export default async function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const data = await getProfessionalData(id, session?.user?.id);
  
  if (!data) {
    notFound(); /* return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se encontró el profesional.</p>
          <Link href="/profesionales" className="inline-flex items-center gap-2 text-[#006F4B] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a profesionales
          </Link>
        </div>
      </div>
    ); */
  }

  // Verificar si el perfil está pendiente y si el usuario es el dueño
  const isPending = data.status === 'pending';
  const isOwner = session?.user?.id && data.userId === session.user.id;
  const showPendingOverlay = isPending && isOwner;

  const availability = checkProfessionalAvailability(data.schedule);
  const locations = getLocations();
  
  // El location puede venir como nombre completo (ej. "Ceres, Santa Fe, Argentina") o como ID
  // Intentamos usar el location del professional, si no existe usamos el del user
  const rawLocation = data.location || data.user?.location;
  let locationName = 'Ceres, Santa Fe, Argentina'; // Default
  
  if (rawLocation) {
    // Si parece ser un ID (solo letras minúsculas, sin comas), buscar en LOCATIONS
    if (!rawLocation.includes(',')) {
      const found = locations.find(l => l.id === rawLocation);
      locationName = found?.name || rawLocation;
    } else {
      // Ya es el nombre completo
      locationName = rawLocation;
    }
  }
  
  const coverageLocations = data.serviceLocations?.includes('all-region') 
    ? ['Toda la región']
    : data.serviceLocations?.filter(locId => locId !== rawLocation).map(locId => {
        const found = locations.find(l => l.id === locId);
        return found?.name || locId;
      }).filter(Boolean) || [];

  const p = {
    name: `${data.user.firstName} ${data.user.lastName}`.trim(),
    bio: data.bio,
    years: data.experienceYears ?? 0,
    verified: data.verified,
    rating: data.rating ?? 0,
    reviews: data.reviewCount ?? 0,
    category: data.services[0]?.category?.name,
    phone: data.user.phone?.trim() || "",
    whatsapp: data.whatsapp?.trim() || data.user.phone?.trim() || "",
    location: locationName,
    coverage: coverageLocations,
    picture: data.ProfilePicture || data.user.image, // Fallback a imagen de OAuth
    services: data.services || [],
    availability,
    instagram: data.instagram,
    facebook: data.facebook,
    linkedin: data.linkedin,
    website: data.website,
    portfolio: data.portfolio,
    schedule: data.schedule,
    holidays: data.schedule?.monday?.workOnHolidays || false,
    certifications: data.certifications || [],
  };

  const ownerCv = isOwner ? data.CV : null;

  const mainWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, vi tu perfil en Ceres en Red y me gustaría contactarte.`
  );

  const servicesWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, vi tu perfil en Ceres en Red y me gustaría consultar por tus servicios.`
  );

  void servicesWhatsappLink;

  const scheduleWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, quería consultar tu disponibilidad horaria.`
  );

  // Formatear horarios
  const hasWhatsapp = !!mainWhatsappLink;
  const hasPhone = !!p.phone;
  const hasContactDetails = hasPhone || !!p.instagram || !!p.facebook || !!p.linkedin || !!p.website;
  const availabilityLabel = p.availability.isAvailable
    ? "Disponible en este momento"
    : "Disponibilidad a coordinar";
  const availabilityDescription = p.availability.isAvailable
    ? "Responde por contacto directo para confirmar horario y alcance."
    : "Consulta por WhatsApp o llamada para coordinar dia y horario.";
  const reviewsLabel = `${p.reviews} resena${p.reviews === 1 ? "" : "s"}`;
  const normalizedInstagram = p.instagram?.replace("@", "").trim();
  const normalizedFacebook = p.facebook?.trim();
  const normalizedLinkedin = p.linkedin?.trim();
  const normalizedWebsite = p.website?.trim();
  const normalizedPortfolio = p.portfolio?.trim();
  const portfolioHref = normalizedPortfolio
    ? normalizedPortfolio.startsWith("http")
      ? normalizedPortfolio
      : `https://${normalizedPortfolio}`
    : null;
  const websiteHref = normalizedWebsite
    ? normalizedWebsite.startsWith("http")
      ? normalizedWebsite
      : `https://${normalizedWebsite}`
    : null;
  const linkedinHref = normalizedLinkedin
    ? normalizedLinkedin.startsWith("http")
      ? normalizedLinkedin
      : `https://linkedin.com/${normalizedLinkedin.replace(/^\/+/, "").replace(/^in\//, "in/")}`
    : null;
  const ownerCvHref = ownerCv
    ? ownerCv.startsWith("http")
      ? ownerCv
      : `/uploads/profiles/${ownerCv}`
    : null;

  // Formatear horarios
  const formatSchedule = () => {
    if (!p.schedule) return null;
    
    const days = [
      { key: 'monday', short: 'Lun', label: 'Lunes' },
      { key: 'tuesday', short: 'Mar', label: 'Martes' },
      { key: 'wednesday', short: 'Mié', label: 'Miércoles' },
      { key: 'thursday', short: 'Jue', label: 'Jueves' },
      { key: 'friday', short: 'Vie', label: 'Viernes' },
      { key: 'saturday', short: 'Sáb', label: 'Sábado' },
      { key: 'sunday', short: 'Dom', label: 'Domingo' }
    ];

    return days.map(({ key, short, label }) => {
      const day = p.schedule?.[key];
      let time = 'Cerrado';
      let isOpen = false;
      
      if (day?.fullDay) {
        time = '24h';
        isOpen = true;
      } else if (day?.morning?.enabled || day?.afternoon?.enabled) {
        const parts = [];
        if (day.morning?.enabled) parts.push(`${day.morning.start}-${day.morning.end}`);
        if (day.afternoon?.enabled) parts.push(`${day.afternoon.start}-${day.afternoon.end}`);
        time = parts.join(' / ');
        isOpen = true;
      }
      
      return { key, short, label, time, isOpen };
    });
  };

  const schedule = formatSchedule();
  const showDetailedSchedule = isOwner && !!schedule;
  const todayIndex = new Date().getDay();
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayKeys[todayIndex];

  // Generar structured data JSON-LD
  const baseUrl = getBaseUrl();
  const professionalStructuredData = generateProfessionalStructuredData({
    id: data.id,
    name: p.name,
    bio: p.bio,
    category: p.category,
    location: p.location,
    phone: p.phone || undefined,
    website: p.website || undefined,
    rating: p.rating,
    reviewCount: p.reviews,
    services: p.services.map(s => ({ title: s.title, description: s.description })),
    image: p.picture ? (p.picture.startsWith('http') ? p.picture : `${baseUrl}${p.picture.startsWith('/') ? '' : '/'}${p.picture}`) : undefined,
  });

  // Breadcrumbs
  const breadcrumbsData = generateBreadcrumbsStructuredData([
    { name: "Inicio", url: baseUrl },
    { name: "Profesionales", url: `${baseUrl}/profesionales` },
    { name: p.name, url: `${baseUrl}/profesionales/${id}` },
  ]);

  return (
    <>
      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsData) }}
      />
      
      <div className="min-h-screen bg-[#f8f9fa]">
      {/* Banner de perfil pendiente */}
      {showPendingOverlay && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white py-4 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Tu perfil está en revisión</p>
                  <p className="text-xs text-white/90">
                    Tu perfil está siendo revisado por nuestro equipo. Una vez aprobado, será visible públicamente.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="bg-white text-amber-600 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Registrar visita al perfil (cliente, throttled) */}
      <ProfileViewTracker professionalId={data.id} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#006F4B] via-[#007B54] to-[#00875A]">
        <div className="container mx-auto px-4 py-5 lg:py-6">
          {/* Back */}
          <Link 
            href="/profesionales" 
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver más profesionales
          </Link>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:p-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
            {/* Info principal */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
              <div className="relative inline-flex flex-shrink-0 self-start items-center justify-center">
                <ProfessionalAvatar
                  name={p.name}
                  profilePicture={p.picture || undefined}
                  className="h-24 w-24 ring-4 ring-white/20 shadow-xl lg:h-28 lg:w-28"
                />
                {p.verified && (
                  <div
                    className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-lg"
                    title="Certificado"
                    aria-label="Certificado"
                  >
                    <Image src="/verificado.png" alt="Certificado" width={24} height={24} className="h-6 w-6" />
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1 text-white">
                <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{p.name}</h1>
                {p.category && <p className="mt-1 text-base text-white/80 lg:text-lg">{p.category}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1.5 text-sm text-white">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.location || "Ceres, Santa Fe, Argentina"}
                  </span>
                  {p.years > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1.5 text-sm text-white">
                    <Award className="h-3.5 w-3.5" />
                    {p.years} anos de experiencia
                    </span>
                  )}
                  {p.reviews > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-3 py-1.5 text-sm text-white">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {p.rating.toFixed(1)} · {reviewsLabel}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
                    p.availability.isAvailable 
                      ? 'bg-green-400/25 text-green-50'
                      : 'bg-white/14 text-white'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${p.availability.isAvailable ? 'bg-green-300 animate-pulse' : 'bg-white/55'}`} />
                    {availabilityLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 lg:w-[280px] lg:self-center">
              {hasWhatsapp && (
                <a
                  href={mainWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#20BD5C]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Contactar por WhatsApp
                </a>
              )}
              {hasPhone && (
                <a
                  href={`tel:${p.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/12 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  aria-label={`Llamar a ${p.name}`}
                >
                  <Phone className="h-4 w-4" />
                  Llamar
                </a>
              )}
              {!hasWhatsapp && !hasPhone && (
                  <div className="px-1 py-2 text-sm text-white/80">
                    Los datos de contacto se estan actualizando. Mientras tanto, revisa la informacion del perfil.
                  </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8 pb-28 lg:pb-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          
          {/* Columna principal */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Card: Presentación + Qué hace */}
            <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
              {/* Bio */}
              <div className="border-b border-gray-100 px-6 py-6 lg:px-8">
                <h2 className="text-xl font-semibold text-gray-900">Sobre este profesional</h2>
                <p className="text-gray-700 leading-relaxed">{p.bio || 'Este profesional aún no ha agregado una descripción.'}</p>
              </div>
              
              {/* Servicios - Rediseñado */}
              <div className="px-6 py-6 lg:px-8">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                  {p.services.length === 1 ? 'Servicio' : 'Servicios'}
                    </h2>
                  </div>
                  {p.services.length > 1 && (
                    <Badge className="rounded-full border border-[#006F4B]/10 bg-[#006F4B]/5 px-3 py-1 text-[#006F4B] shadow-none hover:bg-[#006F4B]/5">
                      {p.services.length} servicios
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  {p.services.map((service, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-all hover:border-[#006F4B]/20 hover:bg-white">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#006F4B]">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                            {service.priceRange && (
                              <Badge className="rounded-full border border-[#006F4B]/10 bg-[#006F4B]/5 text-xs text-[#006F4B] shadow-none hover:bg-[#006F4B]/5">
                                {service.priceRange}
                              </Badge>
                            )}
                          </div>
                          {service.description ? (
                            <p className="text-gray-600 text-sm">{service.description}</p>
                          ) : (
                            <p className="text-gray-400 text-sm italic">Consultar por este servicio</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* CTA secundario */}
                <div className="mt-6 rounded-2xl border border-[#006F4B]/10 bg-[#006F4B]/5 p-4">
                  <p className="mb-2 text-sm font-medium text-gray-900">
                    <MessageCircle className="h-4 w-4 inline mr-1.5 text-[#006F4B]" />
                    ¿Necesitas alguno de estos servicios?
                  </p>
                  <p className="text-sm text-gray-600">
                    Coordina alcance, tiempos y presupuesto directamente con este profesional.
                  </p>
                  {servicesWhatsappLink && (
                    <a
                      href={servicesWhatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#006F4B]/15 bg-white px-4 py-2 text-sm font-medium text-[#006F4B] transition-colors hover:border-[#006F4B]/30"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Pedir presupuesto
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/*

            {/* Reseñas - Solo si hay */}
            {p.reviews > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Opiniones de clientes
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{p.rating.toFixed(1)}</div>
                    <div className="flex gap-0.5 justify-center mt-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-4 w-4 ${star <= p.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{p.reviews} reseñas</div>
                  </div>
                </div>
              </div>
            )}
            {/* Certificaciones - Solo si hay certificaciones aprobadas */}
            {p.certifications && p.certifications.length > 0 && (
              <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                <div className="mb-5">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Award className="h-5 w-5 text-[#006F4B]" />
                    Certificaciones profesionales
                  </h2>
                </div>
                <div className="space-y-4">
                  {p.certifications.map((cert) => {
                    const getCertificationTypeLabel = (type: string) => {
                      switch (type) {
                        case 'matricula':
                          return 'Matrícula Profesional';
                        case 'certificado':
                          return 'Certificado';
                        case 'licencia':
                          return 'Licencia';
                        case 'curso':
                          return 'Certificado de Curso';
                        default:
                          return 'Certificación';
                      }
                    };

                    return (
                      <div
                        key={cert.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Award className="h-4 w-4 text-[#006F4B]" />
                              <h3 className="font-semibold text-gray-900">
                                {getCertificationTypeLabel(cert.certificationType)}
                              </h3>
                            </div>
                            {cert.category && (
                              <p className="text-sm text-gray-600 mb-1">
                                Categoría: <span className="font-medium">{cert.category.name}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Número</p>
                            <p className="font-medium text-gray-900">{cert.certificationNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Organización emisora</p>
                            <p className="font-medium text-gray-900">{cert.issuingOrganization}</p>
                          </div>
                          {cert.issueDate && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Fecha de emisión</p>
                              <p className="font-medium text-gray-900">
                                {new Date(cert.issueDate).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                          {cert.expiryDate && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Fecha de vencimiento</p>
                              <p className="font-medium text-gray-900">
                                {new Date(cert.expiryDate).toLocaleDateString('es-AR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {cert.documentUrl && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <a
                              href={cert.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-[#006F4B] hover:underline font-medium"
                            >
                              <FileText className="h-4 w-4" />
                              Ver documento
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="self-start lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
              <h2 className="text-xl font-semibold text-gray-900">Contacto y datos del perfil</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Informacion practica para coordinar con {p.name.split(" ")[0]} sin salir de la ficha.
              </p>

              <div className="mt-6 space-y-6">
            
            {/* Contacto directo */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Phone className="h-5 w-5 text-[#006F4B]" />
                Contacto directo
              </h3>
              <div className="space-y-3">
                {hasPhone && (
                  <a 
                    href={`tel:${p.phone}`}
                    className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition-colors hover:bg-[#006F4B]/5 group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006F4B]/10 transition-colors group-hover:bg-[#006F4B]/15">
                      <Phone className="h-5 w-5 text-[#006F4B]" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{p.phone}</div>
                      <div className="text-xs text-gray-500">Llamar ahora</div>
                    </div>
                  </a>
                )}
                {/* Redes sociales */}
                {normalizedInstagram && (
                  <a
                    href={`https://instagram.com/${normalizedInstagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006F4B]/10">
                      <Instagram className="h-5 w-5 text-[#006F4B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Instagram</div>
                        <div className="text-xs text-gray-500 truncate">@{normalizedInstagram}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {normalizedFacebook && (
                  <a
                    href={`https://facebook.com/${normalizedFacebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006F4B]/10">
                      <Facebook className="h-5 w-5 text-[#006F4B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Facebook</div>
                        <div className="text-xs text-gray-500 truncate">{normalizedFacebook}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {linkedinHref && normalizedLinkedin && (
                  <a
                    href={linkedinHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006F4B]/10">
                      <Linkedin className="h-5 w-5 text-[#006F4B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">LinkedIn</div>
                        <div className="text-xs text-gray-500 truncate">{normalizedLinkedin}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {websiteHref && normalizedWebsite && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006F4B]/10">
                      <Globe className="h-5 w-5 text-[#006F4B]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Sitio web</div>
                        <div className="text-xs text-gray-500 truncate">{normalizedWebsite}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {!hasContactDetails && !hasWhatsapp && (
                  <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Este perfil todavia no publico canales adicionales de contacto.
                  </p>
                )}
                {hasWhatsapp && (
                  <a
                    href={mainWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#006F4B] hover:underline"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Escribir por WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Local Físico - Solo si tiene (moved to sidebar) */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MapPin className="h-5 w-5 text-[#006F4B]" />
                Ciudad y alcance
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#006F4B]" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Ciudad base</p>
                    <p className="text-sm font-medium text-gray-900">{p.location}</p>
                  </div>
                </div>
                {p.coverage.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tambien trabaja en</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.coverage.map((loc, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[#006F4B]/5 px-3 py-1.5 text-sm text-[#006F4B]">
                          <MapPin className="h-3.5 w-3.5" />
                          {loc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {data.hasPhysicalStore && data.physicalStoreAddress && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Store className="h-5 w-5 text-[#006F4B]" />
                  Ubicación
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900 font-medium">{data.physicalStoreAddress}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Horarios */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <CalendarDays className="h-5 w-5 text-[#006F4B]" />
                Disponibilidad
              </h3>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#006F4B] mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{availabilityLabel}</p>
                    <p className="mt-1 text-sm text-gray-600">{availabilityDescription}</p>
                    {p.holidays && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Atiende feriados
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {scheduleWhatsappLink && (
                <a
                  href={scheduleWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#006F4B] text-sm font-medium mt-3 hover:underline"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Consultar horario por WhatsApp
                </a>
              )}

              {showDetailedSchedule && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                    Vista privada del propietario
                  </p>
                  <div className="space-y-1">
                    {schedule.map(({ key, short, time, isOpen }) => {
                      const isToday = key === todayKey;
                      return (
                        <div 
                          key={key}
                          className={`flex justify-between items-center py-2 px-3 rounded-lg text-sm ${
                            isToday ? 'bg-[#006F4B]/10 font-medium' : ''
                          }`}
                        >
                          <span className={isToday ? 'text-[#006F4B]' : 'text-gray-700'}>
                            {short}
                            {isToday && <span className="ml-1 text-[10px] bg-[#006F4B] text-white px-1.5 py-0.5 rounded uppercase">Hoy</span>}
                          </span>
                          <span className={isOpen ? (isToday ? 'text-[#006F4B]' : 'text-gray-600') : 'text-gray-400'}>
                            {time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Perfil profesional */}
            {(p.portfolio || ownerCv) && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Briefcase className="h-5 w-5 text-[#006F4B]" />
                  Perfil profesional
                </h3>
                
                <div className="space-y-2">
                  {portfolioHref && (
                    <a
                      href={portfolioHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition-colors hover:bg-[#006F4B]/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006F4B]/10">
                        <Briefcase className="h-5 w-5 text-[#006F4B]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">Portfolio</span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  )}
                  {ownerCvHref && (
                    <a
                      href={ownerCvHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 transition-colors hover:bg-[#006F4B]/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006F4B]/10">
                        <FileText className="h-5 w-5 text-[#006F4B]" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">Curriculum Vitae (vista privada)</span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Sin reseñas aún - mensaje pequeño 
            {p.reviews === 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                <Star className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-sm text-amber-800 font-medium">Sé el primero en dejar una reseña</p>
                <p className="text-xs text-amber-600 mt-1">Ayuda a otros usuarios compartiendo tu experiencia</p>
              </div>
            )}
              */}

              </div>
            </div>
          </div>
        </div>
      </div>

      {(hasWhatsapp || hasPhone) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-md gap-3">
            {hasWhatsapp && (
              <a
                href={mainWhatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#20BD5C]"
              >
                Contactar
              </a>
            )}
            {hasPhone && (
              <a
                href={`tel:${p.phone}`}
                className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-[#006F4B]/30 hover:text-[#006F4B]"
              >
                Llamar
              </a>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
