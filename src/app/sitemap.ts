import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/servicios`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // Obtener todos los profesionales activos
    const professionals = await prisma.professional.findMany({
      where: {
        status: 'active',
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // Limitar para no sobrecargar el sitemap
    });

    // Agregar páginas de profesionales al sitemap
    const professionalPages: MetadataRoute.Sitemap = professionals.map((prof) => ({
      url: `${baseUrl}/profesionales/${prof.id}`,
      lastModified: prof.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...professionalPages];
  } catch (error) {
    console.error('Error generando sitemap:', error);
    // Si hay error, devolver solo las páginas estáticas
    return staticPages;
  }
}
