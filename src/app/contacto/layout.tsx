import type { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contacto y Soporte - Ceres en Red",
  description:
    "Contacta con el equipo de soporte de Ceres en Red. Estamos aquí para ayudarte con tus consultas, reportar problemas o sugerir mejoras a la plataforma.",
  alternates: {
    canonical: getAbsoluteUrl("/contacto"),
  },
  openGraph: {
    title: "Contacto y Soporte | Ceres en Red",
    description:
      "Estamos aquí para escucharte. Ya seas un vecino buscando servicios o un profesional ofreciéndolos, nuestro equipo está listo para asistirte.",
    url: getAbsoluteUrl("/contacto"),
    siteName: "Ceres en Red",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contacto y Soporte - Ceres en Red",
    description:
      "Contacta con el equipo de soporte de Ceres en Red. Estamos aquí para ayudarte.",
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
