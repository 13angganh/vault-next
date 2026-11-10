'use client';

import type { CuratedBrandIcon } from '@/lib/brand-icons';

/** Warna glyph kontras terhadap warna ubin (YIQ). */
export function brandFg(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 170 ? '#1a1206' : '#ffffff';
}

/** Warna utama brand untuk tint/bayangan (ubin logo berwarna berlatar putih memakai `accent`). */
export const brandAccent = (b: CuratedBrandIcon): string => b.accent ?? b.hex;

/** Ubin yang memuat logo berwarna harus memotong isi mengikuti sudut membulat. */
export const brandClipsTile = (b: CuratedBrandIcon): boolean => b.kind === 'color';

/**
 * Merender logo brand di dalam ubin berukuran `box` px.
 *  - tanpa `body`  : path simple-icons satu warna (perilaku lama)
 *  - kind "mono"   : glyph satu warna (currentColor = warna kontras)
 *  - kind "line"   : gambar garis (stroke currentColor)
 *  - kind "color"  : logo berwarna asli; fit "mark" | "wide" | "full"
 * `body` berasal dari data build kita sendiri (lib/brand-icons.ts), bukan input pengguna.
 */
export function BrandGlyph({ brand, box, glyph }: { brand: CuratedBrandIcon; box: number; glyph: number }) {
  if (!brand.body) {
    return (
      <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill={brandFg(brand.hex)} aria-hidden="true">
        <path d={brand.path} />
      </svg>
    );
  }
  const vb = brand.vb ?? '0 0 24 24';
  if (brand.kind === 'color') {
    const fit = brand.fit ?? 'mark';
    const [w, h] = fit === 'full' ? [box, box] : fit === 'wide' ? [box * 0.8, box * 0.62] : [box * 0.64, box * 0.64];
    return <svg viewBox={vb} width={w} height={h} aria-hidden="true" dangerouslySetInnerHTML={{ __html: brand.body }} />;
  }
  const size = Math.round(box * 0.54);
  return (
    <svg
      viewBox={vb} width={size} height={size} aria-hidden="true"
      style={{ color: brandFg(brand.hex), ...(brand.kind === 'line' ? { strokeWidth: brand.sw ?? 2.6 } : null) }}
      dangerouslySetInnerHTML={{ __html: brand.body }}
    />
  );
}
