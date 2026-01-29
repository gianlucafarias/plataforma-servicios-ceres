import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Información de la municipalidad */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image src="/gob_iso.png" alt="Gobierno de la Ciudad de Ceres" width={32} height={32} />
              <h5 className="font-bold text-white">Gobierno de la
                 <br />
                 Ciudad de Ceres</h5>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-400 mb-4 leading-relaxed">
              Plataforma oficial de servicios profesionales para Ceres y la zona. Conectando talento local con necesidades reales.
            </p>
            {/* Contacto 
            <ul className="text-sm text-gray-400 dark:text-gray-400 space-y-2">
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
            */}
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h5 className="font-bold text-gray-200 dark:text-white mb-4">Enlaces Rápidos</h5>
            <ul className="space-y-3 text-sm text-gray-400 dark:text-gray-400">
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

          

          {/* Soporte */}
          <div>
            <h5 className="font-bold text-gray-200 dark:text-white mb-4">Soporte</h5>
            <ul className="space-y-3 text-sm text-gray-400 dark:text-gray-400">
              <li>
                <Link href="/contacto" className="hover:text-primary transition-colors">
                  Contactar Soporte
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-primary transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-primary transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2026 Gobierno de la Ciudad de Ceres. Todos los derechos reservados.</p>
          
        </div>
      </div>
    </footer>
  );
}

