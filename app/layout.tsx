import type { Metadata, Viewport } from 'next';
import { Roboto, EB_Garamond, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import AuthHashHandler from '@/components/AuthHashHandler';
import AddToHomeScreenBanner from '@/components/AddToHomeScreenBanner';
import SplashScreen from '@/components/SplashScreen';

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
    default: 'StudioGen — Le système de contenu IA pour les professionnels de la beauté du Québec',
    template: '%s | StudioGen',
  },
  description:
    'StudioGen génère automatiquement tes publications Facebook et Instagram en français québécois. ADN de marque IA, calendrier de contenu, planification automatique. Essai gratuit 7 jours, aucune carte requise.',
  keywords: [
    'publications réseaux sociaux Québec',
    'intelligence artificielle marketing beauté',
    'contenu Facebook Instagram esthétique',
    'ADN de marque IA',
    'planification contenu automatique',
    'logiciel marketing salon beauté Québec',
    'publications automatiques esthéticienne',
    'StudioGen',
    'Astrova',
  ],
  authors: [{ name: 'Astrova', url: 'https://astrova.ca' }],
  creator: 'Astrova',
  publisher: 'Astrova',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://studiogen.ca',
  },
  appleWebApp: {
    title: 'StudioGen',
    statusBarStyle: 'default',
    capable: true,
  },
  openGraph: {
    siteName: 'StudioGen',
    locale: 'fr_CA',
    type: 'website',
    url: 'https://studiogen.ca',
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description:
      'StudioGen génère tes publications Facebook et Instagram en français québécois grâce à ton ADN de marque IA. Essai gratuit 7 jours, aucune carte requise.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'StudioGen — Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux',
    description:
      'StudioGen génère tes publications Facebook et Instagram en français québécois grâce à ton ADN de marque IA. Essai gratuit 7 jours, aucune carte requise.',
    images: ['/opengraph-image'],
  },
};

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'StudioGen',
  url: 'https://studiogen.ca',
  description:
    'Le système de contenu IA conçu pour les professionnels de la beauté du Québec. Publications Facebook et Instagram en français québécois, ADN de marque IA, planification automatique.',
  inLanguage: 'fr-CA',
  publisher: {
    '@type': 'Organization',
    name: 'Astrova',
    url: 'https://astrova.ca',
  },
  potentialAction: {
    '@type': 'RegisterAction',
    target: 'https://studiogen.ca/auth/signup',
    name: 'Essai gratuit 7 jours',
  },
};

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Astrova',
  url: 'https://astrova.ca',
  sameAs: ['https://studiogen.ca'],
  knowsAbout: [
    'Marketing de réseaux sociaux',
    'Intelligence artificielle',
    'Professionnels de la beauté',
    'Québec',
    'Français québécois',
  ],
  areaServed: {
    '@type': 'AdministrativeArea',
    name: 'Québec, Canada',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={`${roboto.variable} ${ebGaramond.variable} ${cormorantGaramond.variable}`}>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
        <SplashScreen />
        <AuthHashHandler />
        {children}
        <AddToHomeScreenBanner />
      </body>
    </html>
  );
}
