/**
 * components/entries/__tests__/BrandGlyph.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Keputusan terkunci: logo brand ASLI yang dikenali, tanpa tile huruf pengganti.
 * BrandGlyph memilih cara menggambar logo menurut jenisnya (path tunggal / mono / line /
 * color dengan fit mark|wide|full) dan menghitung warna kontras glyph terhadap ubin.
 * Fixture memakai objek CuratedBrandIcon buatan sendiri (bukan data brand nyata) agar
 * test tidak ikut berubah ketika katalog brand diperbarui.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { CuratedBrandIcon } from '@/lib/brand-icons';
import { BrandGlyph, brandFg, brandAccent, brandClipsTile } from '../BrandGlyph';

const dasar: CuratedBrandIcon = { slug: 'uji', title: 'Uji', hex: '336699', path: 'M0 0h24v24H0z' };
const svgDari = (el: HTMLElement) => {
  const svg = el.querySelector('svg');
  if (!svg) throw new Error('svg tidak ditemukan');
  return svg;
};

describe('brandFg — warna glyph kontras terhadap warna ubin (YIQ, ambang 170)', () => {
  it('ubin terang → glyph gelap (#1a1206 = --on-gold); ubin gelap → glyph putih', () => {
    expect(brandFg('FFFFFF')).toBe('#1a1206'); // putih
    expect(brandFg('F0B90B')).toBe('#1a1206'); // kuning terang
    expect(brandFg('000000')).toBe('#ffffff'); // hitam
    expect(brandFg('EA4335')).toBe('#ffffff'); // merah
    expect(brandFg('1877F2')).toBe('#ffffff'); // biru
  });

  it('tepat di ambang: YIQ 170 → gelap, YIQ 169 → putih', () => {
    expect(brandFg('AAAAAA')).toBe('#1a1206'); // (170*299+170*587+170*114)/1000 = 170
    expect(brandFg('A9A9A9')).toBe('#ffffff'); // 169
  });

  it('bobot kanal berbeda: hijau terang lebih "terang" daripada biru murni dengan nilai kanal sama', () => {
    expect(brandFg('00FF00')).toBe('#ffffff'); // YIQ 149,7
    expect(brandFg('FFFF00')).toBe('#1a1206'); // YIQ 225,9
  });
});

describe('brandAccent & brandClipsTile', () => {
  it('brandAccent memakai accent bila ada, selain itu hex', () => {
    expect(brandAccent({ ...dasar, accent: 'FF0000' })).toBe('FF0000');
    expect(brandAccent(dasar)).toBe('336699');
  });

  it('brandClipsTile hanya true untuk logo berwarna (kind "color")', () => {
    expect(brandClipsTile({ ...dasar, kind: 'color' })).toBe(true);
    expect(brandClipsTile({ ...dasar, kind: 'mono' })).toBe(false);
    expect(brandClipsTile({ ...dasar, kind: 'line' })).toBe(false);
    expect(brandClipsTile(dasar)).toBe(false);
  });
});

describe('BrandGlyph — cara menggambar per jenis logo', () => {
  it('tanpa body: path simple-icons satu warna berukuran `glyph`, fill = warna kontras, aria-hidden', () => {
    const { container } = render(<BrandGlyph brand={dasar} box={56} glyph={30} />);
    const svg = svgDari(container);
    expect(svg.getAttribute('width')).toBe('30');
    expect(svg.getAttribute('height')).toBe('30');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.getAttribute('fill')).toBe('#ffffff'); // ubin 336699 gelap
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(dasar.path);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('kind "mono": ukuran = 54% box (dibulatkan), warna = kontras ubin, isi dari body', () => {
    const { container } = render(<BrandGlyph brand={{ ...dasar, hex: 'F0B90B', kind: 'mono', body: '<circle r="3"/>', vb: '0 0 32 32' }} box={56} glyph={30} />);
    const svg = svgDari(container);
    expect(svg.getAttribute('width')).toBe(String(Math.round(56 * 0.54))); // 30
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 32');
    expect(svg.style.color).toBe('rgb(26, 18, 6)'); // #1a1206
    expect(svg.innerHTML).toContain('<circle');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('kind "line": tebal garis bawaan 2.6, atau sw milik brand bila ada', () => {
    const line = { ...dasar, kind: 'line' as const, body: '<path d="M0 0"/>' };
    const a = render(<BrandGlyph brand={line} box={50} glyph={30} />);
    expect(svgDari(a.container).style.strokeWidth).toBe('2.6');
    const b = render(<BrandGlyph brand={{ ...line, sw: 4 }} box={50} glyph={30} />);
    expect(svgDari(b.container).style.strokeWidth).toBe('4');
  });

  it('kind "mono" TIDAK diberi strokeWidth (hanya "line")', () => {
    const { container } = render(<BrandGlyph brand={{ ...dasar, kind: 'mono', body: '<path d="M0 0"/>' }} box={50} glyph={30} />);
    expect(svgDari(container).style.strokeWidth).toBe('');
  });

  it('viewBox bawaan 0 0 24 24 bila body tanpa vb', () => {
    const { container } = render(<BrandGlyph brand={{ ...dasar, kind: 'mono', body: '<path d="M0 0"/>' }} box={50} glyph={30} />);
    expect(svgDari(container).getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('kind "color" fit: mark = 64% persegi (bawaan), wide = 80%×62%, full = seukuran ubin', () => {
    const warna = { ...dasar, hex: 'FFFFFF', kind: 'color' as const, body: '<rect width="1" height="1"/>' };
    const ukuran = (fit?: 'mark' | 'wide' | 'full') => {
      const { container } = render(<BrandGlyph brand={{ ...warna, fit }} box={50} glyph={30} />);
      const svg = svgDari(container);
      return [Number(svg.getAttribute('width')), Number(svg.getAttribute('height'))];
    };
    expect(ukuran(undefined)).toEqual([32, 32]);
    expect(ukuran('mark')).toEqual([32, 32]);
    expect(ukuran('wide')).toEqual([40, 31]);
    expect(ukuran('full')).toEqual([50, 50]);
  });

  it('kind "color" mempertahankan markup warna asli dari body (tidak diwarnai ulang)', () => {
    const { container } = render(<BrandGlyph brand={{ ...dasar, kind: 'color', body: '<path fill="#4285f4" d="M0 0"/>' }} box={50} glyph={30} />);
    const svg = svgDari(container);
    expect(svg.querySelector('path')?.getAttribute('fill')).toBe('#4285f4');
    expect(svg.getAttribute('fill')).toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
