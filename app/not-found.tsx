// app/not-found.tsx
// Halaman 404 custom — sesuai design system Vault Next
//
// CSS di styles/components/errors.css (dimuat via globals.css → layout.tsx).
// Semua URL dari ROUTES constants.

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-code">404</div>

        <h1 className="not-found-title">Halaman Tidak Ditemukan</h1>
        <p className="not-found-desc">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>

        <Link href={ROUTES.home} className="not-found-btn">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
