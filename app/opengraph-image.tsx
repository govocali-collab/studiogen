import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'StudioGen — Le système de contenu IA pour les professionnels de la beauté du Québec';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public/logo-white.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0520 0%, #1e0a3c 40%, #2e1065 75%, #4c1d95 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(192,38,211,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            right: '-60px',
            width: '500px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          style={{ height: 52, objectFit: 'contain', marginBottom: 40 }}
          alt="StudioGen"
        />

        {/* Headline */}
        <p
          style={{
            color: '#ffffff',
            fontSize: 52,
            fontWeight: 800,
            textAlign: 'center',
            margin: '0 0 20px',
            lineHeight: 1.15,
            maxWidth: 980,
            letterSpacing: '-0.5px',
          }}
        >
          Récupérez jusqu&apos;à 10 heures par semaine sur vos réseaux sociaux.
        </p>

        {/* Subtitle */}
        <p
          style={{
            color: '#c4b5fd',
            fontSize: 26,
            fontWeight: 400,
            textAlign: 'center',
            margin: '0 0 40px',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Le système de contenu IA pour les professionnels de la beauté du Québec
        </p>

        {/* Pill badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(196,181,253,0.3)',
            borderRadius: '100px',
            padding: '10px 24px',
          }}
        >
          <span style={{ color: '#a78bfa', fontSize: 18, fontWeight: 600 }}>✨</span>
          <span style={{ color: '#e9d5ff', fontSize: 18, fontWeight: 600 }}>
            Essai gratuit 7 jours · Aucune carte requise
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
