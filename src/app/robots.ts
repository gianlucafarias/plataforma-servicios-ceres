import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/auth/',
          '/admin/',
          '/_next/',
          '/uploads/profiles/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/auth/',
          '/admin/',
          '/_next/',
          '/uploads/profiles/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
