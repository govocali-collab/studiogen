import type { MetadataRoute } from 'next';

const BASE = 'https://studiogen.ca';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: new Date('2026-06-12'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/auth/signup`,
      lastModified: new Date('2026-06-12'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/politique-confidentialite`,
      lastModified: new Date('2026-06-12'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/conditions-utilisation`,
      lastModified: new Date('2026-06-12'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
