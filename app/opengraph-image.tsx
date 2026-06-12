import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const alt = 'StudioGen — Récupère jusqu\'à 10 heures par semaine sur tes réseaux sociaux';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), 'public/logo-black.png'));
  const logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          background: '#f5f5f7',
          padding: '48px 80px',
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          style={{ height: 176, objectFit: 'contain' }}
          alt="StudioGen"
        />

        {/* Text bubble — mauve pâle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ede9fe',
            borderRadius: '24px',
            padding: '40px 56px',
            width: '100%',
          }}
        >
          <p
            style={{
              color: '#1a1a1a',
              fontSize: 48,
              fontWeight: 800,
              margin: '0 0 12px',
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
            }}
          >
            Récupère jusqu&apos;à 10 heures par semaine sur tes réseaux sociaux
          </p>
          <p
            style={{
              color: '#7c3aed',
              fontSize: 26,
              fontWeight: 500,
              margin: 0,
            }}
          >
            studiogen.ca
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
