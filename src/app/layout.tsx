import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProviders } from "@/components/providers/AuthProviders";
import { authOptions } from "@/app/api/auth/options";
import { getServerSession } from "next-auth";
import { Toaster } from "sonner";
import { getBaseUrl, generateOrganizationStructuredData } from "@/lib/seo";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: {
    default: "Servicios Ceres - Plataforma Oficial",
    template: "%s | Servicios Ceres"
  },
  description: "Plataforma oficial de servicios profesionales del Gobierno de Ceres. Encuentra profesionales verificados para todas tus necesidades.",
  keywords: ["servicios", "profesionales", "Ceres", "plomería", "electricidad", "construcción", "Santa Fe", "Argentina"],
  authors: [{ name: "Municipalidad de Ceres" }],
  creator: "Gobierno de la Ciudad de Ceres",
  publisher: "Gobierno de la Ciudad de Ceres",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Servicios Ceres - Plataforma Oficial",
    description: "Encuentra profesionales verificados en Ceres. Plataforma oficial del Gobierno de la Ciudad de Ceres.",
    url: baseUrl,
    siteName: "Servicios Ceres",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: `${baseUrl}/gob_iso.png`,
        width: 400,
        height: 400,
        alt: "Servicios Ceres - Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Servicios Ceres - Plataforma Oficial",
    description: "Encuentra profesionales verificados en Ceres",
    images: [`${baseUrl}/gob_iso.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const organizationData = generateOrganizationStructuredData();

  return (
    <html lang="es">
      <body className="font-roboto antialiased min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <AuthProviders session={session}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" />
        </AuthProviders>
      </body>
    </html>
  );
}
