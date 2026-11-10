/**
 * components/entries/__tests__/EntryIcon.test.tsx — Vault Next
 *
 * v1.11.0: EntryIcon membungkus CategoryIcon untuk menambah dukungan
 * logo brand asli per-entri (lib/brand-icons.ts), tanpa mengubah
 * CategoryIcon.tsx sama sekali. Test ini memverifikasi tiga kontrak:
 *
 * 1. Tanpa brandIconSlug -> fallback PERSIS ke CategoryIcon (perilaku
 *    existing, dijaga oleh CategoryIcon.test.tsx sendiri — di sini
 *    kita hanya pastikan EntryIcon benar-benar mendelegasikan, bukan
 *    merender sesuatu yang lain).
 * 2. Dengan brandIconSlug valid -> merender <svg> path brand yang
 *    benar, dengan backgroundColor = hex resmi brand tsb.
 * 3. Dengan brandIconSlug yang TIDAK dikenali (mis. data lama dari
 *    kurasi brand-icons.ts versi berbeda, atau string sembarang) ->
 *    fallback aman ke CategoryIcon, TIDAK crash dan TIDAK merender
 *    kotak kosong.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EntryIcon } from '../EntryIcon';
import type { VaultEntry } from '@/lib/types';

function makeEntry(overrides: Partial<VaultEntry> = {}): VaultEntry {
  return {
    id: 'e1',
    cat: 'email',
    name: 'Test Entry',
    ...overrides,
  };
}

describe('EntryIcon — fallback ke CategoryIcon tanpa brandIconSlug', () => {
  it('merender <svg> kategori (bukan kosong) saat brandIconSlug tidak diisi', () => {
    const { container } = render(<EntryIcon entry={makeEntry({ cat: 'email' })} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // CategoryIcon utk 'email' pakai Lucide Mail -> class lucide-mail
    expect(svg?.getAttribute('class')).toContain('mail');
  });

  it('tidak menambahkan class entry-icon--brand saat fallback ke kategori', () => {
    const { container } = render(<EntryIcon entry={makeEntry({ cat: 'crypto' })} />);
    expect(container.querySelector('.entry-icon--brand')).toBeNull();
  });
});

describe('EntryIcon — render logo brand saat brandIconSlug valid', () => {
  it('merender <svg> dengan path Binance dan background hex resmi F0B90B saat slug="binance"', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ cat: 'crypto', brandIconSlug: 'binance' })} />,
    );
    const wrapper = container.querySelector('.entry-icon--brand') as HTMLElement | null;
    expect(wrapper, 'wrapper .entry-icon--brand tidak ditemukan — brand tidak ter-render').not.toBeNull();
    // jsdom menormalkan style.backgroundColor inline dari '#f0b90b' -> 'rgb(240, 185, 11)'
    expect(wrapper?.style.backgroundColor).toBe('rgb(240, 185, 11)');

    const svg = wrapper?.querySelector('svg');
    expect(svg).not.toBeNull();
    const path = svg?.querySelector('path');
    expect(path?.getAttribute('d')).toContain('16.624 13.9202'); // fragmen awal path Binance asli
  });

  it('merender logo Gmail dengan foreground putih (kontras cukup di atas merah EA4335)', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ cat: 'email', brandIconSlug: 'gmail' })} />,
    );
    const wrapper = container.querySelector('.entry-icon--brand') as HTMLElement | null;
    expect(wrapper?.style.backgroundColor).toBe('rgb(234, 67, 53)');
    // fill di-set di elemen <svg> (path mewarisi via SVG CSS inheritance) —
    // query dari svg, bukan path.
    const svg = wrapper?.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('#ffffff');
  });

  it('merender logo Binance dengan foreground GELAP (kuning terang F0B90B butuh kontras gelap, bukan putih)', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ cat: 'crypto', brandIconSlug: 'binance' })} />,
    );
    const wrapper = container.querySelector('.entry-icon--brand');
    const svg = wrapper?.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('#1a1206');
  });
});

describe('EntryIcon — fallback aman untuk slug tidak dikenali', () => {
  it('brandIconSlug string sembarang yang tidak ada di brand-icons.ts -> fallback ke CategoryIcon, tidak crash', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ cat: 'sosmed', brandIconSlug: 'brand-yang-tidak-pernah-ada-xyz' })} />,
    );
    expect(container.querySelector('.entry-icon--brand')).toBeNull();
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull(); // fallback CategoryIcon tetap merender sesuatu
  });

  it('brandIconSlug string kosong ("") diperlakukan sama seperti undefined -> fallback kategori', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ cat: 'wifi', brandIconSlug: '' })} />,
    );
    expect(container.querySelector('.entry-icon--brand')).toBeNull();
  });
});

describe('EntryIcon — ukuran (size prop) konsisten dengan CategoryIcon', () => {
  it.each(['sm', 'md', 'lg'] as const)('size="%s" menghasilkan dimensi box yang sama persis dengan CategoryIcon size="%s"', (size) => {
    const { container: brandContainer } = render(
      <EntryIcon entry={makeEntry({ brandIconSlug: 'gmail' })} size={size} />,
    );
    const { container: fallbackContainer } = render(
      <EntryIcon entry={makeEntry()} size={size} />,
    );
    const brandBox = (brandContainer.querySelector('.entry-icon--brand') as HTMLElement)?.style.width;
    const fallbackBox = (fallbackContainer.querySelector('.cat-icon') as HTMLElement)?.style.width;
    expect(brandBox).toBe(fallbackBox);
  });
});

// v2.0.0 (Tahap 4): avatar xl dibesarkan 52 → 56 px oleh redesain Aurum (CHANGES-v1_11_0-ke-v2_0_0.md:
// "ukuran xl 56px"). Test v1.11.0 menunggu 52 px; MAKSUD yang dijaga tetap: xl adalah varian terbesar,
// persegi, dan lebih besar dari lg.
describe('EntryIcon — size="xl" (v2.0.0: avatar 56px; v1.11.0: 52px)', () => {
  it('brand icon dengan size="xl" berdimensi 56px (persegi) dan lebih besar dari lg (48px)', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ brandIconSlug: 'gmail' })} size="xl" />,
    );
    const wrapper = container.querySelector('.entry-icon--brand') as HTMLElement;
    expect(wrapper.style.width).toBe('56px');
    expect(wrapper.style.height).toBe('56px');

    const { container: lgContainer } = render(
      <EntryIcon entry={makeEntry({ brandIconSlug: 'gmail' })} size="lg" />,
    );
    const lgWidth = parseInt((lgContainer.querySelector('.entry-icon--brand') as HTMLElement).style.width, 10);
    expect(parseInt(wrapper.style.width, 10)).toBeGreaterThan(lgWidth);
  });

  it('fallback CategoryIcon utk size="xl" DITERJEMAHKAN ke lg (48px) — SENGAJA BEDA dari brand (56px), krn CategoryIcon tidak punya varian xl sendiri', () => {
    const { container } = render(<EntryIcon entry={makeEntry()} size="xl" />);
    const wrapper = container.querySelector('.cat-icon') as HTMLElement;
    expect(wrapper.style.width).toBe('48px'); // BUKAN 56px — lihat komentar di atas
  });

  it('brand icon size="xl" mendapat efek embossed (inset shadow ganda + outer glow warna brand)', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ brandIconSlug: 'binance' })} size="xl" />,
    );
    const wrapper = container.querySelector('.entry-icon--brand') as HTMLElement;
    expect(wrapper.style.boxShadow).toContain('inset');
    expect(wrapper.style.boxShadow.match(/inset/g)?.length).toBe(2); // dua inset: highlight + shadow
  });

  it('brand icon size="lg" (BUKAN xl) TIDAK mendapat efek embossed — tetap pakai var(--shadow-raised) polos', () => {
    const { container } = render(
      <EntryIcon entry={makeEntry({ brandIconSlug: 'binance' })} size="lg" />,
    );
    const wrapper = container.querySelector('.entry-icon--brand') as HTMLElement;
    expect(wrapper.style.boxShadow).not.toContain('inset');
  });
});
