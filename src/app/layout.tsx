import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProviders } from "@/components/providers/AuthProviders";
import { authOptions } from "@/app/api/auth/options";
import { getServerSession } from "next-auth";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Servicios Ceres - Plataforma Oficial",
  description: "Plataforma oficial de servicios profesionales del Gobierno de Ceres. Encuentra profesionales verificados para todas tus necesidades.",
  keywords: "servicios, profesionales, Ceres, plomería, electricidad, construcción",
  authors: [{ name: "Municipalidad de Ceres" }],
  openGraph: {
    title: "Servicios Ceres - Plataforma Oficial",
    description: "Encuentra profesionales verificados en Ceres",
    type: "website",
    locale: "es_AR",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body className="font-roboto antialiased min-h-screen flex flex-col">
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
