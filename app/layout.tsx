import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthHashHandler from '@/components/AuthHashHandler';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://studiogen.ca'),
  title: {
    default: 'StudioGen - Publications pour professionnels de la beauté au Québec',
    template: '%s | StudioGen',
  },
  description: 'StudioGen crée automatiquement tes publications Facebook et Instagram. Conçu pour les professionnels de la beauté au Québec. Essai gratuit 7 jours, aucune carte requise.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://studiogen.ca',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
