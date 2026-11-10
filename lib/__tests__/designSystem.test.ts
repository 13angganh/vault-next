/**
 * lib/__tests__/designSystem.test.ts — Aurum Vault v2.0.0 (Tahap 2)
 *
 * Penjaga sistem desain. Masing-masing aturan di sini lahir dari temuan nyata
 * pada audit Tahap 2 (bukan teori):
 *
 *  1. Token: styles/redesign.css pernah mendefinisikan/menimpa ±110 token
 *     (satu sumber kebenaran = lib/design-tokens.ts + styles/base.css).
 *  2. z-index: ada angka mentah (5, 6, 40, 41, 300, 9998, 9999, -1, 0, 1, 2, 10)
 *     di CSS dan TSX; semua harus lewat var(--z-*).
 *  3. Warna: 46 literal warna di redesign.css; semua harus lewat var(--*).
 *  4. Font: kelas `variable` next/font dulu dipasang pada <body>, sementara
 *     --font-sans dievaluasi di :root, sehingga SELURUH teks jatuh ke serif
 *     bawaan browser (terbukti di Chromium). Wajib pada <html>.
 *  5. Fokus keyboard: cincin fokus semi-transparan (kontras 1,8:1) dan
 *     `border-radius` global pada :focus-visible mengubah bentuk elemen.
 *  6. prefers-reduced-motion: scroll halus tidak diredam.
 *  7. CSS mati dari iterasi prototipe tidak boleh kembali.
 *
 * Pemindaian CSS memakai pengupas komentar + regex sederhana (tanpa dependensi
 * baru). Setiap aturan divalidasi dengan mutation check (lihat LAPORAN-TAHAP-2.md).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fontFamily, fontSize, radius, ease, layout, zIndex } from '../design-tokens';

const ROOT = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', '__tests__'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}
const cssFiles = () => walk(path.join(ROOT, 'styles'), ['.css']);
const tsxFiles = () => [...walk(path.join(ROOT, 'components'), ['.tsx', '.ts']), ...walk(path.join(ROOT, 'app'), ['.tsx', '.ts'])];

/** Ambil isi blok bertingkat pertama untuk selector persis (mis. '[data-theme="light"]'). */
function blockOf(css: string, selector: string): string {
  const clean = stripComments(css);
  const i = clean.indexOf(selector + ' {');
  if (i < 0) throw new Error('selector tidak ditemukan: ' + selector);
  const start = clean.indexOf('{', i);
  let depth = 0;
  for (let j = start; j < clean.length; j++) {
    if (clean[j] === '{') depth++;
    else if (clean[j] === '}' && --depth === 0) return clean.slice(start + 1, j);
  }
  throw new Error('blok tidak tertutup: ' + selector);
}
// Deklarasi custom property: `--x:` didahului awal teks, '{', ';' atau spasi. (Pola longgar
// `--x:` salah mengenali selector seperti `.entry-card--expanded:hover`.)
const DECL = /(?:^|[{;\s])(--[a-z0-9-]+)\s*:/gi;
const tokenNames = (block: string) => new Set([...block.matchAll(DECL)].map((m) => m[1]));
const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** `--nama: nilai;` dengan spasi bebas (generator memberi padding rata). */
const hasToken = (css: string, name: string, value: string) => new RegExp(`${escapeRe(name)}:\\s*${escapeRe(value)};`).test(css);
const noImportant = (v: string) => v.replace(/\s*!important\s*$/, '').trim();

// ────────────────────────────────────────────────────────────────────────────
describe('Token — satu sumber kebenaran (Utang #1)', () => {
  const redesign = stripComments(read('styles/redesign.css'));

  it('redesign.css tidak punya blok :root / [data-theme] (tidak mendefinisikan/menimpa token global)', () => {
    expect(redesign).not.toMatch(/(^|[}\s,])(:root|html)\s*[\[{,]/);
    expect(redesign).not.toMatch(/\[data-theme[^\]]*\]\s*\{/);
  });

  it('satu-satunya custom property di redesign.css adalah variabel LOKAL komponen (--brand, --key)', () => {
    const defs = [...redesign.matchAll(DECL)].map((m) => m[1]);
    const unexpected = [...new Set(defs)].filter((d) => !['--brand', '--key'].includes(d));
    expect(unexpected).toEqual([]);
  });

  it('tokens.css sinkron dengan design-tokens.ts (skala teks, radius, font, ease, layout)', () => {
    const t = read('styles/tokens.css');
    for (const [k, v] of Object.entries(fontSize)) expect(hasToken(t, `--text-${k}`, v)).toBe(true);
    for (const [k, v] of Object.entries(radius)) expect(hasToken(t, `--radius-${k}`, v)).toBe(true);
    expect(hasToken(t, '--font-sans', fontFamily.sans)).toBe(true);
    expect(hasToken(t, '--font-mono', fontFamily.mono)).toBe(true);
    expect(hasToken(t, '--ease-out', ease.out)).toBe(true);
    expect(hasToken(t, '--appbar-height', layout.appbarHeight)).toBe(true);
  });

  it('skala teks v2 terkunci: 12 / 13,5 / 15 / 16,5 / 19 / 24 / 30 px', () => {
    expect([fontSize.xs, fontSize.sm, fontSize.base, fontSize.md, fontSize.lg, fontSize.xl, fontSize['2xl']]).toEqual([
      '12px', '13.5px', '15px', '16.5px', '19px', '24px', '30px',
    ]);
  });

  it('paritas tema: blok dark dan light di base.css mendefinisikan himpunan token yang SAMA', () => {
    const base = read('styles/base.css');
    const dark = tokenNames(blockOf(base, ':root,\n[data-theme="dark"]'));
    const light = tokenNames(blockOf(base, '[data-theme="light"]'));
    expect([...dark].filter((n) => !light.has(n))).toEqual([]);
    expect([...light].filter((n) => !dark.has(n))).toEqual([]);
    expect(dark.size).toBeGreaterThan(60);
  });

  it('tidak ada token yang dipakai var(--x) tanpa definisi (kecuali variabel runtime next/font, variabel lokal, --vh ber-fallback)', () => {
    const defined = new Set<string>();
    const used = new Map<string, string>();
    for (const f of [...cssFiles(), ...tsxFiles()]) {
      const raw = fs.readFileSync(f, 'utf8');
      const src = f.endsWith('.css') ? stripComments(raw) : raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of src.matchAll(DECL)) defined.add(m[1]);
      for (const m of src.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) if (m[2] === ')') used.set(m[1], path.relative(ROOT, f));
    }
    const runtime = new Set(['--font-outfit', '--font-jetbrains']); // didefinisikan kelas `variable` next/font
    const missing = [...used].filter(([n]) => !defined.has(n) && !runtime.has(n));
    expect(missing).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('z-index — semua lewat token (Utang #1)', () => {
  const Z_OK = /^(var\(--z-[a-z]+\)|calc\(var\(--z-[a-z]+\)\s*[+-]\s*\d+\)|auto|inherit|initial|unset)$/;

  it('tidak ada angka z-index mentah di CSS', () => {
    const bad: string[] = [];
    for (const f of cssFiles()) {
      if (f.endsWith('tokens.css')) continue;
      for (const m of stripComments(fs.readFileSync(f, 'utf8')).matchAll(/z-index\s*:\s*([^;}]+)/g)) {
        if (!Z_OK.test(noImportant(m[1]))) bad.push(`${path.relative(ROOT, f)}: z-index: ${m[1].trim()}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('tidak ada angka zIndex mentah di TSX/TS (style inline)', () => {
    const bad: string[] = [];
    for (const f of tsxFiles()) {
      const src = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const m of src.matchAll(/zIndex\s*:\s*(-?\d+)/g)) bad.push(`${path.relative(ROOT, f)}: zIndex: ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('level baru memakai nilai yang menggantikan angka mentah (urutan susun tidak berubah)', () => {
    expect(zIndex.behind).toBe(-1);
    expect(zIndex.base).toBe(0);
    expect(zIndex.raised).toBe(1);
    expect(zIndex.bar).toBe(5);
    expect(zIndex.popover).toBe(40);
    expect(zIndex.sheet).toBe(300);
  });

  it('hierarki: bar < sticky < dropdown < sidebar < popover < modal < sheet <= toast < top', () => {
    expect(zIndex.behind).toBeLessThan(zIndex.base);
    expect(zIndex.raised).toBeLessThan(zIndex.bar);
    expect(zIndex.bar).toBeLessThan(zIndex.sticky);
    expect(zIndex.sticky).toBeLessThan(zIndex.dropdown);
    expect(zIndex.dropdown).toBeLessThan(zIndex.sidebar);
    expect(zIndex.sidebar).toBeLessThan(zIndex.popover);
    expect(zIndex.popover).toBeLessThan(zIndex.modal);
    expect(zIndex.modal).toBeLessThan(zIndex.sheet); // OptionSheet harus di atas modal/form
    expect(zIndex.sheet).toBeLessThanOrEqual(zIndex.toast);
    expect(zIndex.toast).toBeLessThan(zIndex.top);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Warna — tanpa hardcode di lapisan v2 (Utang #1)', () => {
  const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/;

  it('redesign.css tidak berisi literal warna (hex/rgb/hsl) sama sekali', () => {
    const lines = stripComments(read('styles/redesign.css')).split(/[;{}]/).filter((l) => COLOR.test(l));
    expect(lines.map((l) => l.trim().slice(0, 80))).toEqual([]);
  });

  it('base.css: literal warna hanya boleh di dalam definisi token (--x: ...)', () => {
    const decls = stripComments(read('styles/base.css')).split(/[;{}]/).filter((l) => COLOR.test(l) && !/^\s*--[a-z0-9-]+\s*:/i.test(l.replace(/^\s+/, '')));
    // satu-satunya sisa yang sah: rgba() pada ::selection/scrollbar tidak ada; harus kosong
    expect(decls.map((l) => l.trim().slice(0, 80))).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Font — next/font bekerja di :root (temuan kritis Tahap 2)', () => {
  const layoutSrc = read('app/layout.tsx').replace(/\/\*[\s\S]*?\*\//g, '');

  it('kelas variable Inter & JetBrains Mono dipasang pada <html>, BUKAN <body>', () => {
    expect(layoutSrc).toMatch(/<html[^>]*className=\{`\$\{inter\.variable\} \$\{jetbrainsMono\.variable\}`\}/);
    expect(layoutSrc).not.toMatch(/<body[^>]*(inter|jetbrainsMono)\.variable/);
  });

  it('token font memakai variabel next/font dengan fallback bernama', () => {
    expect(fontFamily.sans).toMatch(/^var\(--font-outfit\), 'Inter', /);
    expect(fontFamily.mono).toMatch(/^var\(--font-jetbrains\), 'JetBrains Mono', /);
  });

  it('bobot yang dimuat mencakup bobot yang dipakai CSS (Inter 400–800; Mono 400/500/600/700)', () => {
    const weights = (fn: string): string[] => {
      const m = new RegExp(`${fn}\\(\\{[\\s\\S]*?weight:\\s*\\[([^\\]]*)\\]`).exec(read('app/layout.tsx'));
      return m ? (m[1].match(/\d+/g) ?? []) : [];
    };
    const inter = weights('Inter');
    const mono = weights('JetBrains_Mono');
    expect(inter).toEqual(['400', '500', '600', '700', '800']);
    expect(mono).toEqual(expect.arrayContaining(['400', '500', '600', '700']));
  });

  it('kontrol form mewarisi font (tanpa reset, <button> memakai Arial bawaan browser)', () => {
    expect(stripComments(read('styles/base.css'))).toMatch(/button\s*,\s*input\s*,\s*select\s*,\s*textarea\s*\{\s*font-family:\s*inherit;\s*\}/);
  });

  it('tidak ada font-family literal yang melewati token (kecuali app/global-error.tsx yang berdiri sendiri)', () => {
    const bad: string[] = [];
    for (const f of cssFiles()) {
      if (f.endsWith('tokens.css')) continue;
      for (const m of stripComments(fs.readFileSync(f, 'utf8')).matchAll(/font-family\s*:\s*([^;}]+)/g)) {
        const v = noImportant(m[1]);
        if (!/^(var\(--font-(sans|mono)\)|inherit)$/.test(v)) bad.push(`${path.relative(ROOT, f)}: ${v}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('Aksesibilitas — fokus keyboard dan reduced-motion', () => {
  const base = stripComments(read('styles/base.css'));
  const focus = /:focus-visible\s*\{([^}]*)\}/.exec(base)?.[1] ?? '';

  it('cincin fokus memakai --gold solid (bukan --gold-border semi-transparan)', () => {
    expect(focus).toMatch(/outline:\s*2px solid var\(--gold\)\s*;/);
  });

  it(':focus-visible global tidak mengubah border-radius elemen (bentuk pil/lingkaran tetap)', () => {
    expect(focus).not.toMatch(/border-radius/);
  });

  it('scroll halus diredam pada prefers-reduced-motion: reduce', () => {
    expect(base).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*auto;\s*\}\s*\}/);
  });

  it('aturan reduced-motion global untuk animasi/transisi tetap ada (lock.css)', () => {
    const lock = stripComments(read('styles/components/lock.css'));
    expect(lock).toMatch(/prefers-reduced-motion: reduce[\s\S]*?animation-duration:\s*\.?0?\.01ms\s*!important/);
    expect(lock).toMatch(/transition-duration:\s*\.?0?\.01ms\s*!important/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('CSS mati dari iterasi prototipe tidak boleh kembali (Utang #4)', () => {
  // Kelas pengganti yang dipakai komponen v2 (sbx-*, st-*, ls2-*, vlh-*, ef2-*) tetap ada.
  const all = cssFiles().map((f) => stripComments(fs.readFileSync(f, 'utf8'))).join('\n');
  const REMOVED = [
    '.vault-cat-pill', '.vault-overview', '.ef2-cats', '.st-seg', '.st-select',
    '.sidebar-item', '.settings-section__header', '.vault-sort-menu', '.ls-logo',
  ];
  it.each(REMOVED)('selector %s sudah tidak ada di CSS manapun', (sel) => {
    const re = new RegExp(sel.replace('.', '\\.') + '(?![\\w-])');
    expect(all).not.toMatch(re);
  });
  it('kelas pengganti v2 masih ada', () => {
    for (const c of ['.sbx-item', '.st-row', '.ls2-card', '.vlh-chip', '.ef2-top', '.os-overlay']) {
      expect(all).toContain(c);
    }
  });
});
