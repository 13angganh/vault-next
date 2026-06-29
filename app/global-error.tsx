'use client';

// app/global-error.tsx
// Menangkap error di root layout (ThemeProvider crash, dll).
// CSS variables mungkin tidak tersedia — gunakan inline styles sebagai fallback.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#07080f',
          color: '#eeeef5',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '360px',
          }}
        >
          {/* Icon peringatan sederhana */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 24,
            }}
          >
            ⚠
          </div>

          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#eeeef5',
            }}
          >
            Terjadi Kesalahan
          </h1>

          <p
            style={{
              fontSize: '0.875rem',
              color: '#6b6d85',
              marginBottom: '0.25rem',
              lineHeight: 1.5,
            }}
          >
            Aplikasi mengalami error yang tidak terduga.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#9294ae',
                marginBottom: '1.5rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1.5px solid rgba(240,165,0,0.3)',
              backgroundColor: 'rgba(240,165,0,0.08)',
              color: '#f0a500',
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              minHeight: 40,
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(240,165,0,0.16)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(240,165,0,0.08)';
            }}
          >
            Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
