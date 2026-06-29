// app/not-found.tsx
// Halaman 404 custom — sesuai design system Vault Next

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-code">404</div>

        <h1 className="not-found-title">Halaman Tidak Ditemukan</h1>
        <p className="not-found-desc">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <Link href="/" className="not-found-btn">
          Kembali ke Beranda
        </Link>
      </div>

      <style>{`
        .not-found-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-s1, #07080f);
          color: var(--text, #eeeef5);
          font-family: var(--font-sans, 'Inter', sans-serif);
          padding: 2rem;
        }
        .not-found-inner {
          text-align: center;
          max-width: 360px;
        }
        .not-found-code {
          font-size: 6rem;
          font-weight: 700;
          line-height: 1;
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          color: var(--gold, #f0a500);
          opacity: 0.25;
          margin-bottom: 1rem;
          letter-spacing: -0.05em;
        }
        .not-found-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: var(--text, #eeeef5);
        }
        .not-found-desc {
          font-size: 0.875rem;
          color: var(--muted, #6b6d85);
          margin: 0 0 1.75rem;
          line-height: 1.6;
        }
        .not-found-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-md, 0.5rem);
          border: 1.5px solid var(--gold-border, rgba(240,165,0,0.3));
          background-color: var(--gold-dim, rgba(240,165,0,0.08));
          color: var(--gold, #f0a500);
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-sans, 'Inter', sans-serif);
          text-decoration: none;
          min-height: 40px;
          transition: background-color 0.15s ease;
        }
        .not-found-btn:hover {
          background-color: rgba(240,165,0,0.14);
        }
      `}</style>
    </div>
  );
}
