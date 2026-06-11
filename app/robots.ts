import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/studio', '/settings', '/admin', '/api/', '/auth/callback'],
      },
    ],
    sitemap: 'https://studiogen.ca/sitemap.xml',
  };
}
