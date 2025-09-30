import Link from "next/link";
import { Building2, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Información de la municipalidad */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-[var(--gov-green)]" />
              <h3 className="font-rutan font-bold text-lg">
              Gobierno de la Ciudad de Ceres
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
            Plataforma oficial de servicios profesionales para Ceres y la zona
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Ceres, Santa Fe, Argentina</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+54 (03491) 421234</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>servicios@ceres.gob.ar</span>
              </div>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="font-medium">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/servicios" className="hover:text-foreground transition-colors">
                  Buscar Servicios
                </Link>
              </li>
              <li>
                <Link href="/profesionales" className="hover:text-foreground transition-colors">
                  Profesionales
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="hover:text-foreground transition-colors">
                  Categorías
                </Link>
              </li>
              <li>
                <Link href="/como-funciona" className="hover:text-foreground transition-colors">
                  Cómo Funciona
                </Link>
              </li>
            </ul>
          </div>

          {/* Para profesionales */}
          <div className="space-y-4">
            <h4 className="font-medium">Para Profesionales</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/registro" className="hover:text-foreground transition-colors">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">
                  Mi Panel
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="hover:text-foreground transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-foreground transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h4 className="font-medium">Soporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/contacto" className="hover:text-foreground transition-colors">
                  Contactar Soporte
                </Link>
              </li>
              <li>
                <Link href="/preguntas-frecuentes" className="hover:text-foreground transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-foreground transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/reportar" className="hover:text-foreground transition-colors">
                  Reportar Problema
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2025 Municipalidad de Ceres. Todos los derechos reservados.
          </p>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <Link href="/accesibilidad" className="hover:text-foreground transition-colors">
              Accesibilidad
            </Link>
            <Link href="/mapa-sitio" className="hover:text-foreground transition-colors">
              Mapa del Sitio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

