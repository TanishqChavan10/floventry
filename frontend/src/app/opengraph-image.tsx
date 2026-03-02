import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Floventry: Inventory, Done Right.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Brand accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: '#E53935',
        }}
      />

      {/* Logo / Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#E53935',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          F
        </div>
        <span style={{ fontSize: 52, fontWeight: 700, color: 'white' }}>Floventry</span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: 28,
          color: '#94a3b8',
          maxWidth: 700,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        Inventory, Simplified
      </p>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {['Stock Tracking', 'Barcode Scanning', 'Warehouse Mgmt', 'Made in India'].map((feat) => (
          <div
            key={feat}
            style={{
              background: 'rgba(229,57,53,0.15)',
              border: '1px solid rgba(229,57,53,0.3)',
              borderRadius: 999,
              padding: '8px 20px',
              color: '#f87171',
              fontSize: 18,
            }}
          >
            {feat}
          </div>
        ))}
      </div>

      {/* URL */}
      <p style={{ position: 'absolute', bottom: 28, color: '#64748b', fontSize: 18 }}>
        floventry.online
      </p>
    </div>,
    { ...size },
  );
}
