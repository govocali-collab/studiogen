import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Studio Gen';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://studiogen.ca/logo-black.png"
          style={{ height: 140, objectFit: 'contain' }}
          alt="Studio Gen"
        />
        <p
          style={{
            fontSize: 32,
            color: '#6b7280',
            margin: 0,
            textAlign: 'center',
            maxWidth: 800,
          }}
        >
          Du contenu professionnel, prêt à publier. Fais tes posts Facebook et Instagram en 30 sec!
        </p>
      </div>
    ),
    { ...size },
  );
}
