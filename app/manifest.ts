import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StudioGen',
    short_name: 'StudioGen',
    description: 'Publications Facebook & Instagram pour professionnels de la beauté au Québec',
    start_url: '/studio',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/fav.png',
        sizes: '352x352',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
