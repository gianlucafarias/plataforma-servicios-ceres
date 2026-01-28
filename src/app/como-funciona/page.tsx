"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Wrench,
  LayoutDashboard,
  Award,
  MapPin,
  Calendar,
  Settings,
  GraduationCap,
  ChevronDown,
  Search,
  Star,
  User,
  UserPlus,
  Bell,
  Verified,
  Car,
  Snowflake,
  Bolt,
  TreePine,
  Shield,
  DollarSign,
  BriefcaseBusiness,
} from "lucide-react";
import { CategorySuggestionModal } from "@/components/features/CategorySuggestionModal";
import { SupportContactModal } from "@/components/features/SupportContactModal";
import { AREAS_OFICIOS, SUBCATEGORIES_OFICIOS, SUBCATEGORIES_PROFESIONES } from "@/lib/taxonomy";
import { CategoryItem } from "@/components/features/CategoryItem";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";

const pasosVecinos = [
  {
    title: "Buscá el servicio",
    description: "Explorá las categorías o usá el buscador para encontrar exactamente lo que necesitás. No necesitas registrarte.",
    icon: Search,
  },
  {
    title: "Revisá perfiles",
    description: "Visitá el perfil del profesional y revisá su información, experiencia y certificaciones.",
    icon: Star,
  },
  {
    title: "Contactá directo",
    description: "Envía un mensaje por WhatsApp o llamá directamente al profesional. Sin intermediarios.",
    icon: MessageCircle,
  },
];

const pasosProfesionales = [
  {
    title: "Creá tu perfil",
    description: "Cargá tu información, servicios y zonas y horarios de trabajo.",
    icon: UserPlus,
  },
  {
    title: "Recibí solicitudes",
    description: "No necesitás ingresar a la plataforma, tus clientes te contactan directo a tu Whatsapp.",
    icon: Bell,
  },
  {
    title: "Certificá tus servicios",
    description: "Cargá tus certificados para mostrar un sello de confianza en tu perfil.",
    icon: Verified,
  },
];

const faqs = [
  {
    question: "¿Es gratis registrarse como profesional?",
    answer: "Sí, el registro y la publicación de servicios básicos son completamente gratuitos. No cobramos comisiones por los trabajos que consigas.",
  },
  {
    question: "¿Cómo verifican a los profesionales?",
    answer: "Solicitamos documentación oficial y realizamos una validación manual de matrículas y certificaciones para garantizar la seguridad de la comunidad.",
  },
  {
    question: "¿Qué hago si tengo un inconveniente con un servicio?",
    answer: "Recomendamos contactar primero al profesional. Si no se resuelve, podés utilizar nuestro canal de soporte para recibir asesoramiento.",
  },
];

export default function ComoFuncionaPage() {
  const router = useRouter();
  const [isOficiosModalOpen, setIsOficiosModalOpen] = useState(false);
  const [isProfesionesModalOpen, setIsProfesionesModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const handleCategorySelect = (slug: string) => {
    setSelectedArea(slug);
    setSelectedCategory("all");
  };

  const handleSubcategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    // Cerrar los modales
    setIsOficiosModalOpen(false);
    setIsProfesionesModalOpen(false);
    // Navegar a la página de servicios con la categoría seleccionada
    router.push(`/servicios?subcategoria=${slug}`);
  };

  const handleOficiosClick = () => {
    setIsOficiosModalOpen(true);
  };

  const handleProfesionesClick = () => {
    setIsProfesionesModalOpen(true);
  };
  return (
    <div className="relative overflow-hidden  dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Hero */}
      <section className="relative pt-20 pb-20 md:pb-12 overflow-hidden bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white dark:text-white mb-6">
            Conectamos profesionales<br/>
            <span className="text-white">con vecinos</span>
          </h1>
          <p className="text-lg md:text-xl text-white dark:text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Ceres en Red es la plataforma oficial para encontrar profesionales confiables y técnicos calificados en Ceres y región. Rápido, seguro y local.
          </p>
        </div>
      </section>

      {/* Cards - Desacopladas del hero */}
      <div className="relative -mt-24 md:-mt-20 z-30 max-w-4xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
              <User className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Para vecinos</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Encontrá ayuda confiable cerca tuyo. Habla directo con perfiles validados por el municipio.
            </p>
            <Link href="#vecinos" className="inline-flex items-center text-primary font-semibold text-sm hover:underline decoration-2 underline-offset-4">
              Ver más <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
          <div className="group bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
              <BriefcaseBusiness className="h-7 w-7" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Para profesionales</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Publicá gratis, validá tu perfil y recibí consultas sin comisiones ni intermediarios.
            </p>
            <Link href="#profesionales" className="inline-flex items-center text-primary font-semibold text-sm hover:underline decoration-2 underline-offset-4">
              Ver más <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Vecinos */}
      <section className="pt-20 pb-24 bg-white dark:bg-gray-900/50 relative z-20" id="vecinos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-2 block">Para los vecinos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">¿Cómo encontrar un profesional?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-10 mb-20">
            {pasosVecinos.map((paso) => {
              const Icon = paso.icon;
              return (
                <div key={paso.title} className="relative pl-4">
                  <div className="text-primary mb-4">
                    <Icon className="h-10 w-10" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{paso.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {paso.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Beneficios para vecinos */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">¿Por qué elegir Ceres en Red?</h3>
              <p className="text-gray-500 dark:text-gray-400">Ventajas de usar la plataforma oficial</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Verificación municipal</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Todos los profesionales están verificados por el municipio para tu seguridad.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">100% gratis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Buscá y contactá profesionales sin pagar comisiones ni costos ocultos.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Contacto directo</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hablá directamente con el profesional por WhatsApp. Sin intermediarios.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Profesionales locales</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Encontrá técnicos y profesionales de Ceres y la región cerca de tu zona.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

     

      {/* Profesionales */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900" id="profesionales">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-2 block">Para profesionales</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">¿Cómo funciona la plataforma?</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Ceres en Red conecta tu talento con vecinos que necesitan tus servicios. Totalmente gratis y sin comisiones.
            </p>
          </div>

            {/* División Oficios / Profesiones */}
          <div className="mb-20">
          <div className="mb-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Dos formas de participar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">La plataforma se divide en dos grupos según tu tipo de servicio</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <button
              type="button"
              onClick={handleOficiosClick}
              className='bg-primary/5 dark:bg-gray-800/50 rounded-3xl p-8 md:p-12 border border-primary/20 dark:border-gray-700  hover:shadow-lg transition-all duration-300 text-left cursor-pointer w-full'
              >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-md">
                  <Wrench className="h-6 w-6" aria-hidden="true" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Oficios</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                Para trabajos manuales y técnicos: plomería, electricidad, albañilería, carpintería, pintura, jardinería, mecánica y más.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="text-primary mr-2 text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Servicios prácticos y técnicos
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="text-primary mr-2 text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Certificaciones técnicas opcionales
                </li>
              </ul>
              <div className="mt-6 flex justify-end">
                <span className="inline-flex items-center text-primary font-semibold text-sm hover:underline decoration-2 underline-offset-4 transition-all">
                  Ver categorías <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={handleProfesionesClick}
              className='bg-primary/5 dark:bg-gray-800/50 rounded-3xl p-8 md:p-12 border border-primary/20 dark:border-gray-700  hover:shadow-lg transition-all duration-300 text-left cursor-pointer w-full'
              >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-md">
                  <GraduationCap className="h-6 w-6" aria-hidden="true" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Profesiones</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                Para servicios profesionales: abogados, contadores, arquitectos, diseñadores, psicólogos, nutricionistas y más.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="text-primary mr-2 text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Servicios profesionales y consultoría
                </li>
                <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="text-primary mr-2 text-lg flex-shrink-0 mt-0.5" aria-hidden="true" />
                  Matrículas y títulos habilitantes
                </li>
              </ul>
              <div className="mt-6 flex justify-end">
                <span className="inline-flex items-center text-primary font-semibold text-sm hover:underline decoration-2 underline-offset-4 transition-all">
                  Ver categorías <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                </span>
              </div>
            </button>
          </div>
          </div>

          {/* Pasos principales */}
          <div className="mt-24">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">Empezá en 3 pasos</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {pasosProfesionales.map((paso, idx) => {
              const Icon = paso.icon;
              return (
                <div key={paso.title} className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                  <span className="absolute top-2 right-4 text-9xl font-bold text-gray-100 dark:text-gray-700/50 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none">{idx + 1}</span>
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{paso.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{paso.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          </div>

          {/* Dashboard y herramientas */}
          <div className="mt-24">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Tu Panel: todo en un solo lugar</h3>
            <p className="text-gray-500 dark:text-gray-400">Gestioná tu perfil y servicios desde una interfaz simple e intuitiva</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold  text-gray-900 dark:text-white text-base mb-2">Vista general</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Estadísticas de visitas, solicitudes y actividad de tu perfil en tiempo real.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Wrench className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Gestionar servicios</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Agregá, editá o desactivá tus servicios. Definí precios y descripciones detalladas.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Award className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Certificaciones</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Subí tus matrículas y certificados para mostrar el sello de confianza en tu perfil.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Zonas de trabajo</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Indicá en qué localidades o barrios trabajás para aparecer en más búsquedas.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Horarios</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Configurá tus días y horarios de atención para que los vecinos sepan cuándo contactarte.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border dark:border-gray-800 border-primary/20 dark:hover:bg-gray-800/50 transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <Settings className="h-5 w-5" aria-hidden="true" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-base mb-2">Configuración</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Actualizá tu perfil, redes sociales, foto y toda tu información personal.
              </p>
            </div>
          </div>
          </div>

          
        </div>
      </section>

      {/* CTA sugerencias generales y contacto con soporte */}
      <section className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            ¿Necesitás ayuda o querés proponer mejoras?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Si tenés dudas sobre cómo funciona la plataforma, encontraste un problema o querés sugerir
            nuevas categorías y mejoras, podés escribirnos o enviarnos tu idea.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <SupportContactModal
              origin="como_funciona_support"
              triggerClassName="bg-primary hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
              triggerLabel="Contactar soporte"
            />
            <CategorySuggestionModal
              origin="como_funciona_category_suggestion"
              triggerClassName="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-all"
              triggerLabel="Sugerir categoría"
            />
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                <summary className="flex justify-between items-center p-5 cursor-pointer list-none">
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                  <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0" aria-hidden="true" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto bg-gray-900 dark:bg-black rounded-3xl p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary blur-[120px] rounded-full mix-blend-screen"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">¿Listo para empezar?</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">Unite a la comunidad de Ceres en Red y encontrá lo que necesitás o hacé crecer tu oficio hoy mismo.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/servicios"
                className="bg-primary hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
              >
                Buscar un Profesional
              </Link>
              <Link
                href="/auth/registro"
                className="bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg transition-all"
              >
                Crear mi Perfil Gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Oficios */}
      <Dialog open={isOficiosModalOpen} onOpenChange={setIsOficiosModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Categorías de Oficios
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {AREAS_OFICIOS.map((area) => {
              const isActive = selectedArea === area.slug;
              const subcategories = SUBCATEGORIES_OFICIOS
                .filter((s) => s.areaSlug === area.slug)
                .map((s) => ({
                  slug: s.slug,
                  name: s.name,
                }));
              const iconMap: Record<string, LucideIcon | null> = {
                "construccion-mantenimiento": Wrench,
                climatizacion: Snowflake,
                "servicios-electronicos": Bolt,
                automotores: Car,
                jardineria: TreePine,
              };
              const Icon = iconMap[area.slug] || Wrench;

              return (
                <CategoryItem
                  key={area.id}
                  name={area.name}
                  slug={area.slug}
                  icon={Icon}
                  isActive={isActive}
                  subcategories={subcategories}
                  selectedSubcategory={
                    selectedCategory !== "all" ? selectedCategory : undefined
                  }
                  onSelect={() => {
                    handleCategorySelect(area.slug);
                  }}
                  onSelectSubcategory={(slug) => {
                    handleSubcategorySelect(slug);
                  }}
                />
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Profesiones */}
      <Dialog open={isProfesionesModalOpen} onOpenChange={setIsProfesionesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Categorías de Profesiones
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {SUBCATEGORIES_PROFESIONES.map((profesion) => {
              const isActive = selectedCategory === profesion.slug;
              return (
                <button
                  key={profesion.id}
                  onClick={() => handleSubcategorySelect(profesion.slug)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'text-primary bg-emerald-50 dark:bg-emerald-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="truncate">{profesion.name}</span>
                  <ArrowRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
