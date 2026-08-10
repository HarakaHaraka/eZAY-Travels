import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const guides = await prisma.destinationGuide.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: `${config.siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${config.siteUrl}/enquiry`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${config.siteUrl}/guides`, changeFrequency: 'weekly', priority: 0.8 },
    ...guides.map((guide) => ({
      url: `${config.siteUrl}/guides/${guide.slug}`,
      lastModified: guide.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
