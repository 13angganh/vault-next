'use client';

/**
 * Vault Next — EntryIcon
 * v1.11.0: redesain visual — logo brand asli per-entri.
 *
 * SENGAJA komponen BARU, bukan memodifikasi CategoryIcon.tsx langsung.
 * CategoryIcon punya 12 test terverifikasi (lihat
 * components/entries/__tests__/CategoryIcon.test.tsx) yang memvalidasi
 * signature `<CategoryIcon catId={...} />` render warna/ikon kategori
 * default secara persis. EntryIcon MEMBUNGKUS CategoryIcon tanpa
 * mengubahnya sama sekali — CategoryIcon tetap 100% dipakai apa adanya
 * untuk kasus tanpa brand icon (kategori-level di Sidebar/CategoryManager,
 * dan sebagai fallback saat entri tidak punya brandIconSlug).
 *
 * Pemakaian: GANTI <CategoryIcon catId={entry.cat} .../> dengan
 * <EntryIcon entry={entry} .../> HANYA di tempat yang merender icon
 * untuk SATU ENTRI (EntryCard, DetailView). Tempat yang merender icon
 * untuk kategori itu sendiri (Sidebar, CategoryManager, dropdown
 * kategori di EntryForm) TETAP pakai CategoryIcon — brand icon memang
 * konsepnya per-entri, bukan per-kategori (keputusan eksplisit
 * pengguna).
 */

import { getBrandIconBySlug } from '@/lib/brand-icons';
import { CategoryIcon } from '@/components/entries/CategoryIcon';
import { BrandGlyph, brandAccent, brandClipsTile } from '@/components/entries/BrandGlyph';
import type { VaultEntry, CustomCategory } from '@/lib/types';

const SIZE_MAP = {
  sm: { box: 28, icon: 14 },
  md: { box: 36, icon: 18 },
  lg: { box: 48, icon: 24 },
  // v1.11.0 (redesain visual Tahap 3): avatar 52px di EntryCard list —
  // dikonfirmasi user di preview v3. Ditambahkan sebagai varian BARU
  // (bukan mengubah nilai 'md'/'lg' existing) karena 'md' punya kontrak
  // semantik 36px yang mungkin diasumsikan di tempat lain — menambah
  // varian baru lebih aman drpd mengubah arti ukuran yang sudah ada.
  xl: { box: 56, icon: 27 },
} as const;

interface EntryIconProps {
  entry:       VaultEntry;
  customCats?: CustomCategory[];
  size?:       'sm' | 'md' | 'lg' | 'xl';
  className?:  string;
}

export function EntryIcon({
  entry,
  customCats = [],
  size = 'md',
  className = '',
}: EntryIconProps) {
  const brand = entry.brandIconSlug
    ? getBrandIconBySlug(entry.brandIconSlug)
    : undefined;

  // Tidak ada brandIconSlug, ATAU slug tersimpan tidak lagi dikenali
  // (mis. data lama dari versi lib/brand-icons.ts yang berbeda) —
  // fallback penuh ke CategoryIcon, perilaku existing tidak berubah.
  if (!brand) {
    return (
      <CategoryIcon
        catId={entry.cat}
        customCats={customCats}
        // CategoryIcon.tsx (dilindungi 12 test, TIDAK disentuh — lihat
        // catatan Tahap 2) tipenya cuma 'sm'|'md'|'lg', belum kenal
        // 'xl'. 'xl' diterjemahkan ke 'lg' (ukuran terbesarnya) di
        // jalur fallback ini — fallback icon kategori generik memang
        // tidak perlu sebesar avatar brand asli yang detail SVG-nya
        // lebih presisi.
        size={size === 'xl' ? 'lg' : size}
        className={className}
      />
    );
  }

  const { box, icon: iconSize } = SIZE_MAP[size];
  const radius = Math.round(box * 0.28); // radius sama persis dengan CategoryIcon

  // v1.11.0 (redesain visual Tahap 3): efek embossed (highlight atas +
  // shadow bawah + outer glow warna brand) — dikonfirmasi user di
  // preview v3. SENGAJA hanya utk size="xl" (avatar besar di list,
  // 52px) — di ukuran lebih kecil (sm/md/lg), detail inset ganda
  // sehalus ini nyaris tak kasat mata dan berisiko membuat render
  // terlihat "kotor"/berbayang alih-alih menambah kedalaman.
  const brandBoxShadow = size === 'xl'
    ? `0 8px 20px #${brandAccent(brand)}59, inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.15)`
    : 'var(--shadow-raised)';

  return (
    <span
      className={`cat-icon cat-icon--${size} entry-icon--brand ${className}`}
      style={{
        width: box, height: box,
        backgroundColor: `#${brand.hex}`,
        borderRadius: radius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: 1,
        boxShadow: brandBoxShadow,
        overflow: brandClipsTile(brand) ? 'hidden' : undefined,
      }}
      aria-hidden="true"
      title={brand.title}
    >
      <BrandGlyph brand={brand} box={box} glyph={iconSize} />
    </span>
  );
}

/**
 * Sebagian besar logo brand di simple-icons didesain untuk foreground
 * putih di atas warna brand solid (pola umum badge/app-icon). Tapi
 * beberapa brand punya warna sangat terang (kuning/putih — mis.
 * Binance F0B90B, Snapchat FFFC00) di mana foreground putih nyaris
 * tidak kontras. Heuristik luminance sederhana (formula standar
 * YIQ/perceived-brightness) menentukan foreground gelap vs putih
 * per-brand secara otomatis, bukan daftar hardcode per-brand yang
 * gampang basi saat brand baru ditambah ke lib/brand-icons.ts.
 */
