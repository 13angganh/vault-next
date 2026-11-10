/**
 * components/settings/__tests__/AttributionPanel.test.tsx — Aurum Vault v2.0.0 (Tahap 5)
 *
 * MAKSUD. Isi sheet "Atribusi & lisensi" (AttributionPanel): versi + lisensi aplikasi, dan satu
 * kartu per sumber logo dengan lisensi, daftar logo (untuk sumber yang punya kewajiban/batasan),
 * catatan lisensi, dan dua tautan keluar. Layar murni statis: tanpa tombol, tanpa tulisan ke
 * penyimpanan, tautan aman (noopener noreferrer).
 *
 * STANDAR UKURAN (Tahap 3) untuk layar baru dijaga lewat parser postcss atas styles/redesign.css:
 * teks >= 13px, tautan >= 44px, tanpa literal warna / token baru; kontras tema terang DIHITUNG dari
 * nilai token (bukan diukur di browser — jsdom tidak merender CSS).
 *
 * Aturan konvensi: elemen dicari lewat role/nama/teks; daftar logo dibandingkan dengan LITERAL
 * independen (bukan dihitung ulang dari fungsi yang sama). Class CSS hanya dipakai pada test CSS.
 *
 * Pengecualian pemakaian class (tidak ada padanan a11y): warna lencana lisensi hanya terbaca lewat
 * kelas varian `attr-badge--{free|share|noncommercial}`; kontras diturunkan dari aturan CSS ASLI
 * (bukan daftar token yang ditulis ulang di test), supaya mengganti warna di CSS ikut terdeteksi.
 *
 * RIWAYAT. Baru di Tahap 5. Run akhir mutation check menghasilkan ERROR-SUITE pada CS05 (helper kontras
 * melempar galat saat koleksi); diganti asersi biasa `bukanToken`. Mutation check awal meloloskan 6 mutasi (pembuat sumber, kalimat enam
 * logo lama, kelas lencana, deskripsi baris, dan dua warna teks di CSS); semuanya kini dijaga.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';
import postcss from 'postcss';
import { AttributionPanel } from '../AttributionPanel';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { ATTRIBUTION_SOURCES, APP_LICENSE_TEXT, LOGO_CHANGES_NOTE } from '@/lib/attribution';

const ROOT = path.resolve(__dirname, '../../..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Kartu sumber = <section> bernama judul h5 sumber itu. */
const kartu = (nama: string) => screen.getByRole('region', { name: nama });

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe('AttributionPanel — aplikasi', () => {
  it('menampilkan nama aplikasi, versi, dan teks lisensi aplikasi', () => {
    render(<AttributionPanel />);
    const app = within(screen.getByRole('region', { name: 'Aplikasi' }));
    expect(app.getByText(APP_NAME)).toBeInTheDocument();
    expect(app.getByText(`Versi ${APP_VERSION}`)).toBeInTheDocument();
    expect(app.getByText(APP_LICENSE_TEXT)).toBeInTheDocument();
  });

  it('versi yang tampil mengikuti APP_VERSION (2.0.0), bukan angka yang ditulis ulang', () => {
    render(<AttributionPanel />);
    expect(APP_VERSION).toBe('2.0.0');
    expect(screen.getByText('Versi 2.0.0')).toBeInTheDocument();
  });
});

describe('AttributionPanel — logo brand', () => {
  it('judul bagian "Logo brand" dan catatan: merek milik pemegangnya + perubahan yang dilakukan', () => {
    render(<AttributionPanel />);
    expect(screen.getByRole('heading', { level: 4, name: 'Logo brand' })).toBeInTheDocument();
    expect(screen.getByText(/Merek dan logo tetap milik\s+pemegang merek masing-masing/)).toBeInTheDocument();
    expect(screen.getByText(/tidak berafiliasi dengan dan tidak didukung oleh mereka/)).toBeInTheDocument();
    expect(screen.getByText(LOGO_CHANGES_NOTE)).toBeInTheDocument();
  });

  it('tepat enam kartu sumber, berurutan sesuai data, masing-masing berjudul h5', () => {
    render(<AttributionPanel />);
    const judul = screen.getAllByRole('heading', { level: 5 }).map((h) => h.textContent);
    expect(judul).toEqual(['Simple Icons', 'Web3 Icons', 'Remix Icon', 'SVG Logos', 'Arcticons', 'idn-finlogos 2.5.0']);
    expect(judul).toEqual(ATTRIBUTION_SOURCES.map((s) => s.name));
  });

  it('lencana lisensi tiap kartu', () => {
    render(<AttributionPanel />);
    const harapan: Array<[string, string]> = [
      ['Simple Icons', 'CC0 1.0'], ['Web3 Icons', 'MIT'], ['Remix Icon', 'Apache 2.0'],
      ['SVG Logos', 'CC0 1.0'], ['Arcticons', 'CC BY-SA 4.0'], ['idn-finlogos 2.5.0', 'CC BY-NC 4.0'],
    ];
    for (const [nama, lisensi] of harapan) expect(within(kartu(nama)).getByText(lisensi, { selector: 'span' })).toBeInTheDocument();
  });

  it('daftar logo per sumber (literal independen); Simple Icons tidak mendaftar nama (kewajiban atribusi tidak ada)', () => {
    render(<AttributionPanel />);
    expect(within(kartu('Web3 Icons')).getByText('Coinbase, Trust Wallet, Bitget, Gate.io, Solflare, Phantom, XRP, USDC (USD Coin), TRX (TRON)')).toBeInTheDocument();
    expect(within(kartu('Remix Icon')).getByText('Grok')).toBeInTheDocument();
    expect(within(kartu('SVG Logos')).getByText('MetaMask')).toBeInTheDocument();
    expect(within(kartu('Arcticons')).getByText('MEXC, BingX, Blue Wallet, WeTV, Maxim, Traveloka')).toBeInTheDocument();
    // idn-finlogos: 27 nama, ada DANA dan BRImo, tidak ada MetaMask/Grok
    const idn = kartu('idn-finlogos 2.5.0');
    const daftar = within(idn).getByText(/^DANA, OVO, GoPay,/).textContent ?? '';
    const nama = daftar.split(', ');
    expect(nama).toHaveLength(27);
    expect(nama).toContain('BRImo (BRI)');
    expect(nama).toContain('PLN Mobile');
    expect(nama).not.toContain('MetaMask');
    expect(nama).not.toContain('Grok');
    // Simple Icons: tidak ada paragraf daftar nama (hanya meta jumlah + catatan)
    expect(within(kartu('Simple Icons')).queryByText(/Claude/)).not.toBeInTheDocument();
  });

  it('jumlah logo per kartu: 111 / 9 / 1 / 1 / 6 / 27 (total 155 = seluruh pustaka)', () => {
    render(<AttributionPanel />);
    const jumlah = (nama: string) => {
      const m = (within(kartu(nama)).getByText(/^\d+ logo/).textContent ?? '').match(/^(\d+) logo/);
      return m ? Number(m[1]) : -1;
    };
    const angka = ['Simple Icons', 'Web3 Icons', 'Remix Icon', 'SVG Logos', 'Arcticons', 'idn-finlogos 2.5.0'].map(jumlah);
    expect(angka).toEqual([111, 9, 1, 1, 6, 27]);
    expect(angka.reduce((a, b) => a + b, 0)).toBe(155);
  });

  it('baris meta tiap kartu: jumlah logo + pembuat (literal independen)', () => {
    render(<AttributionPanel />);
    const meta: Array<[string, string]> = [
      ['Simple Icons', '111 logo (semua yang tidak tercantum di sumber lain) · oleh Komunitas Simple Icons'],
      ['Web3 Icons', '9 logo · oleh 0xa3k5'],
      ['Remix Icon', '1 logo · oleh Remix Design'],
      ['SVG Logos', '1 logo · oleh Gil Barbara'],
      ['Arcticons', '6 logo · oleh Donnnno dan tim Arcticons'],
      ['idn-finlogos 2.5.0', '27 logo · oleh Hafidz Noor Fauzi (kurasi koleksi)'],
    ];
    for (const [nama, teks] of meta) expect(within(kartu(nama)).getByText(teks), nama).toBeInTheDocument();
  });

  it('kartu Simple Icons menjelaskan bahwa enam logonya berasal dari versi lama paket (tetap CC0)', () => {
    render(<AttributionPanel />);
    expect(within(kartu('Simple Icons')).getByText(/Enam logo berasal dari versi lama paket ini dan tetap CC0\./)).toBeInTheDocument();
  });

  it('warna lencana mengikuti nada lisensi: bebas (CC0/MIT/Apache), berbagi-serupa, nonkomersial', () => {
    render(<AttributionPanel />);
    const varian: Array<[string, string, string]> = [
      ['Simple Icons', 'CC0 1.0', 'attr-badge--free'], ['Web3 Icons', 'MIT', 'attr-badge--free'],
      ['Remix Icon', 'Apache 2.0', 'attr-badge--free'], ['SVG Logos', 'CC0 1.0', 'attr-badge--free'],
      ['Arcticons', 'CC BY-SA 4.0', 'attr-badge--share'], ['idn-finlogos 2.5.0', 'CC BY-NC 4.0', 'attr-badge--noncommercial'],
    ];
    for (const [nama, lisensi, kelas] of varian) {
      const lencana = within(kartu(nama)).getByText(lisensi, { selector: 'span' });
      expect(lencana.classList.contains(kelas), `${nama} → ${kelas}`).toBe(true);
      expect(lencana.classList.contains('attr-badge')).toBe(true);
    }
  });

  it('batasan lisensi tampil di kartunya: nonkomersial (idn-finlogos) dan berbagi-serupa (Arcticons)', () => {
    render(<AttributionPanel />);
    expect(within(kartu('idn-finlogos 2.5.0')).getByText(/Hanya untuk penggunaan nonkomersial\./)).toBeInTheDocument();
    expect(within(kartu('idn-finlogos 2.5.0')).getByText(/memerlukan izin pemegang merek/)).toBeInTheDocument();
    expect(within(kartu('Arcticons')).getByText(/dibagikan dengan lisensi yang sama \(CC BY-SA 4\.0\)/)).toBeInTheDocument();
    // Simple Icons / SVG Logos: domain publik
    expect(within(kartu('Simple Icons')).getByText(/Domain publik \(CC0\)/)).toBeInTheDocument();
    expect(within(kartu('SVG Logos')).getByText(/Domain publik \(CC0\)/)).toBeInTheDocument();
  });
});

describe('AttributionPanel — tautan keluar dan sifat statis', () => {
  const HREF: Record<string, [string, string]> = {
    'Simple Icons':       ['https://github.com/simple-icons/simple-icons', 'https://creativecommons.org/publicdomain/zero/1.0/'],
    'Web3 Icons':         ['https://github.com/0xa3k5/web3icons', 'https://github.com/0xa3k5/web3icons/blob/main/LICENCE'],
    'Remix Icon':         ['https://github.com/cyberalien/RemixIcon', 'https://www.apache.org/licenses/LICENSE-2.0'],
    'SVG Logos':          ['https://github.com/gilbarbara/logos', 'https://creativecommons.org/publicdomain/zero/1.0/'],
    'Arcticons':          ['https://github.com/Arcticons-Team/Arcticons', 'https://creativecommons.org/licenses/by-sa/4.0/'],
    'idn-finlogos 2.5.0': ['https://github.com/hafidznoor/idn-finlogos', 'https://creativecommons.org/licenses/by-nc/4.0/'],
  };

  it.each(Object.entries(HREF))('%s: dua tautan (situs sumber + teks lisensi) dengan alamat yang benar', (nama, [sumber, lisensi]) => {
    render(<AttributionPanel />);
    const k = within(kartu(nama));
    expect(k.getByRole('link', { name: `Situs sumber ${nama}` })).toHaveAttribute('href', sumber);
    expect(k.getByRole('link', { name: `Teks lisensi ${nama}` })).toHaveAttribute('href', lisensi);
  });

  it('semua tautan: tab baru + rel noopener noreferrer, total 12', () => {
    render(<AttributionPanel />);
    const tautan = screen.getAllByRole('link');
    expect(tautan).toHaveLength(12);
    for (const a of tautan) {
      expect(a, a.getAttribute('href') ?? '').toHaveAttribute('target', '_blank');
      const rel = (a.getAttribute('rel') ?? '').split(/\s+/);
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
      expect(a.getAttribute('href') ?? '').toMatch(/^https:\/\//);
    }
  });

  it('tidak ada tombol, kolom isian, atau elemen yang mengembang (layar murni baca)', () => {
    const { container } = render(<AttributionPanel />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelector('input, textarea, select, [aria-expanded]')).toBeNull();
  });

  it('merender tidak menulis apa pun ke localStorage maupun sessionStorage (tanpa kunci baru)', () => {
    render(<AttributionPanel />);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('AttributionPanel — standar ukuran layar baru (CSS, lewat parser postcss)', () => {
  const css = postcss.parse(read('styles/redesign.css'));
  /** Aturan tingkat-akar yang selektornya diawali .attr- */
  const aturanAttr: postcss.Rule[] = [];
  css.walkRules((r) => { if (r.parent?.type === 'root' && r.selectors.some((s) => s.trim().startsWith('.attr-'))) aturanAttr.push(r); });

  it('blok .attr-* ada (panel tidak tanpa gaya)', () => {
    expect(aturanAttr.length).toBeGreaterThanOrEqual(15);
  });

  it('semua font-size .attr-* >= 13px', () => {
    const kecil: string[] = [];
    for (const r of aturanAttr) r.walkDecls('font-size', (d) => {
      const m = d.value.trim().match(/^([\d.]+)px$/);
      if (!m || parseFloat(m[1]) < 13) kecil.push(`${r.selector} { font-size: ${d.value} }`);
    });
    expect(kecil).toEqual([]);
  });

  it('.attr-link (target sentuh) min-height >= 44px', () => {
    let tinggi = 0;
    for (const r of aturanAttr) if (r.selectors.map((s) => s.trim()).includes('.attr-link')) r.walkDecls('min-height', (d) => { tinggi = parseFloat(d.value); });
    expect(tinggi).toBeGreaterThanOrEqual(44);
  });

  it('.attr-* tidak mendefinisikan token (properti --*) dan tidak memakai font-family/z-index/literal warna', () => {
    const melanggar: string[] = [];
    for (const r of aturanAttr) r.walkDecls((d) => {
      if (d.prop.startsWith('--') || d.prop === 'font-family' || d.prop === 'z-index' || /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(d.value)) melanggar.push(`${r.selector} { ${d.prop}: ${d.value} }`);
    });
    expect(melanggar).toEqual([]);
  });
});

describe('AttributionPanel — kontras teks tema terang >= 4,5:1 (dihitung dari token, bukan diukur di browser)', () => {
  const light: Record<string, string> = {};
  postcss.parse(read('styles/base.css')).walkRules((r) => {
    if (r.selector.trim() === '[data-theme="light"]') r.walkDecls((d) => { if (d.prop.startsWith('--')) light[d.prop] = d.value.trim().replace(/\s*\/\*.*$/, ''); });
  });
  type RGB = [number, number, number];
  const hexRgb = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a: RGB, b: RGB) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  /** warna `rgba(r,g,b,a)` (a = .11 atau 0.11) di atas latar opak */
  const over = (rgba: string, bg: RGB): RGB => {
    const m = rgba.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
    if (!m) throw new Error(`bukan rgba: ${rgba}`);
    const a = parseFloat(m[4]);
    return [0, 1, 2].map((i) => Math.round(Number(m[i + 1]) * a + bg[i] * (1 - a))) as RGB;
  };
  const tint = (hex: string, persen: number, bg: RGB): RGB => { const [r, g, b] = hexRgb(hex); return over(`rgba(${r},${g},${b},${persen / 100})`, bg); };
  // Latar nyata panel: gradien modal (--card-bg-1 → --card-bg-3) dan kartu kaca di atasnya
  const LATAR: Array<[string, RGB]> = [
    ['modal atas', hexRgb('#ffffff')], ['modal bawah', hexRgb('#f8f5ed')], ['kartu kaca', hexRgb('#fcfbf8')],
  ];

  it('nilai token terbaca sebagai hex 6 digit (agar hitungan sah)', () => {
    for (const t of ['--text', '--muted', '--gold-text', '--teal', '--red', '--card-bg-1', '--card-bg-3']) expect(light[t], t).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(hexRgb(light['--card-bg-1'])).toEqual(LATAR[0][1]);
    expect(hexRgb(light['--card-bg-3'])).toEqual(LATAR[1][1]);
  });

  /** Token warna teks yang DIPAKAI aturan .attr-* (dibaca dari CSS asli, bukan ditulis ulang di sini). */
  const css = postcss.parse(read('styles/redesign.css'));
  const warnaTeks = new Map<string, string>();
  const bukanToken: string[] = [];
  css.walkRules((r) => {
    if (r.parent?.type !== 'root') return;
    for (const sel of r.selectors.map((x) => x.trim())) {
      if (!/^\.attr-[\w-]+$/.test(sel)) continue;
      r.walkDecls('color', (d) => {
        const m = d.value.trim().match(/^var\((--[\w-]+)\)$/);
        if (!m) { bukanToken.push(`${sel} { color: ${d.value} }`); return; }
        warnaTeks.set(sel, m[1]);
      });
    }
  });

  it('semua warna teks .attr-* memakai var(--token) (bukan literal) — agar kontras bisa dihitung', () => {
    expect(bukanToken).toEqual([]);
  });

  it('aturan teks .attr-* terbaca dari CSS (agar hitungan di bawah tidak kosong)', () => {
    expect([...warnaTeks.keys()].sort()).toEqual([
      '.attr-app__license', '.attr-app__meta', '.attr-app__name', '.attr-badge', '.attr-h', '.attr-link',
      '.attr-note', '.attr-src__meta', '.attr-src__name', '.attr-src__names',
    ]);
  });

  it.each(LATAR)('SEMUA warna teks .attr-* (dari CSS) >= 4,5:1 pada latar %s', (_n, bg) => {
    for (const [sel, token] of warnaTeks) {
      expect(light[token], `${sel} → ${token}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(ratio(hexRgb(light[token]), bg), `${sel} → ${token}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(LATAR)('teks lencana (warna dari CSS) pada tint teal/emas/merah di atas latar %s', (_n, bg) => {
    const token = warnaTeks.get('.attr-badge') ?? '';
    const teks = hexRgb(light[token]);
    expect(ratio(teks, tint(light['--teal'], 10, bg))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(teks, over(light['--gold-soft'], bg))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(teks, tint(light['--red'], 10, bg))).toBeGreaterThanOrEqual(4.5);
  });

  it('blok aplikasi (tint emas): teks nama/versi/lisensi (warna dari CSS) tetap terbaca', () => {
    const bg = over(light['--gold-soft'], hexRgb('#f8f5ed'));
    for (const sel of ['.attr-app__name', '.attr-app__meta', '.attr-app__license']) {
      expect(ratio(hexRgb(light[warnaTeks.get(sel) ?? '']), bg), sel).toBeGreaterThanOrEqual(4.5);
    }
  });
});
