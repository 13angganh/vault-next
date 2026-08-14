/**
 * lib/__tests__/zIndexTokens.test.ts — Vault Next
 *
 * v1.9.1: token --z-* (sticky, content, dropdown, sidebar, modal, toast,
 * top) dipakai di 11 file CSS berbeda (sidebar, modal, lock, dropdown,
 * header sticky, toast, entry unlock overlay) tapi TIDAK SATU PUN pernah
 * didefinisikan nilainya di lib/design-tokens.ts maupun styles/tokens.css
 * sebelum fix ini. var() yang gagal resolve membuat `z-index` jatuh ke
 * initial value `auto` — stacking order semua elemen ini jadi ditentukan
 * urutan DOM, bukan hierarki yang dimaksud. Dilaporkan pengguna: membuka
 * sidebar navigasi, tampilan "Semua Entri" di baliknya tetap terlihat
 * dan tumpang-tindih, sidebar sulit diklik karena konten di baliknya
 * menerima pointer event lebih dulu.
 *
 * Ditemukan juga: .sidebar & .sidebar-overlay memakai var(--z-toast) —
 * token yang salah pilih secara semantik selain tidak terdefinisi,
 * seharusnya var(--z-sidebar) (sudah dipakai versi mobile/.drawer-overlay
 * untuk komponen yang sama).
 *
 * Test ini memverifikasi (1) ketujuh token benar-benar ada di
 * tokens.css dengan nilai numerik valid, dan (2) sidebar memakai token
 * yang semantiknya benar.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { zIndex } from '../design-tokens';

describe('Z-index tokens — semua terdefinisi dengan nilai numerik valid (v1.9.1 fix)', () => {
  const tokensCss = fs.readFileSync(
    path.resolve(__dirname, '../../styles/tokens.css'),
    'utf8',
  );

  it.each(Object.keys(zIndex))(
    '--z-%s ada di tokens.css dengan nilai numerik yang sama dengan lib/design-tokens.ts',
    (key) => {
      const re = new RegExp(`--z-${key}:\\s*([0-9]+);`);
      const match = tokensCss.match(re);
      expect(match, `--z-${key} tidak ditemukan di styles/tokens.css`).not.toBeNull();
      const cssValue = Number(match?.[1]);
      expect(cssValue).toBe(zIndex[key as keyof typeof zIndex]);
    },
  );

  it('urutan hierarki logis: sticky/content < dropdown < sidebar < modal < toast < top', () => {
    expect(zIndex.sticky).toBeLessThan(zIndex.dropdown);
    expect(zIndex.content).toBeLessThan(zIndex.dropdown);
    expect(zIndex.dropdown).toBeLessThan(zIndex.sidebar);
    expect(zIndex.sidebar).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.toast);
    expect(zIndex.toast).toBeLessThan(zIndex.top);
  });
});

describe('Sidebar — memakai token z-index yang semantiknya benar (v1.9.1 fix)', () => {
  const sidebarCss = fs.readFileSync(
    path.resolve(__dirname, '../../styles/components/sidebar.css'),
    'utf8',
  );

  it('.sidebar memakai var(--z-sidebar), bukan var(--z-toast)', () => {
    const match = sidebarCss.match(/\.sidebar\s*\{[^}]*z-index:\s*([^;]+);/);
    expect(match, '.sidebar rule atau z-index-nya tidak ditemukan').not.toBeNull();
    expect(match?.[1].trim()).toBe('var(--z-sidebar)');
  });

  it('.sidebar-overlay berada tepat 1 level di bawah .sidebar (calc(var(--z-sidebar) - 1))', () => {
    const match = sidebarCss.match(/\.sidebar-overlay\s*\{[^}]*z-index:\s*([^;]+);/);
    expect(match, '.sidebar-overlay rule atau z-index-nya tidak ditemukan').not.toBeNull();
    expect(match?.[1].trim()).toBe('calc(var(--z-sidebar) - 1)');
  });
});
