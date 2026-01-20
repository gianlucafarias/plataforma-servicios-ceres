import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProfessionalAvatar } from "@/components/features/ProfessionalAvatar";
import { getLocations } from "@/lib/taxonomy";
import { 
  MapPin, 
  Clock, 
  Phone,
  Mail,
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
import WhatsAppIcon from "@/components/ui/whatsapp";
import { checkProfessionalAvailability } from "@/lib/availability";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import type { Metadata } from "next";
import { getBaseUrl, generateProfessionalStructuredData, generateBreadcrumbsStructuredData } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ProfileViewTracker } from "@/components/features/ProfileViewTracker";

type TimeSlot = {
  enabled: boolean;
  start: string;
  end: string;
};

type DaySchedule = {
  fullDay?: boolean;
  morning?: TimeSlot;
  afternoon?: TimeSlot;
  workOnHolidays?: boolean;
};

type ApiProfessional = {
  id: string;
  userId?: string;
  status?: 'pending' | 'active' | 'suspended';
  bio: string;
  experienceYears?: number;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  user: { firstName: string; lastName: string; email: string; phone?: string; verified?: boolean; image?: string; location?: string | null };
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  CV?: string;
  ProfilePicture?: string;
  location?: string;
  specialties?: string[];
  professionalGroup?: 'oficios' | 'profesiones';
  serviceLocations?: string[];
  hasPhysicalStore?: boolean;
  physicalStoreAddress?: string;
  schedule?: Record<string, DaySchedule>;
  services: { title: string; description?: string; priceRange?: string; category?: { name?: string; slug?: string } }[];
  certifications?: Array<{
    id: string;
    certificationType: string;
    certificationNumber: string;
    issuingOrganization: string;
    issueDate: string | null;
    expiryDate: string | null;
    documentUrl: string | null;
    category?: { id: string; name: string; slug: string } | null;
  }>;
};

// Función helper para obtener datos del profesional directamente desde la BD
async function getProfessionalData(id: string): Promise<ApiProfessional | null> {
  const professional = await prisma.professional.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      bio: true,
      experienceYears: true,
      verified: true,
      rating: true,
      reviewCount: true,
      specialties: true,
      professionalGroup: true,
      whatsapp: true,
      instagram: true,
      facebook: true,
      linkedin: true,
      website: true,
      portfolio: true,
      CV: true,
      ProfilePicture: true,
      location: true,
      serviceLocations: true,
      hasPhysicalStore: true,
      physicalStoreAddress: true,
      schedule: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          verified: true,
          image: true,
          location: true,
        },
      },
      services: {
        where: { available: true },
        orderBy: { createdAt: "asc" },
        include: {
          category: { select: { name: true, slug: true } },
        },
      },
      certifications: {
        where: { status: "approved" },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!professional) return null;

  return professional as unknown as ApiProfessional;
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

  const data = await getProfessionalData(id);
  
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No se encontró el profesional.</p>
          <Link href="/profesionales" className="inline-flex items-center gap-2 text-[#006F4B] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a profesionales
          </Link>
        </div>
      </div>
    );
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
    verified: !!(data.user.verified || data.verified),
    rating: data.rating ?? 0,
    reviews: data.reviewCount ?? 0,
    category: data.services[0]?.category?.name,
    phone: data.user.phone || "",
    email: data.user.email,
    whatsapp: data.whatsapp || data.user.phone || "",
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
    cv: data.CV,
    schedule: data.schedule,
    holidays: data.schedule?.monday?.workOnHolidays || false,
    certifications: data.certifications || [],
  };

  const mainWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, vi tu perfil en Ceres en Red y me gustaría contactarte.`
  );

  const servicesWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, vi tu perfil en Ceres en Red y me gustaría consultar por tus servicios.`
  );

  const scheduleWhatsappLink = buildWhatsAppLink(
    p.whatsapp,
    `Hola ${p.name}, quería consultar tu disponibilidad horaria.`
  );

  
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
    phone: p.phone,
    email: p.email,
    website: p.website,
    rating: p.rating,
    reviewCount: p.reviews,
    services: p.services.map(s => ({ title: s.title, description: s.description })),
    image: p.picture ? (p.picture.startsWith('http') ? p.picture : `${baseUrl}${p.picture.startsWith('/') ? '' : '/'}${p.picture}`) : undefined,
  });

  // Breadcrumbs
  const breadcrumbsData = generateBreadcrumbsStructuredData([
    { name: "Inicio", url: baseUrl },
    { name: "Profesionales", url: `${baseUrl}/servicios` },
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

      {/* Hero compacto */}
      <div className="bg-gradient-to-r from-[#006F4B] to-[#00875A]">
        <div className="container mx-auto px-4 py-6">
          {/* Back */}
          <Link 
            href="/profesionales" 
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver más profesionales
          </Link>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Info principal */}
            <div className="flex gap-4 lg:gap-6 flex-1">
              <div className="relative inline-flex flex-shrink-0 self-start items-center justify-center">
                <ProfessionalAvatar
                  name={p.name}
                  profilePicture={p.picture}
                  className="h-24 w-24 lg:h-28 lg:w-28 ring-4 ring-white/20 shadow-xl"
                />
                {p.verified && (
                  <div
                    className="absolute -bottom-1 -right-1 lg:-bottom-1 lg:-right-1 bg-white rounded-full p-0.5 shadow-lg z-10"
                    title="Certificado"
                    aria-label="Certificado"
                  >
                    <Image src="/verificado.png" alt="Certificado" width={24} height={24} className="w-6 h-6 lg:w-6 lg:h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 text-white">
                <h1 className="text-2xl lg:text-3xl font-bold mb-1">{p.name}</h1>
                <p className="text-white/80 text-lg mb-3">{p.category}</p>
                
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.location || "Ceres, Santa Fe, Argentina"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Award className="h-3.5 w-3.5" />
                    {p.years} años exp.
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                    p.availability.isAvailable 
                      ? 'bg-green-400/30 text-green-100' 
                      : 'bg-white/15'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${p.availability.isAvailable ? 'bg-green-400 animate-pulse' : 'bg-white/50'}`} />
                    {p.availability.isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 w-full lg:w-auto">
              {mainWhatsappLink && (
                <a
                  href={mainWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-[#006F4B] hover:bg-gray-50 py-3 px-6 rounded-xl font-bold transition-all shadow-lg"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  <span>Contactar</span>
                </a>
              )}
              <a
                href={`tel:${p.phone}`}
                className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white py-3 px-4 rounded-xl font-medium transition-all border border-white/20"
                title="Llamar"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Card: Presentación + Qué hace */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Bio */}
              <div className="p-6 border-b border-gray-100">
                <p className="text-gray-700 leading-relaxed">{p.bio || 'Este profesional aún no ha agregado una descripción.'}</p>
              </div>
              
              {/* Servicios - Rediseñado */}
              <div className="p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {p.services.length === 1 ? 'Servicio' : 'Servicios'}
                </h2>
                
                <div className="space-y-3">
                  {p.services.map((service, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-[#006F4B]/5 to-transparent border border-[#006F4B]/10 hover:border-[#006F4B]/30 transition-all">
                        <div className="h-10 w-10 rounded-lg bg-[#006F4B] flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{service.title}</h3>
                            {service.priceRange && (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 text-xs">
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
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <MessageCircle className="h-4 w-4 inline mr-1.5 text-[#006F4B]" />
                    ¿Necesitas alguno de estos servicios?
                  </p>
                  {servicesWhatsappLink && (
                    <a
                      href={servicesWhatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#20BD5C] transition-colors"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Pedir presupuesto
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Zona de cobertura */}
            {p.coverage.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#006F4B]" />
                  También trabaja en
                </h2>
                <div className="flex flex-wrap gap-2">
                  {p.coverage.map((loc, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#006F4B]" />
                  Certificaciones profesionales
                </h2>
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
                        className="p-4 rounded-xl border border-gray-200 bg-white"
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
          <div className="space-y-5">
            
            {/* Contacto directo */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#006F4B]" />
                Contacto directo
              </h3>
              <div className="space-y-3">
                <a 
                  href={`tel:${p.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-[#006F4B]/10 flex items-center justify-center group-hover:bg-[#006F4B]/20 transition-colors">
                    <Phone className="h-5 w-5 text-[#006F4B]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{p.phone}</div>
                    <div className="text-xs text-gray-500">Llamar ahora</div>
                  </div>
                </a>
                <a 
                  href={`mailto:${p.email}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-full bg-[#006F4B]/10 flex items-center justify-center group-hover:bg-[#006F4B]/20 transition-colors">
                    <Mail className="h-5 w-5 text-[#006F4B]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-sm">{p.email}</div>
                    <div className="text-xs text-gray-500">Enviar email</div>
                  </div>
                </a>

                {/* Redes sociales */}
                {p.instagram && (
                  <a
                    href={`https://instagram.com/${p.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Instagram className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Instagram</div>
                      <div className="text-xs text-gray-500 truncate">{p.instagram}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {p.facebook && (
                  <a
                    href={`https://facebook.com/${p.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Facebook</div>
                      <div className="text-xs text-gray-500 truncate">{p.facebook}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {p.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${p.linkedin.replace('/in/', '').replace('/', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center">
                      <Linkedin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">LinkedIn</div>
                      <div className="text-xs text-gray-500 truncate">{p.linkedin}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
                {p.website && (
                  <a
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#006F4B]/5 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">Sitio web</div>
                      <div className="text-xs text-gray-500 truncate">{p.website}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Local Físico - Solo si tiene (moved to sidebar) */}
            {data.hasPhysicalStore && data.physicalStoreAddress && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#006F4B]" />
                Horarios
              </h3>
              
              {schedule ? (
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
                  {p.holidays && (
                    <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Atiende feriados
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Consultar disponibilidad</p>
                  {scheduleWhatsappLink && (
                    <a
                      href={scheduleWhatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#006F4B] text-sm font-medium mt-2 hover:underline"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      Preguntar
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Perfil profesional */}
            {(p.portfolio || p.cv) && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-[#006F4B]" />
                  Perfil profesional
                </h3>
                
                <div className="space-y-2">
                  {p.portfolio && (
                    <a
                      href={p.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">Portfolio</span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  )}
                  {p.cv && (
                    <a
                      href={
                        p.cv.startsWith('http')
                          ? p.cv
                          : `/uploads/profiles/${p.cv}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-lg bg-red-500 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">Curriculum Vitae</span>
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
    </>
  );
}
