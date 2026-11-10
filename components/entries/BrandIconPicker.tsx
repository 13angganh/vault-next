'use client';

/**
 * components/entries/BrandIconPicker.tsx — Vault Next
 * v1.11.0: redesain visual — picker logo brand asli per-entri.
 *
 * Dibuka dari EntryForm saat pengguna tap avatar/tombol "Pilih logo".
 * Menampilkan grid 121 brand terkurasi (lib/brand-icons.ts) dengan
 * kotak pencarian dan pengelompokan per kategori (Email, Media Sosial,
 * dst — lihat BRAND_ICON_CATEGORY_LABELS). Memilih satu brand
 * memanggil onSelect(slug) dan menutup picker; ada juga opsi eksplisit
 * "Tanpa logo" untuk mengosongkan brandIconSlug (fallback ke inisial
 * huruf otomatis via CategoryIcon/EntryIcon, bukan dihapus paksa dari
 * sini — pengguna yang memutuskan).
 *
 * Dibangun di atas primitive Modal & Input yang sudah ada (focus trap,
 * Escape, scroll lock, animasi — semua sudah ditangani Modal.tsx,
 * TIDAK diduplikasi di sini).
 */

import { useMemo, useState } from 'react';
import { Search, Check, X as XIcon } from 'lucide-react';
import { Modal, Input } from '@/components/ui/primitives';
import {
  BRAND_ICON_CATEGORIES,
  BRAND_ICON_CATEGORY_LABELS,
  searchBrandIcons,
  type BrandIconCategory,
  type CuratedBrandIcon,
} from '@/lib/brand-icons';
import { BrandGlyph, brandClipsTile } from '@/components/entries/BrandGlyph';

interface BrandIconPickerProps {
  open:              boolean;
  onClose:           () => void;
  /** slug brand yang sedang terpilih (untuk highlight di grid), atau undefined */
  currentSlug?:      string;
  onSelect:          (slug: string | undefined) => void;
}

export function BrandIconPicker({
  open,
  onClose,
  currentSlug,
  onSelect,
}: BrandIconPickerProps) {
  const [query, setQuery] = useState('');

  // Saat query kosong: tampilkan terkelompok per kategori (lebih mudah
  // dijelajah). Saat ada query: tampilkan hasil pencarian datar
  // (relevansi lebih penting daripada pengelompokan saat mencari).
  const searchResults = useMemo(
    () => (query.trim() ? searchBrandIcons(query) : null),
    [query],
  );

  function handlePick(slug: string) {
    onSelect(slug);
    setQuery('');
    onClose();
  }

  function handleClear() {
    onSelect(undefined);
    setQuery('');
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Pilih Logo Brand" size="md" className="brand-picker-modal">
      <div className="brand-picker">
        <Input
          type="text"
          placeholder="Cari brand... (Gmail, GitHub, Binance)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<Search size={16} />}
          autoFocus
        />

        <button
          type="button"
          className="brand-picker__clear-option"
          onClick={handleClear}
        >
          <span className="brand-picker__clear-icon" aria-hidden="true">
            <XIcon size={16} />
          </span>
          <span>Tanpa logo (pakai inisial otomatis)</span>
          {!currentSlug && <Check size={16} className="brand-picker__check" aria-hidden="true" />}
        </button>

        <div className="brand-picker__scroll">
          {searchResults ? (
            searchResults.length > 0 ? (
              <BrandGrid icons={searchResults} currentSlug={currentSlug} onPick={handlePick} />
            ) : (
              <p className="brand-picker__empty">
                Tidak ada brand yang cocok dengan &ldquo;{query}&rdquo;.
              </p>
            )
          ) : (
            (Object.keys(BRAND_ICON_CATEGORIES) as BrandIconCategory[]).map((cat) => (
              <div key={cat} className="brand-picker__group">
                <h4 className="brand-picker__group-label">{BRAND_ICON_CATEGORY_LABELS[cat]}</h4>
                <BrandGrid icons={BRAND_ICON_CATEGORIES[cat]} currentSlug={currentSlug} onPick={handlePick} />
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

interface BrandGridProps {
  icons:       CuratedBrandIcon[];
  currentSlug: string | undefined;
  onPick:      (slug: string) => void;
}

function BrandGrid({ icons, currentSlug, onPick }: BrandGridProps) {
  return (
    <div className="brand-picker__grid">
      {icons.map((brand) => {
        const isSelected = brand.slug === currentSlug;
        return (
          <button
            key={brand.slug}
            type="button"
            className="brand-picker__item"
            onClick={() => onPick(brand.slug)}
            aria-pressed={isSelected}
            title={brand.title}
          >
            <span
              className="brand-picker__swatch"
              style={{ backgroundColor: `#${brand.hex}`, overflow: brandClipsTile(brand) ? 'hidden' : undefined }}
            >
              <BrandGlyph brand={brand} box={48} glyph={22} />
              {isSelected && (
                <span className="brand-picker__item-check" aria-hidden="true">
                  <Check size={12} />
                </span>
              )}
            </span>
            <span className="brand-picker__item-label">{brand.title}</span>
          </button>
        );
      })}
    </div>
  );
}
