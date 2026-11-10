/**
 * lib/__tests__/attribution.test.ts — Aurum Vault v2.0.0 (Tahap 5)
 *
 * MAKSUD. Mengunci kontrak data layar "Atribusi & lisensi" (lib/attribution.ts) terhadap pustaka
 * logo nyata (lib/brand-icons.ts):
 *  - setiap logo punya TEPAT SATU sumber/lisensi (partisi: tidak ada yang terlewat, tidak ada ganda);
 *  - logo berjenis mono/line/color WAJIB terdaftar eksplisit — logo baru tidak bisa lolos tanpa atribusi;
 *  - temuan Tahap 5 tidak boleh kembali ke peta lama (Grok = Remix Icon, bukan Web3 Icons;
 *    MetaMask = SVG Logos, bukan idn-finlogos);
 *  - label lisensi, nada (free/share/noncommercial), dan URL lisensi saling konsisten.
 *
 * RIWAYAT. Baru di Tahap 5. Bukti asal tiap slug (pencocokan data path SVG dengan paket aslinya)
 * dijalankan di Tahap 5 dan dicatat di LAPORAN-TAHAP-5.md; test ini hanya menjaga hasilnya.
 * Angka 9/1/1/6/27 adalah hasil verifikasi itu: menambah logo ke sebuah sumber = keputusan atribusi
 * yang sengaja memaksa test ini diperbarui.
 */
import { describe, it, expect } from 'vitest';
import { ALL_BRAND_ICONS } from '../brand-icons';
import {
  ATTRIBUTION_SOURCES, APP_LICENSE_TEXT, LOGO_CHANGES_NOTE, logosOfSource, attributionSourceOf,
  type AttributionSource,
} from '../attribution';

const byId = (id: AttributionSource['id']): AttributionSource => {
  const s = ATTRIBUTION_SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`sumber ${id} tidak ada`);
  return s;
};

describe('attribution — partisi logo ke sumber', () => {
  it('setiap slug terdaftar ada di pustaka logo (tidak ada slug yatim)', () => {
    const semua = new Set(ALL_BRAND_ICONS.map((b) => b.slug));
    for (const s of ATTRIBUTION_SOURCES) for (const slug of s.slugs ?? []) expect(semua.has(slug), `${s.id}/${slug}`).toBe(true);
  });

  it('tidak ada slug yang terdaftar di dua sumber', () => {
    const terlihat = new Map<string, string>();
    for (const s of ATTRIBUTION_SOURCES) for (const slug of s.slugs ?? []) {
      expect(terlihat.has(slug), `${slug} ganda: ${terlihat.get(slug)} & ${s.id}`).toBe(false);
      terlihat.set(slug, s.id);
    }
  });

  it('gabungan logo semua sumber = seluruh pustaka, tiap logo tepat sekali', () => {
    const hitung = new Map<string, number>();
    for (const s of ATTRIBUTION_SOURCES) for (const l of logosOfSource(s)) hitung.set(l.slug, (hitung.get(l.slug) ?? 0) + 1);
    expect(hitung.size).toBe(ALL_BRAND_ICONS.length);
    for (const [slug, n] of hitung) expect(n, slug).toBe(1);
  });

  it('logo mono/line/color wajib terdaftar eksplisit; logo tak berjenis (path tunggal) = simple-icons', () => {
    const default_ = byId('simple-icons');
    for (const l of logosOfSource(default_)) {
      expect(l.kind, `${l.slug} berjenis ${l.kind} tetapi tidak terdaftar di sumber mana pun`).toBeUndefined();
      expect(l.path.length, `${l.slug} tanpa path`).toBeGreaterThan(0);
    }
  });

  it('hasil verifikasi Tahap 5: jumlah logo per sumber terdaftar', () => {
    const n = (id: AttributionSource['id']) => logosOfSource(byId(id)).length;
    expect([n('web3icons'), n('remix-icon'), n('svg-logos'), n('arcticons'), n('idn-finlogos')]).toEqual([9, 1, 1, 6, 27]);
  });

  it('temuan Tahap 5 tidak kembali ke peta lama: Grok = Remix Icon, MetaMask = SVG Logos', () => {
    expect(attributionSourceOf('grok')?.id).toBe('remix-icon');
    expect(attributionSourceOf('metamask')?.id).toBe('svg-logos');
    // bukan sumber yang ditebak dari `kind` (mono → Web3 Icons, color → idn-finlogos)
    expect(byId('web3icons').slugs).not.toContain('grok');
    expect(byId('idn-finlogos').slugs).not.toContain('metamask');
  });

  it('enam logo simple-icons versi lama tetap bersumber simple-icons (CC0)', () => {
    for (const slug of ['openai', 'canva', 'linkedin', 'microsoft', 'microsoftoutlook', 'yahoo']) {
      expect(attributionSourceOf(slug)?.id, slug).toBe('simple-icons');
    }
  });

  it('attributionSourceOf: slug tak dikenal → null; logo sumber lain dipetakan benar', () => {
    expect(attributionSourceOf('tidak-ada-slug-ini')).toBeNull();
    expect(attributionSourceOf('dana')?.id).toBe('idn-finlogos');
    expect(attributionSourceOf('mexc')?.id).toBe('arcticons');
    expect(attributionSourceOf('coinbase')?.id).toBe('web3icons');
    expect(attributionSourceOf('claude')?.id).toBe('simple-icons');
  });
});

describe('attribution — lisensi, nada, dan URL konsisten', () => {
  const POLA: Record<string, { tone: AttributionSource['tone']; url: RegExp }> = {
    'CC0 1.0':      { tone: 'free',          url: /^https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/$/ },
    'MIT':          { tone: 'free',          url: /^https:\/\/github\.com\/0xa3k5\/web3icons\/blob\/main\/LICENCE$/ },
    'Apache 2.0':   { tone: 'free',          url: /^https:\/\/www\.apache\.org\/licenses\/LICENSE-2\.0$/ },
    'CC BY-SA 4.0': { tone: 'share',         url: /^https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/$/ },
    'CC BY-NC 4.0': { tone: 'noncommercial', url: /^https:\/\/creativecommons\.org\/licenses\/by-nc\/4\.0\/$/ },
  };

  it.each(ATTRIBUTION_SOURCES.map((s) => [s.id, s] as const))('%s: label lisensi dikenal, nada dan URL lisensi sesuai', (_id, s) => {
    const pola = POLA[s.license];
    expect(pola, `lisensi tak dikenal: ${s.license}`).toBeDefined();
    expect(s.tone).toBe(pola.tone);
    expect(s.licenseUrl).toMatch(pola.url);
  });

  it('lisensi tiap sumber sesuai hasil verifikasi paket asli (label per sumber)', () => {
    expect(ATTRIBUTION_SOURCES.map((s) => [s.id, s.license])).toEqual([
      ['simple-icons', 'CC0 1.0'], ['web3icons', 'MIT'], ['remix-icon', 'Apache 2.0'],
      ['svg-logos', 'CC0 1.0'], ['arcticons', 'CC BY-SA 4.0'], ['idn-finlogos', 'CC BY-NC 4.0'],
    ]);
  });

  it('id dan nama unik; semua URL https tanpa spasi; catatan dan pembuat tidak kosong', () => {
    expect(new Set(ATTRIBUTION_SOURCES.map((s) => s.id)).size).toBe(ATTRIBUTION_SOURCES.length);
    expect(new Set(ATTRIBUTION_SOURCES.map((s) => s.name)).size).toBe(ATTRIBUTION_SOURCES.length);
    for (const s of ATTRIBUTION_SOURCES) {
      expect(s.sourceUrl, s.id).toMatch(/^https:\/\/\S+$/);
      expect(s.licenseUrl, s.id).toMatch(/^https:\/\/\S+$/);
      expect(s.note.trim().length, s.id).toBeGreaterThan(20);
      expect(s.creator.trim().length, s.id).toBeGreaterThan(0);
    }
  });

  it('satu-satunya sumber nonkomersial adalah idn-finlogos, dan catatannya menyebut batasan itu', () => {
    const nc = ATTRIBUTION_SOURCES.filter((s) => s.tone === 'noncommercial');
    expect(nc.map((s) => s.id)).toEqual(['idn-finlogos']);
    expect(nc[0].note).toContain('nonkomersial');
    const sa = ATTRIBUTION_SOURCES.filter((s) => s.tone === 'share');
    expect(sa.map((s) => s.id)).toEqual(['arcticons']);
    expect(sa[0].note).toContain('CC BY-SA 4.0');
  });

  it('teks lisensi aplikasi tanpa nama pribadi (permintaan pemilik proyek); catatan perubahan logo ada', () => {
    expect(APP_LICENSE_TEXT.trim().length).toBeGreaterThan(0);
    expect(APP_LICENSE_TEXT).not.toMatch(/angga|13angganh/i);
    expect(LOGO_CHANGES_NOTE).toMatch(/^Perubahan:/);
  });
});
