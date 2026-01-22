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
    default: "Ceres en Red",
    template: "%s | Ceres en Red"
  },
  description: "Plataforma oficial de servicios profesionales del Gobierno de Ceres. Encuentra profesionales verificados para todas tus necesidades.",
  keywords: ["servicios", "profesionales", "Ceres", "plomería", "electricidad", "construcción", "Santa Fe", "Argentina", "Ceres en Red"],
  authors: [{ name: "Gobierno de la Ciudad de Ceres" }],
  creator: "Gobierno de la Ciudad de Ceres",
  publisher: "Gobierno de la Ciudad de Ceres",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: "/gob_iso.png",
    shortcut: "/gob_iso.png",
    apple: "/gob_iso.png",
  },
  openGraph: {
    title: "Ceres en Red - Plataforma Oficial",
    description: "Encuentra profesionales verificados en Ceres. Plataforma oficial del Gobierno de la Ciudad de Ceres.",
    url: baseUrl,
    siteName: "Ceres en Red",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: `${baseUrl}/gob_iso.png`,
        width: 400,
        height: 400,
        alt: "Ceres en Red - Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ceres en Red - Plataforma Oficial",
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
      <body className="font-roboto antialiased flex flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg dark:focus:bg-gray-900 dark:focus:text-white"
        >
          Saltar al contenido principal
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />
        <AuthProviders session={session}>
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 w-full overflow-x-hidden"
            style={{ overflowY: 'auto' }}
          >
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" />
        </AuthProviders>
      </body>
    </html>
  );
}
