'use client';

// app/offline/page.tsx
// Halaman offline — ditampilkan service worker saat tidak ada koneksi
// dan cache belum tersedia.
//
// CSS di styles/components/errors.css (dimuat via globals.css → layout.tsx).
// Vault Next adalah app 100% offline-first — halaman ini hanya muncul
// saat SW belum sempat cache assets.

export default function OfflinePage() {
  return (
    <div className="offline-page">
      <div className="offline-inner">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="offline-icon"
        >
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>

        <div>
          <h1 className="offline-title">Tidak Ada Koneksi</h1>
          <p className="offline-desc">
            Vault Next adalah aplikasi offline-first. Buka kembali setelah app
            selesai dimuat setidaknya sekali untuk menggunakannya tanpa internet.
          </p>
        </div>

        <button
          className="offline-btn"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
