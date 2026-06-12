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
          justifyContent: 'center',
          background: '#ede9fe',
          padding: '72px 96px',
          gap: '40px',
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          style={{ height: 64, objectFit: 'contain', objectPosition: 'left' }}
          alt="StudioGen"
        />

        {/* Title */}
        <p
          style={{
            color: '#111111',
            fontSize: 72,
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: '-1px',
          }}
        >
          Récupère jusqu&apos;à 10 heures par semaine sur tes réseaux sociaux
        </p>

        {/* URL */}
        <p
          style={{
            color: '#7c3aed',
            fontSize: 32,
            fontWeight: 500,
            margin: 0,
          }}
        >
          studiogen.ca
        </p>
      </div>
    ),
    { ...size },
  );
}
