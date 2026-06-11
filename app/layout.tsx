import type { Metadata, Viewport } from 'next';
import './globals.css';
import AuthHashHandler from '@/components/AuthHashHandler';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      <body suppressHydrationWarning>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
