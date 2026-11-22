import type { MetadataRoute } from 'next';
import { services } from '../lib/site';

export const dynamic = 'force-static';

const base = 'https://interplusconsulting-web.netlify.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: 'monthly', priority: 1 },
    ...services.map(service => ({ url: `${base}/services/${service.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.6 },
  ];
}
