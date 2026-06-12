import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio',
          '/settings',
          '/billing',
          '/calendrier',
          '/admin',
          '/api/',
          '/auth/callback',
          '/auth/login',
        ],
      },
    ],
    sitemap: 'https://studiogen.ca/sitemap.xml',
  };
}
