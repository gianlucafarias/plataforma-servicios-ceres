import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ReviewSection } from "@/components/features/ReviewSection";
import { ProfessionalAvatar } from "@/components/features/ProfessionalAvatar";
import { getLocations } from "@/lib/taxonomy";
import { 
  MapPin, 
  Clock, 
  Phone,
  Mail,
  Award,
  CheckCircle,
  Instagram,
  Facebook,
  ExternalLink,
  Linkedin,
  Globe,
  FileText
} from "lucide-react";
import Link from "next/link";
import WhatsAppIcon from "@/components/ui/whatsapp";
import type { Review as AppReview } from "@/types";
import { checkProfessionalAvailability } from "@/lib/availability";

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
  bio: string;
  experienceYears?: number;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  user: { firstName: string; lastName: string; email: string; phone?: string; verified?: boolean };
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
  schedule?: Record<string, DaySchedule>;
  services: { title: string; description?: string; priceRange?: string; category?: { name?: string; slug?: string } }[];
};

export default async function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;

  let data: ApiProfessional | null = null;
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(new URL(`/api/professional/${id}`, baseUrl), { cache: 'no-store' });
    const json: { success: boolean; data?: ApiProfessional } = await res.json();
    if (!json?.success || !json?.data) {
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <p className="text-center text-gray-600">Error al cargar el profesional.</p>
          </div>
        </div>
      );
    }
    data = json.data;
  } catch (error) {
    console.error('Error fetching professional:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600">Error al cargar el profesional.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  type SocialNetworks = { 
    instagram?: string; 
    facebook?: string; 
    website?: string;
    linkedin?: string;
    portfolio?: string;
    cv?: string;
    profilePicture?: string;
  };

  // Función para formatear los horarios
  const formatSchedule = (scheduleData: Record<string, DaySchedule>) => {
    const daysMap = {
      monday: "Lunes",
      tuesday: "Martes", 
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo"
    };

    const formattedHours: Record<string, string> = {};

    Object.entries(daysMap).forEach(([dayKey]) => {
      const daySchedule = scheduleData[dayKey];
      
      if (!daySchedule) {
        formattedHours[dayKey] = "No disponible";
        return;
      }

      if (daySchedule.fullDay) {
        formattedHours[dayKey] = "24 horas";
        return;
      }

      const morning = daySchedule.morning?.enabled 
        ? `${daySchedule.morning.start} - ${daySchedule.morning.end}`
        : null;
      
      const afternoon = daySchedule.afternoon?.enabled
        ? `${daySchedule.afternoon.start} - ${daySchedule.afternoon.end}`
        : null;

      if (morning && afternoon) {
        formattedHours[dayKey] = `${morning} / ${afternoon}`;
      } else if (morning) {
        formattedHours[dayKey] = morning;
      } else if (afternoon) {
        formattedHours[dayKey] = afternoon;
      } else {
        formattedHours[dayKey] = "No disponible";
      }
    });

    return formattedHours;
  };

  // Verificar disponibilidad actual
  const availability = checkProfessionalAvailability(data.schedule);

  const professional = {
    id: data.id,
    bio: data.bio,
    experienceYears: data.experienceYears ?? 0,
    verified: !!(data.user.verified || data.verified),
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
    professionalGroup: data.professionalGroup,
    specialties: Array.isArray(data.specialties) ? data.specialties : [],
    user: {
      name: `${data.user.firstName} ${data.user.lastName}`.trim(),
      email: data.user.email,
      phone: data.user.phone || "",
      whatsapp: data.whatsapp || data.user.phone || "",
    },
    location: data.location || "",
    serviceLocations: data.serviceLocations || [],
    services: (data.services || []).map((s: { title: string; description?: string; priceRange?: string; category?: { name?: string; slug?: string } }) => ({
      title: s.title,
      description: s.description,
      priceRange: s.priceRange,
      category: s.category,
    })),
    socialNetworks: {
      instagram: data.instagram,
      facebook: data.facebook,
      website: data.website,
      linkedin: data.linkedin,
      portfolio: data.portfolio,
      cv: data.CV,
      profilePicture: data.ProfilePicture,
    } as SocialNetworks,
    workingHours: data.schedule ? formatSchedule(data.schedule) : {
      monday: "Todo el día",
      tuesday: "Todo el día",
      wednesday: "Todo el día",
      thursday: "Todo el día",
      friday: "Todo el día",
      saturday: "Todo el día",
      sunday: "Todo el día",
    },
    workOnHolidays: data.schedule?.monday?.workOnHolidays || false,
    availability: availability,
  };

  const reviews: AppReview[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 sm:mb-6 overflow-x-auto">
            <Link href="/" className="hover:text-[#006F4B] whitespace-nowrap">Inicio</Link>
            <span>/</span>
            <Link href="/profesionales" className="hover:text-[#006F4B] whitespace-nowrap">Profesionales</Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{professional.user.name}</span>
          </nav>

          {/* Header del profesional */}
          <Card className="rounded-2xl border border-gray-100 mb-8 py-0">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 rounded-t-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-[var(--gov-green)]/5 to-[var(--gov-yellow)]/10 p-4 sm:p-6 lg:p-8 pb-8 sm:pb-10 mb-5">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
                    <div className="lg:col-span-2">
                      <div className="flex flex-row items-start gap-5 sm:gap-8">
                        <div className="relative group">
                          <ProfessionalAvatar
                            name={professional.user.name}
                            profilePicture={professional.socialNetworks.profilePicture}
                            className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 mx-auto sm:mx-0 flex-shrink-0 ring-4 ring-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="flex-1 min-w-0 sm:ml-2 mt-1 sm:mt-2">
                          <div className="flex items-start justify-between">
                            <div className="text-left w-full">
                              <div className="flex flex-row items-center gap-2 sm:gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-rutan mb-1 sm:mb-0 tracking-tight">
                                  {professional.user.name}
                                </h1>
                                {professional.verified && (
                                  <Image src="/verificado.png" alt="Verified" width={20} height={20} className="drop-shadow-sm" />
                                )}
                              </div>
                              {professional.services[0]?.category?.name && (
                                <div className="mt-3">
                                  <Badge variant="secondary" className="rounded-full text-xs bg-white/80 backdrop-blur-sm text-gray-700 border border-white/50 shadow-sm px-3 py-1">
                                    {professional.services[0]?.category?.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                            
                            
                            <div className="flex items-center justify-start gap-2 text-gray-700">
                              <MapPin className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {professional.location ? getLocations().find(l => l.id === professional.location)?.name || professional.location : 'Ubicación no especificada'}
                                </span>
                                {professional.serviceLocations && professional.serviceLocations.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {professional.serviceLocations.includes('all-region') ? (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        Toda la región
                                      </span>
                                    ) : (
                                      professional.serviceLocations.map((locationId) => {
                                        const location = getLocations().find(l => l.id === locationId);
                                        return location ? (
                                          <span key={locationId} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {location.name}
                                          </span>
                                        ) : null;
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-start gap-2 text-gray-700">
                              <Award className="h-4 w-4" />
                              <span>{professional.experienceYears} año{professional.experienceYears === 1 ? '' : 's'} de experiencia</span>
                            </div>
                            <div className={`flex items-center justify-start gap-2 sm:col-span-2 ${professional.availability.isAvailable ? 'text-green-700' : 'text-gray-500'}`}>
                              <Clock className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">{professional.availability.status}</span>
                                {professional.availability.reason && !professional.availability.isAvailable && (
                                  <span className="text-xs opacity-80">{professional.availability.reason}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <a
                          href={`https://wa.me/${professional.user.whatsapp}?text=Hola ${professional.user.name}, vi tu perfil en Servicios Ceres y me interesa contactarte.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#25D366] hover:bg-[#20BD5C] text-white py-3.5 px-6 rounded-full font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center shadow-md shadow-green-500/10"
                        >
                          <span className="hidden sm:inline">Contactar por WhatsApp</span>
                          <span className="sm:hidden">WhatsApp</span>
                          <WhatsAppIcon className="h-5 w-5 ml-2" />
                        </a>
                        <a
                          href={`tel:${professional.user.phone}`}
                          className="w-14 h-14 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                          title="Llamar por teléfono"
                        >
                          <Phone className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 mt-0">
				{/* Descripción y servicios debajo de la cabecera, ocupando todo el ancho */}
				<div className="lg:col-span-2 mt-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 font-rutan text-left">Descripción</h3>

				  <p className="text-gray-700 leading-relaxed text-left">
					{professional.bio}
				  </p>

				  <div className="mt-6">
					<h3 className="text-lg font-semibold text-gray-900 mb-3 font-rutan text-left">Servicios ofrecidos</h3>
					<div className="space-y-3">
					  {professional.services.map((service, index) => (
						<Card key={index} className="rounded-2xl border border-gray-100 bg-white hover:border-green-100 hover:shadow-sm transition-all duration-200">
						  <CardContent className="p-4">
							<div className="flex items-start gap-3">
							  <div className="mt-0.5 bg-green-50 p-1.5 rounded-full">
							    <CheckCircle className="h-4 w-4 text-[var(--gov-green)]" />
							  </div>
							  <div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-3">
								  <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{service.title}</p>
								  {service.priceRange && (
									<Badge variant="secondary" className="text-xs font-normal bg-gray-50 text-gray-600 border-gray-100 whitespace-nowrap rounded-full">
									  {service.priceRange}
									</Badge>
								  )}
								</div>
								{service.description && (
								  <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
									{service.description}
								  </p>
								)}
							  </div>
							</div>
						  </CardContent>
						</Card>
					  ))}
					</div>
				  </div>

				  {/* Sección de cobertura de servicios */}
				  <div className="mt-8">
					<h3 className="text-lg font-semibold text-gray-900 mb-4 font-rutan text-left">Ofrece sus servicios en:</h3>
					<Card className="rounded-2xl p-6 border-gray-100 shadow-none bg-gray-50/50">
					  <CardContent className="p-0">
            <div className="flex items-start gap-3">
						<div className="flex-1">
						  {/* Ubicación principal */}
						  <div className="mb-4">
							<span className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
							  <MapPin className="h-4 w-4 text-[var(--gov-green)]" />
							  {professional.location ? getLocations().find(l => l.id === professional.location)?.name || professional.location : 'No especificada'}
							</span>
						  </div>

						  {/* Cobertura de servicios */}
						  {professional.serviceLocations && professional.serviceLocations.length > 0 ? (
							<div>
							  <p className="text-sm text-gray-500 mb-3 font-medium">También atiende en:</p>
							  <div className="flex flex-wrap gap-2">
								{professional.serviceLocations.includes('all-region') ? (
								  <span className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm shadow-green-200">
									<MapPin className="h-3.5 w-3.5" />
								Toda la región
								  </span>
								) : (
								  professional.serviceLocations
									.filter(locationId => locationId !== professional.location) // No mostrar la ubicación principal de nuevo
									.map((locationId) => {
									  const location = getLocations().find(l => l.id === locationId);
									  return location ? (
										<span key={locationId} className="inline-flex items-center gap-2 bg-white border border-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
										  <MapPin className="h-3.5 w-3.5 text-blue-500" />
										  {location.name}
										</span>
									  ) : null;
									})
								)}
							  </div>
							</div>
						  ) : (
							<div className="text-sm text-gray-500 italic">
							  Solo atiende en su ubicación principal
							</div>
						  )}
						</div>
					  </div>
            </CardContent>
					</Card>
				  </div>
				</div>

                {/* Sidebar con acciones */}
                <div className="space-y-4 lg:pl-2">
                  {/* Botones de contacto directo */}
                  
                  
                      <h3 className="font-semibold text-gray-900 mb-3 text-left">Información de contacto</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-start gap-3 text-gray-700 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                          <div className="bg-green-50 p-2 rounded-full">
                            <Phone className="h-4 w-4 text-[#006F4B]" />
                          </div>
                          <span className="break-all font-medium">{professional.user.phone}</span>
                        </div>
                        <div className="flex items-center justify-start gap-3 text-gray-700 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                          <div className="bg-green-50 p-2 rounded-full">
                            <Mail className="h-4 w-4 text-[#006F4B]" />
                          </div>
                          <span className="break-all text-xs sm:text-sm font-medium">{professional.user.email}</span>
                        </div>
                      </div>

                      {/* Horarios */}
                      <div className="mt-4">
                        <h3 className="font-semibold text-gray-900 mb-3 text-left">Horarios</h3>
                        <div className="space-y-1 text-xs">
                          {Object.entries({
                            "Lunes": professional.workingHours.monday,
                            "Martes": professional.workingHours.tuesday,
                            "Miércoles": professional.workingHours.wednesday,
                            "Jueves": professional.workingHours.thursday,
                            "Viernes": professional.workingHours.friday,
                            "Sábado": professional.workingHours.saturday,
                            "Domingo": professional.workingHours.sunday,
                          }).map(([day, hours]) => {
                            // Determinar si es el día actual
                            const today = new Date();
                            const dayMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                            const isToday = day === dayMap[today.getDay()];
                            
                            return (
                              <div 
                                key={day} 
                                className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                                  isToday 
                                    ? 'bg-green-50 border border-green-200' 
                                    : ''
                                }`}
                              >
                                <span className={`font-medium ${isToday ? 'text-green-800' : 'text-gray-700'}`}>
                                  {day}
                                  {isToday && <span className="ml-1 text-green-600">•</span>}
                                </span>
                                <span className={`text-xs ${hours === "No disponible" ? "text-gray-500" : "text-green-600"}`}>
                                  {hours}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {professional.workOnHolidays && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-green-800">
                              <span className="font-semibold">También trabaja en días feriados</span>
                            </p>
                          </div>
                        )}
                      </div>
                  

                  {/* Redes sociales y perfil profesional */}
                  {(professional.socialNetworks.instagram || professional.socialNetworks.facebook || professional.socialNetworks.website || professional.socialNetworks.linkedin || professional.socialNetworks.portfolio || professional.socialNetworks.cv) && (
                   <div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-center lg:text-left">Redes sociales y perfil profesional</h3>
                        <div className="space-y-2">
                          {professional.socialNetworks.instagram && (
                            <a
                              href={`https://instagram.com/${professional.socialNetworks.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700 transition-all justify-center lg:justify-start shadow-sm"
                            >
                              <Instagram className="h-4 w-4 text-pink-600" />
                              <span className="text-sm font-medium">{professional.socialNetworks.instagram}</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                          {professional.socialNetworks.facebook && (
                            <a
                              href={`https://facebook.com/${professional.socialNetworks.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all justify-center lg:justify-start shadow-sm"
                            >
                              <Facebook className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">{professional.socialNetworks.facebook}</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                          {professional.socialNetworks.linkedin && (
                            <a
                              href={`https://linkedin.com/in/${professional.socialNetworks.linkedin.replace('/in/', '').replace('/', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all justify-center lg:justify-start shadow-sm"
                            >
                              <Linkedin className="h-4 w-4 text-blue-700" />
                              <span className="text-sm font-medium">LinkedIn</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                          {professional.socialNetworks.website && (
                            <a
                              href={professional.socialNetworks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all justify-center lg:justify-start shadow-sm"
                            >
                              <Globe className="h-4 w-4 text-[#006F4B]" />
                              <span className="text-sm font-medium">Sitio web</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                          {professional.socialNetworks.portfolio && (
                            <a
                              href={professional.socialNetworks.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all justify-center lg:justify-start shadow-sm"
                            >
                              <Globe className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Portfolio</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                          {professional.socialNetworks.cv && (
                            <a
                              href={`/uploads/profiles/${professional.socialNetworks.cv}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-gray-700 rounded-full border border-gray-200 bg-white px-4 py-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all justify-center lg:justify-start cursor-pointer shadow-sm"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Ver CV</span>
                              <ExternalLink className="h-3 w-3 opacity-50" />
                            </a>
                          )}
                        </div>
                        </div>
                  )}


                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Reseñas */}
          <div className="mt-8">
            <ReviewSection 
              reviews={reviews}
              averageRating={professional.rating}
              totalReviews={professional.reviewCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
