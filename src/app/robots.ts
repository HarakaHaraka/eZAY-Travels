import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin, the booking funnel and API routes carry no search value and
      // some carry customer data.
      disallow: ['/admin', '/admin/', '/api/', '/book/'],
    },
    sitemap: `${config.siteUrl}/sitemap.xml`,
  };
}
