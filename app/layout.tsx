import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://studiogen.ca'),
  title: {
    default: 'Studio Gen - Posts Facebook & Instagram en 30 secondes',
    template: '%s | Studio Gen',
  },
  description: 'Studio Gen génère tes montages photo et tes textes Facebook + Instagram automatiquement. En français québécois. Essai gratuit 7 jours, aucune carte requise.',
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
      <body>{children}</body>
    </html>
  );
}
