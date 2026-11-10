/**
 * components/entries/__tests__/BrandIconPicker.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga pemilih logo brand (BrandIconPicker) yang dibuka dari EntryForm:
 *  - tampil/sembunyi mengikuti prop `open`; dialog berlabel "Pilih Logo Brand";
 *  - tanpa kueri: terkelompok per kategori (urutan + label + isi kelompok sesuai katalog);
 *  - dengan kueri: hasil datar (tanpa judul kelompok), tidak peka huruf besar/kecil, spasi
 *    pinggir diabaikan, cocok juga lewat slug; kueri hanya spasi = tanpa kueri;
 *  - kondisi tanpa hasil: pesan + tidak ada brand;
 *  - memilih brand → onSelect(slug) + onClose, kueri direset; "Tanpa logo" → onSelect(undefined)
 *    + onClose, kueri direset (picker hanya meneruskan REFERENSI slug; skema BEKU);
 *  - sorotan brand terpilih (aria-pressed + tanda centang) dan tanda centang "Tanpa logo";
 *  - kontrak render ubin: warna ubin = hex brand, overflow tersembunyi hanya bila brandClipsTile.
 *
 * Tidak menduplikasi: BrandGlyph.test.tsx (glyph/brandClipsTile), EntryIcon.test.tsx (ikon entri
 * dari slug), dan Modal (Escape/latar/scroll-lock; dijaga Modal.test.tsx di Tahap 4C-d).
 *
 * Konvensi: elemen dicari lewat role/label/teks UTUH. Pengecualian terdokumentasi (tak ada
 * alternatif a11y): ubin warna (.brand-picker__swatch), tanda centang aria-hidden
 * (.brand-picker__check / .brand-picker__item-check) dan pembungkus kelompok (induk judul h4).
 *
 * TIDAK dikunci sengaja (diamati tetapi belum diputuskan): kueri TIDAK direset saat picker
 * ditutup lewat Escape/latar/tombol Tutup (hanya saat memilih) — lihat USULAN U24 di laporan.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrandIconPicker } from '../BrandIconPicker';
import { brandClipsTile } from '../BrandGlyph';
import {
  ALL_BRAND_ICONS,
  BRAND_ICON_CATEGORIES,
  BRAND_ICON_CATEGORY_LABELS,
  getBrandIconBySlug,
  type BrandIconCategory,
} from '@/lib/brand-icons';

function renderPicker(props: Partial<React.ComponentProps<typeof BrandIconPicker>> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const utils = render(<BrandIconPicker open onClose={onClose} onSelect={onSelect} {...props} />);
  return { onSelect, onClose, ...utils };
}

const dialog = () => screen.getByRole('dialog', { name: 'Pilih Logo Brand' });
const searchBox = () => within(dialog()).getByRole('textbox') as HTMLInputElement;
const clearBtn = () => within(dialog()).getByRole('button', { name: /^Tanpa logo/ });
const brandBtn = (title: string) => within(dialog()).getByRole('button', { name: title });
const allBrandButtons = () => [
  ...within(dialog()).queryAllByRole('button', { pressed: false }),
  ...within(dialog()).queryAllByRole('button', { pressed: true }),
];
const search = (q: string) => fireEvent.change(searchBox(), { target: { value: q } });
const categories = Object.keys(BRAND_ICON_CATEGORIES) as BrandIconCategory[];

/** hex 6 digit → "rgb(r, g, b)" (dekoder independen untuk membandingkan gaya jsdom). */
function rgb(hex: string): string {
  const n = parseInt(hex, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
function swatchOf(title: string): HTMLElement {
  const el = brandBtn(title).querySelector('.brand-picker__swatch');
  if (!(el instanceof HTMLElement)) throw new Error(`ubin "${title}" tidak ditemukan`);
  return el;
}

/* ───────────────────────── tampil / sembunyi ───────────────────────── */
describe('BrandIconPicker — tampil/sembunyi', () => {
  it('open=false tidak merender apa pun', () => {
    renderPicker({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('open=true: dialog modal berjudul "Pilih Logo Brand" + kotak cari + opsi "Tanpa logo"', () => {
    renderPicker();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog()).getByRole('heading', { level: 3, name: 'Pilih Logo Brand' })).toBeInTheDocument();
    expect(searchBox()).toHaveAttribute('placeholder', 'Cari brand... (Gmail, GitHub, Binance)');
    expect(searchBox().value).toBe('');
    expect(clearBtn()).toHaveTextContent('Tanpa logo (pakai inisial otomatis)');
  });

  it('tombol Tutup (X) memanggil onClose tanpa memilih apa pun', () => {
    const { onClose, onSelect } = renderPicker();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

/* ───────────────────────── pengelompokan ───────────────────────── */
describe('BrandIconPicker — tanpa kueri: terkelompok per kategori', () => {
  it('ada satu judul kelompok (h4) per kategori, urutan dan label sesuai katalog', () => {
    renderPicker();
    const headings = within(dialog()).getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(headings).toEqual(categories.map((c) => BRAND_ICON_CATEGORY_LABELS[c]));
    // jangkar literal agar test tidak hanya bergantung pada katalog yang sama
    expect(headings).toContain('Bank & Dompet Digital');
    expect(headings).toContain('Media Sosial');
    expect(headings[0]).toBe('AI');
  });

  it('isi tiap kelompok = brand kategori itu, berurutan sesuai katalog', () => {
    renderPicker();
    for (const cat of categories) {
      const heading = within(dialog()).getByRole('heading', { level: 4, name: BRAND_ICON_CATEGORY_LABELS[cat] });
      const group = heading.parentElement;
      if (!(group instanceof HTMLElement)) throw new Error('pembungkus kelompok tidak ada');
      const names = within(group).getAllByRole('button').map((b) => b.textContent);
      expect(names).toEqual(BRAND_ICON_CATEGORIES[cat].map((b) => b.title));
    }
  });

  it('jumlah tombol brand = seluruh katalog (tidak ada yang hilang atau ganda)', () => {
    renderPicker();
    expect(allBrandButtons()).toHaveLength(ALL_BRAND_ICONS.length);
  });

  it('tiap tombol brand membawa atribut title = nama brand dan memuat glyph (svg)', () => {
    renderPicker();
    const urut = categories.flatMap((c) => BRAND_ICON_CATEGORIES[c]);
    const tombol = allBrandButtons().sort((a, b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    expect(tombol).toHaveLength(urut.length);
    tombol.forEach((btn, i) => {
      expect(btn).toHaveAttribute('title', urut[i].title);
      expect(btn.textContent).toBe(urut[i].title);
      expect(btn.querySelector('svg')).not.toBeNull();
    });
  });
});

/* ───────────────────────── pencarian ───────────────────────── */
describe('BrandIconPicker — pencarian', () => {
  it('kueri "gmail": hasil datar (tanpa judul kelompok), memuat Gmail, tidak memuat brand lain', () => {
    renderPicker();
    search('gmail');
    expect(within(dialog()).queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(brandBtn('Gmail')).toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Binance' })).not.toBeInTheDocument();
    const shown = allBrandButtons();
    expect(shown.length).toBeGreaterThanOrEqual(1);
    expect(shown.length).toBeLessThan(ALL_BRAND_ICONS.length);
    for (const b of shown) {
      const title = b.getAttribute('title') ?? '';
      const slug = ALL_BRAND_ICONS.find((x) => x.title === title)?.slug ?? '';
      expect(title.toLowerCase().includes('gmail') || slug.includes('gmail')).toBe(true);
    }
  });

  it('tidak peka huruf besar/kecil', () => {
    renderPicker();
    search('BiNaNcE');
    expect(brandBtn('Binance')).toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Gmail' })).not.toBeInTheDocument();
  });

  it('spasi di pinggir kueri diabaikan (hasil sama dengan tanpa spasi)', () => {
    renderPicker();
    search('gmail');
    const sama = allBrandButtons().map((b) => b.getAttribute('title'));
    search('   gmail  ');
    expect(allBrandButtons().map((b) => b.getAttribute('title'))).toEqual(sama);
  });

  it('kueri hanya spasi diperlakukan sebagai tanpa kueri: kembali ke tampilan terkelompok', () => {
    renderPicker();
    search('   ');
    expect(within(dialog()).getAllByRole('heading', { level: 4 })).toHaveLength(categories.length);
    expect(allBrandButtons()).toHaveLength(ALL_BRAND_ICONS.length);
  });

  it('kueri dihapus lagi: kembali terkelompok', () => {
    renderPicker();
    search('gmail');
    search('');
    expect(within(dialog()).getAllByRole('heading', { level: 4 })).toHaveLength(categories.length);
  });

  it('cocok juga lewat slug, bukan hanya judul', () => {
    // brand yang slug-nya TIDAK termuat di judul (huruf kecil) — dicari lewat slug saja
    const kandidat = ALL_BRAND_ICONS.find((b) => b.slug.length >= 3 && !b.title.toLowerCase().includes(b.slug));
    expect(kandidat, 'katalog tidak punya brand dengan slug berbeda dari judul').toBeDefined();
    if (!kandidat) return;
    renderPicker();
    search(kandidat.slug);
    expect(brandBtn(kandidat.title)).toBeInTheDocument();
  });

  it('pencarian memakai substring (bukan awalan): "ina" menemukan Binance', () => {
    renderPicker();
    search('ina');
    expect(brandBtn('Binance')).toBeInTheDocument();
  });
});

/* ───────────────────────── tanpa hasil ───────────────────────── */
describe('BrandIconPicker — kondisi tanpa hasil', () => {
  it('menampilkan pesan dengan kueri di dalam tanda kutip, tanpa brand dan tanpa judul kelompok', () => {
    renderPicker();
    search('zzzqqq');
    expect(screen.getByText('Tidak ada brand yang cocok dengan “zzzqqq”.')).toBeInTheDocument();
    expect(allBrandButtons()).toHaveLength(0);
    expect(within(dialog()).queryAllByRole('heading', { level: 4 })).toHaveLength(0);
  });

  it('opsi "Tanpa logo" tetap tersedia saat tanpa hasil', () => {
    const { onSelect } = renderPicker();
    search('zzzqqq');
    fireEvent.click(clearBtn());
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('pesan tanpa hasil hilang begitu ada hasil lagi', () => {
    renderPicker();
    search('zzzqqq');
    search('gmail');
    expect(screen.queryByText(/Tidak ada brand yang cocok/)).not.toBeInTheDocument();
    expect(brandBtn('Gmail')).toBeInTheDocument();
  });
});

/* ───────────────────────── memilih ───────────────────────── */
describe('BrandIconPicker — memilih brand', () => {
  it('klik brand → onSelect(slug) tepat sekali, lalu onClose tepat sekali (urutan: pilih dulu)', () => {
    const order: string[] = [];
    const onSelect = vi.fn(() => order.push('select'));
    const onClose = vi.fn(() => order.push('close'));
    render(<BrandIconPicker open onClose={onClose} onSelect={onSelect} />);
    fireEvent.click(brandBtn('Gmail'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('gmail');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['select', 'close']);
  });

  it('slug yang diteruskan = slug katalog untuk SETIAP brand (bukan judul/hex), dalam satu render', () => {
    const { onSelect } = renderPicker();
    const urut = categories.flatMap((c) => BRAND_ICON_CATEGORIES[c]);
    const tombol = allBrandButtons().sort((a, b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    expect(tombol).toHaveLength(urut.length);
    tombol.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(onSelect).toHaveBeenLastCalledWith(urut[i].slug);
      expect(getBrandIconBySlug(urut[i].slug)?.title).toBe(urut[i].title);
    });
    expect(onSelect).toHaveBeenCalledTimes(urut.length);
  });

  it('memilih dari hasil pencarian: onSelect(slug) dan kueri direset ke kosong', () => {
    const { onSelect } = renderPicker();
    search('binance');
    fireEvent.click(brandBtn('Binance'));
    expect(onSelect).toHaveBeenCalledWith('binance');
    expect(searchBox().value).toBe('');
    // setelah reset, tampilan kembali terkelompok
    expect(within(dialog()).getAllByRole('heading', { level: 4 })).toHaveLength(categories.length);
  });

  it('"Tanpa logo": onSelect(undefined) tepat sekali (tepat satu argumen: undefined) + onClose', () => {
    const { onSelect, onClose } = renderPicker({ currentSlug: 'gmail' });
    fireEvent.click(clearBtn());
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]).toEqual([undefined]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('"Tanpa logo" juga mereset kueri', () => {
    renderPicker();
    search('gmail');
    fireEvent.click(clearBtn());
    expect(searchBox().value).toBe('');
  });
});

/* ───────────────────────── sorotan pilihan ───────────────────────── */
describe('BrandIconPicker — sorotan brand terpilih', () => {
  it('hanya brand currentSlug yang aria-pressed=true; yang lain false', () => {
    renderPicker({ currentSlug: 'binance' });
    const pressed = within(dialog()).getAllByRole('button', { pressed: true });
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveAttribute('title', 'Binance');
    expect(within(dialog()).getAllByRole('button', { pressed: false })).toHaveLength(ALL_BRAND_ICONS.length - 1);
  });

  it('tanpa currentSlug: tidak ada brand yang terpilih', () => {
    renderPicker();
    expect(within(dialog()).queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('slug tak dikenal: tidak ada brand yang terpilih (tidak crash)', () => {
    renderPicker({ currentSlug: 'brand-yang-tidak-ada-xyz' });
    expect(within(dialog()).queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('tanda centang pada ubin hanya untuk brand terpilih', () => {
    renderPicker({ currentSlug: 'gmail' });
    expect(dialog().querySelectorAll('.brand-picker__item-check')).toHaveLength(1);
    expect(brandBtn('Gmail').querySelector('.brand-picker__item-check')).not.toBeNull();
  });

  it('sorotan ikut hasil pencarian', () => {
    renderPicker({ currentSlug: 'gmail' });
    search('gmail');
    expect(brandBtn('Gmail')).toHaveAttribute('aria-pressed', 'true');
  });

  it('"Tanpa logo" bercentang HANYA saat tidak ada currentSlug', () => {
    const a = renderPicker();
    expect(clearBtn().querySelector('.brand-picker__check')).not.toBeNull();
    a.unmount();
    renderPicker({ currentSlug: 'gmail' });
    expect(clearBtn().querySelector('.brand-picker__check')).toBeNull();
  });
});

/* ───────────────────────── kontrak ubin ───────────────────────── */
describe('BrandIconPicker — ubin brand', () => {
  it('warna latar ubin = hex brand (diperiksa untuk 5 brand lewat dekoder independen)', () => {
    renderPicker();
    for (const title of ['Gmail', 'Binance', 'GitHub', 'Claude', 'PayPal']) {
      const brand = ALL_BRAND_ICONS.find((b) => b.title === title);
      expect(brand, `brand ${title} tidak ada`).toBeDefined();
      if (!brand) continue;
      expect(swatchOf(title).style.backgroundColor).toBe(rgb(brand.hex));
    }
  });

  it('overflow ubin tersembunyi HANYA untuk brand yang brandClipsTile (ada keduanya di katalog)', () => {
    renderPicker();
    const clipped = ALL_BRAND_ICONS.find((b) => brandClipsTile(b));
    const free = ALL_BRAND_ICONS.find((b) => !brandClipsTile(b));
    expect(clipped, 'katalog harus punya brand yang dipotong').toBeDefined();
    expect(free, 'katalog harus punya brand yang tidak dipotong').toBeDefined();
    if (!clipped || !free) return;
    expect(swatchOf(clipped.title).style.overflow).toBe('hidden');
    expect(swatchOf(free.title).style.overflow).toBe('');
  });
});
