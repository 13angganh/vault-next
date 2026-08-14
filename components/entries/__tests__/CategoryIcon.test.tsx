/**
 * components/entries/__tests__/CategoryIcon.test.tsx — Vault Next
 *
 * v1.9.1: dua bug ditemukan bersamaan di CategoryIcon.tsx:
 *
 * 1. Warna icon (CAT_ICON_COLORS) memakai string CSS var literal
 *    ('var(--cat-sosmed)', dst) yang TIDAK PERNAH didefinisikan di
 *    styles/tokens.css maupun lib/design-tokens.ts di seluruh proyek.
 *    Prop `color` Lucide meneruskan string itu langsung ke atribut SVG
 *    `stroke`; custom property yang tidak terdefinisi membuat stroke
 *    tidak ternilai sama sekali — icon 100% tidak terlihat di semua
 *    entri vault (dilaporkan pengguna via screenshot: kotak warna
 *    latar tampil, tapi tanpa simbol apa pun di dalamnya).
 *
 * 2. Kategori 'note' ("Catatan") ada di DEFAULT_CATEGORIES dan punya
 *    field form sendiri (FIELDS_BY_CAT.note di EntryForm.tsx), tapi
 *    tidak pernah didaftarkan di CAT_ICONS/CAT_HEX — tombolnya tetap
 *    muncul di grid kategori tapi jatuh ke fallback ikon "lainnya"
 *    (MoreHorizontal), bukan ikon yang semantiknya sesuai.
 *
 * Test ini memverifikasi setiap kategori di DEFAULT_CATEGORIES (bukan
 * daftar hardcode terpisah yang bisa basi) menghasilkan warna icon
 * hex/rgb solid yang valid, dan bahwa tidak ada literal var(--cat-*)
 * tersisa di source file sama sekali.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import { CategoryIcon } from '../CategoryIcon';
import { DEFAULT_CATEGORIES } from '@/lib/types';

describe('CategoryIcon — warna icon per kategori default (v1.9.1 fix)', () => {
  it('source file tidak lagi mengandung literal var(--cat-*) di KODE aktif (komentar penjelas boleh menyebutnya)', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../CategoryIcon.tsx'),
      'utf8',
    );
    // Strip blok komentar /* ... */ dan baris // sebelum memeriksa —
    // file ini sengaja punya komentar historis yang MENYEBUTKAN
    // 'var(--cat-sosmed)' sebagai contoh bug lama untuk dokumentasi;
    // yang tidak boleh ada adalah pola itu di kode yang benar-benar
    // dieksekusi.
    const codeOnly = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(codeOnly).not.toMatch(/var\(--cat-/);
  });

  it.each(DEFAULT_CATEGORIES.map((c) => c.id))(
    'kategori "%s" merender elemen <svg> dengan stroke hex/rgb solid, bukan kosong',
    (catId) => {
      const { container } = render(<CategoryIcon catId={catId} />);
      const svg = container.querySelector('svg');
      expect(svg, `CategoryIcon untuk catId="${catId}" tidak merender <svg> sama sekali`).not.toBeNull();

      const stroke = svg?.getAttribute('stroke') ?? '';
      // Harus hex (#rrggbb) atau rgb/rgba(...) — TIDAK BOLEH kosong,
      // "none", atau string var(--...) yang tidak pernah diresolusi.
      expect(stroke).toMatch(/^(#[0-9a-fA-F]{3,8}|rgba?\()/);
      expect(stroke).not.toBe('');
      expect(stroke).not.toContain('var(--cat-');
    },
  );

  it('kategori "note" (Catatan) memakai ikon StickyNote, bukan fallback MoreHorizontal', () => {
    const { container } = render(<CategoryIcon catId="note" />);
    // lucide-react membubuhkan nama ikon lewat class "lucide-<kebab-name>"
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('sticky-note');
  });

  it('DEFAULT_CATEGORIES tidak berubah tanpa sepengetahuan test ini (guard jumlah)', () => {
    // Jika kategori baru ditambahkan di lib/types.ts, test it.each di atas
    // otomatis mencakupnya — guard ini hanya memastikan angkanya tercatat
    // secara sadar, bukan diam-diam berubah.
    expect(DEFAULT_CATEGORIES.length).toBe(9);
  });
});
