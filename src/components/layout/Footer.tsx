import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Información de la municipalidad */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">C</div>
              <h5 className="font-bold text-gray-900 dark:text-white">Gobierno de la Ciudad de Ceres</h5>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
              Plataforma oficial de servicios profesionales para Ceres y la zona. Conectando talento local con necesidades reales.
            </p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <MapPin className="text-base" />
                Ceres, Santa Fe, Argentina
              </li>
              <li className="flex items-center gap-2">
                <Phone className="text-base" />
                +54 (03491) 421234
              </li>
              <li className="flex items-center gap-2">
                <Mail className="text-base" />
                servicios@ceres.gob.ar
              </li>
            </ul>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-4">Enlaces Rápidos</h5>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/servicios" className="hover:text-primary transition-colors">
                  Buscar Servicios
                </Link>
              </li>
              <li>
                <Link href="/profesionales" className="hover:text-primary transition-colors">
                  Profesionales
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="hover:text-primary transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-primary transition-colors">
                  Cómo Funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Para profesionales */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-4">Para Profesionales</h5>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/auth/registro" className="hover:text-primary transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Mi Panel
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="hover:text-primary transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-primary transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h5 className="font-bold text-gray-900 dark:text-white mb-4">Soporte</h5>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link href="/contacto" className="hover:text-primary transition-colors">
                  Contactar Soporte
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="hover:text-primary transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-primary transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/reportar" className="hover:text-primary transition-colors">
                  Reportar Problema
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2025 Municipalidad de Ceres. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="/accesibilidad" className="hover:text-gray-600 dark:hover:text-gray-300">
              Accesibilidad
            </Link>
            <Link href="/mapa-sitio" className="hover:text-gray-600 dark:hover:text-gray-300">
              Mapa del Sitio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

