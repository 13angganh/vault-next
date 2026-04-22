'use client';

/**
 * Vault Next — Sidebar
 * Navigasi kategori untuk layout desktop (≥769px).
 * Menampilkan: logo, filter (Semua/Favorit/Recycle Bin), daftar kategori, tombol Settings.
 */

import { VaultIcon } from '@/components/LoadingScreen';
import { useAppStore } from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType } from '@/lib/store/appStore';

interface SidebarProps {
  onSettingsClick: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);

  // Hitung jumlah entry per kategori
  const countFor = (catId: string) =>
    vault.filter((e) => e.cat === catId).length;
  const favCount = vault.filter((e) => e.fav).length;

  const allCats = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  const FilterItem = ({
    id,
    emoji,
    label,
    count,
  }: {
    id: FilterType;
    emoji: string;
    label: string;
    count?: number;
  }) => {
    const active = currentFilter === id;
    return (
      <button
        onClick={() => setFilter(id)}
        className="sidebar-item"
        data-active={active}
        aria-current={active ? 'page' : undefined}
      >
        <span className="sidebar-item__emoji">{emoji}</span>
        <span className="sidebar-item__label">{label}</span>
        {count != null && count > 0 && (
          <span className="sidebar-item__badge">{count}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="sidebar" aria-label="Navigasi">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <VaultIcon size={28} />
        <div className="sidebar-logo__text">
          <span className="sidebar-logo__name">Vault</span>
          <span className="sidebar-logo__version">v1.0</span>
        </div>
      </div>

      {/* ── Filter Utama ── */}
      <nav className="sidebar-section">
        <FilterItem id="all"  emoji="🗂️" label="Semua"       count={vault.length} />
        <FilterItem id="fav"  emoji="⭐" label="Favorit"     count={favCount} />
        <FilterItem id="bin"  emoji="🗑️" label="Recycle Bin" count={recycleBin.length} />
      </nav>

      {/* ── Divider ── */}
      <div className="sidebar-divider" />

      {/* ── Kategori ── */}
      <div className="sidebar-section-label">Kategori</div>
      <nav className="sidebar-section sidebar-cats">
        {allCats.map((cat) => (
          <FilterItem
            key={cat.id}
            id={cat.id}
            emoji={cat.emoji}
            label={cat.label}
            count={countFor(cat.id)}
          />
        ))}
      </nav>

      {/* ── Spacer + Settings ── */}
      <div style={{ flex: 1 }} />
      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onSettingsClick}>
          <span className="sidebar-item__emoji">⚙️</span>
          <span className="sidebar-item__label">Pengaturan</span>
        </button>
      </div>
    </aside>
  );
}
