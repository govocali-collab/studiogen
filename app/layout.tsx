import type { Metadata, Viewport } from 'next';
import { Roboto, EB_Garamond, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import AuthHashHandler from '@/components/AuthHashHandler';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-roboto',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-eb-garamond',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
    <html lang="fr-CA" className={`${roboto.variable} ${ebGaramond.variable} ${cormorantGaramond.variable}`}>
      <body suppressHydrationWarning>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
