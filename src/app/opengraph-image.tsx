import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GironaXics - Extraescolars a Girona';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F4EE', // crema
          border: '16px solid #1A6B3A', // verd
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* LOGO */}
          <div
            style={{
              display: 'flex',
              fontSize: '84px',
              fontFamily: 'sans-serif',
              fontWeight: 800,
              letterSpacing: '-2px',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: '#1A6B3A' }}>Girona</span>
            <span style={{ color: '#F5A623', fontWeight: 200 }}>Xics</span>
          </div>

          {/* Slogan */}
          <div
            style={{
              fontSize: '32px',
              color: '#525250', // muted
              textAlign: 'center',
              maxWidth: '800px',
              fontFamily: 'serif',
              fontStyle: 'italic',
            }}
          >
            El directori d&apos;extraescolars, tallers, casals i activitats de les comarques gironines.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
