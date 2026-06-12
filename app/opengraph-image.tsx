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
          background: '#f5f5f7',
        }}
      >
        {/* Top section — white/light gray, logo centered */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f7',
            padding: '60px 80px 40px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            style={{ height: 90, objectFit: 'contain' }}
            alt="StudioGen"
          />
        </div>

        {/* Bottom section — mauve pâle, title + URL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '44px 72px 48px',
            background: '#ede9fe',
          }}
        >
          <p
            style={{
              color: '#111111',
              fontSize: 52,
              fontWeight: 800,
              margin: '0 0 14px',
              lineHeight: 1.2,
              letterSpacing: '-0.5px',
            }}
          >
            Récupère jusqu&apos;à 10 heures par semaine sur tes réseaux sociaux
          </p>
          <p
            style={{
              color: '#7c3aed',
              fontSize: 28,
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
