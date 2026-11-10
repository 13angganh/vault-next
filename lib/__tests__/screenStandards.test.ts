/**
 * lib/__tests__/screenStandards.test.ts — Aurum Vault v2.0.0 (Tahap 3)
 *
 * Penjaga standar layar. Setiap aturan lahir dari temuan terukur Tahap 3 (Chromium sungguhan):
 *  1. 129 literal warna tersisa di 9 file CSS v1.11.0 -> semua lewat var(--*) / color-mix().
 *  2. Teks < 13px di 30+ selektor (label bottom nav 10,5px, dst.).
 *  3. Target sentuh < 44px di 25 selektor (saklar, tombol tutup, chip, dst.).
 *  4. useRipple menarget `.sidebar-item` yang sudah tidak ada (Sidebar v2 memakai `.sbx-item`).
 *
 * Pemindaian CSS memakai parser postcss (dependensi transitif Next.js; bukan regex) — pelajaran Tahap 2:
 * regex menelan teks di komentar dan salah mengenali selector. Setiap aturan divalidasi dengan mutation
 * check (lihat LAPORAN-TAHAP-3.md).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import postcss from 'postcss';
import { fontSize } from '../design-tokens';

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Urutan impor persis seperti styles/globals.css (yang belakangan menang pada spesifisitas sama). */
const IMPORT_ORDER = [
  'styles/base.css', 'styles/layout.css',
  'styles/components/animations.css', 'styles/components/ui.css', 'styles/components/modal.css',
  'styles/components/sidebar.css', 'styles/components/lock.css', 'styles/components/entries.css',
  'styles/components/brand-picker.css', 'styles/components/settings.css', 'styles/redesign.css',
];

const COLOR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe('Tahap 3 — tidak ada literal warna di CSS (selain definisi token di base.css)', () => {
  const files = IMPORT_ORDER.filter((f) => f !== 'styles/base.css');
  it.each(files)('%s tidak memuat literal warna (hex/rgb/rgba/hsl)', (rel) => {
    const offenders: string[] = [];
    postcss.parse(read(rel)).walkDecls((d) => {
      if (COLOR_LITERAL.test(d.value)) offenders.push(`${d.parent && 'selector' in d.parent ? (d.parent as postcss.Rule).selector : '?'} { ${d.prop}: ${d.value} }`);
    });
    expect(offenders).toEqual([]);
  });
});

describe('Tahap 3 — ukuran teks minimum 13px', () => {
  const PX_OF_TOKEN: Record<string, number> = Object.fromEntries(
    Object.entries(fontSize).map(([k, v]) => [`--text-${k}`, parseFloat(String(v))]),
  );
  it('tidak ada deklarasi font-size < 13px (px literal maupun token --text-*)', () => {
    const offenders: string[] = [];
    for (const rel of IMPORT_ORDER) {
      postcss.parse(read(rel)).walkDecls('font-size', (d) => {
        const v = d.value.trim();
        let px: number | null = null;
        const m = v.match(/^([\d.]+)px$/);
        if (m) px = parseFloat(m[1]);
        const t = v.match(/^var\((--text-[a-z0-9]+)\)$/);
        if (t && t[1] in PX_OF_TOKEN) px = PX_OF_TOKEN[t[1]];
        if (px !== null && px < 13) offenders.push(`${rel}: ${(d.parent as postcss.Rule).selector} { font-size: ${v} } = ${px}px`);
      });
    }
    expect(offenders).toEqual([]);
  });
  it('token --text-xs (12px) tidak dipakai untuk teks mana pun (di CSS maupun inline TSX)', () => {
    for (const rel of IMPORT_ORDER) expect(read(rel)).not.toMatch(/font-size\s*:\s*var\(--text-xs\)/);
    for (const rel of ['components/lock/RecoveryPanel.tsx', 'components/common/LoadingScreen.tsx']) {
      expect(read(rel)).not.toContain("'var(--text-xs)'");
    }
  });
});

describe('Tahap 3 — target sentuh minimum 44px', () => {
  /** Nilai terakhir (menurut urutan impor) dari properti ukuran untuk selector persis. */
  function finalPx(selector: string, prop: string): number | null {
    let val: number | null = null;
    for (const rel of IMPORT_ORDER) {
      postcss.parse(read(rel)).walkRules((r) => {
        if (r.parent?.type !== 'root') return;
        if (!r.selectors.map((s) => s.replace(/\s+/g, ' ').trim()).includes(selector)) return;
        r.walkDecls(prop, (d) => { const m = d.value.trim().match(/^([\d.]+)px$/); if (m) val = parseFloat(m[1]); });
      });
    }
    return val;
  }
  // [selector, properti yang harus >= 44]
  const TARGETS: Array<[string, string[]]> = [
    ['.ibtn', ['width', 'height']], ['.os-close', ['width', 'height']], ['.st-back', ['width', 'height']],
    ['.ef2-icon', ['width', 'height']], ['.vlh-chip', ['height']], ['.app-header__search', ['height']],
    ['.entry-card__qc-btn', ['width', 'height']], ['.entry-field__btn', ['width', 'height']],
    ['.rp-tool', ['height']], ['.sbx-close', ['width', 'height']], ['.sbx-pill', ['height']],
    ['.ls2-tab', ['height']], ['.ls2-link', ['min-height']], ['.ls-theme-btn', ['width', 'height']],
    ['.modal__close', ['width', 'height']], ['.confirm-card .confirm-close', ['width', 'height']],
    ['.vl-unlock-close', ['width', 'height']], ['.pw-gen__close', ['width', 'height']],
    ['.settings-toggle', ['height']], ['.setup-eye-btn', ['width', 'height']],
    ['.form-pw-toggle', ['width', 'height']], ['.form-pw-gen-link', ['min-height']],
    ['.field__wrap input', ['min-height']], ['.ef2-name input', ['min-height']],
    ['.cat-manager-form-body input', ['min-height']], ['.field-editor__reset-link', ['min-height']],
  ];
  it.each(TARGETS)('%s: %j >= 44px', (selector, props) => {
    for (const p of props) {
      const v = finalPx(selector, p);
      expect(v, `${selector} ${p}`).not.toBeNull();
      expect(v as number).toBeGreaterThanOrEqual(44);
    }
  });
  it('saklar tidak lagi diperbesar dengan transform: scale (rect ukur harus = ukuran CSS)', () => {
    let scaled = false;
    for (const rel of IMPORT_ORDER) {
      postcss.parse(read(rel)).walkRules((r) => {
        if (r.selectors.some((s) => s.trim() === '.settings-toggle')) r.walkDecls('transform', (d) => { if (/scale/.test(d.value)) scaled = true; });
      });
    }
    expect(scaled).toBe(false);
  });
});

describe('Tahap 3 — ripple sidebar v2', () => {
  it('useRipple menarget .sbx-item (bukan .sidebar-item yang sudah dihapus)', () => {
    const src = read('lib/hooks/useRipple.ts');
    expect(src).toContain('.sbx-item');
    expect(src).not.toContain('.sidebar-item');
  });
  it('.sbx-item berposisi relatif dan overflow hidden agar riak terpotong rapi', () => {
    let pos = '', ov = '';
    postcss.parse(read('styles/redesign.css')).walkRules((r) => {
      if (r.selectors.some((s) => s.trim() === '.sbx-item')) r.walkDecls((d) => { if (d.prop === 'position') pos = d.value; if (d.prop === 'overflow') ov = d.value; });
    });
    expect(pos).toBe('relative');
    expect(ov).toBe('hidden');
  });
});

describe('Tahap 3 — .shell-view-anim tidak menahan transform (overlay fixed harus menutup seluruh layar)', () => {
  it('animation-fill-mode bukan both/forwards (keyframe akhir transform: scale(1) membuat containing block)', () => {
    let anim = '';
    postcss.parse(read('styles/layout.css')).walkRules((r) => {
      if (r.selectors.some((s) => s.trim() === '.shell-view-anim')) r.walkDecls('animation', (d) => { anim = d.value; });
    });
    expect(anim).not.toBe('');
    expect(anim).not.toMatch(/\b(both|forwards)\b/);
  });
});

describe('Tahap 3 (D6) — kontras teks tema terang >= 4,5:1 pada pemakaian nyata yang terukur', () => {
  /** Nilai token pada blok [data-theme="light"] di base.css. */
  const light: Record<string, string> = {};
  postcss.parse(read('styles/base.css')).walkRules((r) => {
    if (r.selector.trim() === '[data-theme="light"]') r.walkDecls((d) => { if (d.prop.startsWith('--')) light[d.prop] = d.value.trim(); });
  });
  const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
  const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  // [token, latar nyata yang terukur di Chromium (Tahap 3)]
  const PAIRS: Array<[string, string]> = [
    ['--muted', '#e6e2d7'], ['--muted', '#f1ebdc'],
    ['--red', '#f2e1db'], ['--red', '#f3ddd7'], ['--red', '#f6f4ef'],
    ['--teal', '#e3ede2'], ['--gold', '#f5efe4'], ['--gold-text', '#e7decc'],
    ['--str-2', '#fcfbf8'], ['--str-3', '#fcfbf8'], ['--str-4', '#fcfbf8'],
    ['--str-5', '#fcfbf8'], ['--str-6', '#fcfbf8'], ['--str-7', '#fcfbf8'], ['--str-7', '#ffffff'],
  ];
  it.each(PAIRS)('%s pada %s >= 4,5:1', (token, bg) => {
    expect(light[token], token).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(ratio(light[token], bg)).toBeGreaterThanOrEqual(4.5);
  });
});
