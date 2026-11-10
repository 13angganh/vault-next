/**
 * lib/attribution.ts — Aurum Vault v2.0.0 (Tahap 5)
 *
 * Data STATIS untuk layar "Atribusi & lisensi" (Pengaturan > Tentang): dari pustaka mana tiap
 * logo brand berasal dan di bawah lisensi apa. Tidak ada kunci penyimpanan, tidak ada jaringan.
 *
 * ASAL DATA. Tiap slug di lib/brand-icons.ts dicocokkan dengan data path SVG paket aslinya
 * (simple-icons 16.37.0 dan versi lamanya, Iconify "token"/"ri"/"logos"/"arcticons", idn-finlogos
 * 2.5.0). Pemetaan `kind` → sumber di header lama brand-icons.ts TIDAK cukup: Grok (kind "mono")
 * berasal dari Remix Icon dan MetaMask (kind "color") dari SVG Logos, bukan dari Web3 Icons /
 * idn-finlogos. Karena itu daftar slug ditulis eksplisit di sini dan dikunci oleh
 * lib/__tests__/attribution.test.ts: menambah logo `mono`/`line`/`color` tanpa mendaftarkannya
 * ke sebuah sumber akan menggagalkan test (jadi atribusi tidak bisa terlewat diam-diam).
 * Sumber `simple-icons` = semua logo `path` tunggal yang tidak terdaftar di sumber lain.
 *
 * BATAS. Ini pencatatan sumber, bukan nasihat hukum. Teks lengkap lisensi tidak disalin ke
 * aplikasi; layar menampilkan nama lisensi + tautan ke teks resminya.
 */
import { ALL_BRAND_ICONS, type CuratedBrandIcon } from './brand-icons';

/** Teks lisensi aplikasi (sengaja tanpa nama pemilik, atas permintaan pemilik proyek). */
export const APP_LICENSE_TEXT = 'Seluruh hak dilindungi.';

/** free = bebas (CC0/MIT/Apache) · share = atribusi + berbagi serupa · noncommercial = hanya nonkomersial */
export type AttributionTone = 'free' | 'share' | 'noncommercial';

export interface AttributionSource {
  id: 'simple-icons' | 'web3icons' | 'remix-icon' | 'svg-logos' | 'arcticons' | 'idn-finlogos';
  name: string;
  creator: string;
  /** Nama lisensi untuk ditampilkan. */
  license: string;
  tone: AttributionTone;
  licenseUrl: string;
  sourceUrl: string;
  /** Catatan kewajiban/batasan lisensi (bahasa Indonesia, tampil di kartu). */
  note: string;
  /** Slug terdaftar; null = semua logo yang tidak terdaftar di sumber lain (simple-icons). */
  slugs: readonly string[] | null;
}

export const ATTRIBUTION_SOURCES: readonly AttributionSource[] = [
  {
    id: 'simple-icons', name: 'Simple Icons', creator: 'Komunitas Simple Icons',
    license: 'CC0 1.0', tone: 'free',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://github.com/simple-icons/simple-icons',
    note: 'Domain publik (CC0): tanpa kewajiban atribusi, dicantumkan sebagai ucapan terima kasih. Enam logo berasal dari versi lama paket ini dan tetap CC0.',
    slugs: null,
  },
  {
    id: 'web3icons', name: 'Web3 Icons', creator: '0xa3k5',
    license: 'MIT', tone: 'free',
    licenseUrl: 'https://github.com/0xa3k5/web3icons/blob/main/LICENCE',
    sourceUrl: 'https://github.com/0xa3k5/web3icons',
    note: 'Lisensi MIT: boleh dipakai dan diubah selama pemberitahuan hak cipta dan lisensinya disertakan (lihat teks lisensi).',
    slugs: ['coinbase', 'trustwallet', 'bitget', 'gateio', 'solflare', 'phantom', 'xrp', 'usdc', 'trx'],
  },
  {
    id: 'remix-icon', name: 'Remix Icon', creator: 'Remix Design',
    license: 'Apache 2.0', tone: 'free',
    licenseUrl: 'https://www.apache.org/licenses/LICENSE-2.0',
    sourceUrl: 'https://github.com/cyberalien/RemixIcon',
    note: 'Lisensi Apache 2.0: teks lengkap dan ketentuannya ada di tautan lisensi.',
    slugs: ['grok'],
  },
  {
    id: 'svg-logos', name: 'SVG Logos', creator: 'Gil Barbara',
    license: 'CC0 1.0', tone: 'free',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://github.com/gilbarbara/logos',
    note: 'Domain publik (CC0). Merek tetap milik pemiliknya.',
    slugs: ['metamask'],
  },
  {
    id: 'arcticons', name: 'Arcticons', creator: 'Donnnno dan tim Arcticons',
    license: 'CC BY-SA 4.0', tone: 'share',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://github.com/Arcticons-Team/Arcticons',
    note: 'Atribusi wajib. Logo ini beserta perubahannya dibagikan dengan lisensi yang sama (CC BY-SA 4.0).',
    slugs: ['mexc', 'bingx', 'bluewallet', 'wetv', 'maxim', 'traveloka'],
  },
  {
    id: 'idn-finlogos', name: 'idn-finlogos 2.5.0', creator: 'Hafidz Noor Fauzi (kurasi koleksi)',
    license: 'CC BY-NC 4.0', tone: 'noncommercial',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/4.0/',
    sourceUrl: 'https://github.com/hafidznoor/idn-finlogos',
    note: 'Hanya untuk penggunaan nonkomersial. Penggunaan komersial memerlukan izin pemegang merek masing-masing logo. Koleksi disusun dari sumber publik.',
    slugs: [
      'dana', 'ovo', 'gopay', 'shopeepay', 'linkaja', 'brimo', 'mandiri', 'wondr', 'mybca', 'jconnect',
      'seabank', 'jenius', 'jago', 'akulaku', 'vidio', 'tokopedia', 'lazada', 'telkomsel', 'myim3',
      'myxl', 'axis', 'tri', 'byu', 'smartfren', 'indihome', 'mobilejkn', 'plnmobile',
    ],
  },
];

/** Perubahan yang dilakukan pada logo (wajib disebut oleh CC BY / CC BY-SA: "indicate if changes were made"). */
export const LOGO_CHANGES_NOTE =
  'Perubahan: logo diekstrak menjadi data SVG statis, id internal diberi awalan unik, dan ditampilkan pada ubin berukuran seragam.';

const REGISTERED_SLUGS: ReadonlySet<string> = new Set(
  ATTRIBUTION_SOURCES.flatMap((s) => (s.slugs ? [...s.slugs] : [])),
);

/** Logo (urutan pustaka) milik sebuah sumber. */
export function logosOfSource(source: AttributionSource): CuratedBrandIcon[] {
  if (source.slugs === null) return ALL_BRAND_ICONS.filter((b) => !REGISTERED_SLUGS.has(b.slug));
  const own = new Set(source.slugs);
  return ALL_BRAND_ICONS.filter((b) => own.has(b.slug));
}

/** Sumber sebuah slug; null bila slug tidak ada di pustaka. */
export function attributionSourceOf(slug: string): AttributionSource | null {
  if (!ALL_BRAND_ICONS.some((b) => b.slug === slug)) return null;
  return ATTRIBUTION_SOURCES.find((s) => s.slugs?.includes(slug)) ?? ATTRIBUTION_SOURCES[0];
}
