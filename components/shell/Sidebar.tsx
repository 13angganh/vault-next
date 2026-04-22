'use client';

/**
 * Vault Next — Sidebar
 * Sesi 6B: emoji → Lucide icons. Kategori default pakai Lucide, custom pakai emoji mereka sendiri.
 */

import { LayoutGrid, Star, Trash2, Settings } from 'lucide-react';
import { VaultIcon }         from '@/components/LoadingScreen';
import { useAppStore }       from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType }   from '@/lib/store/appStore';

interface SidebarProps {
  onSettingsClick: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);

  const countFor  = (catId: string) => vault.filter((e) => e.cat === catId).length;
  const favCount  = vault.filter((e) => e.fav).length;
  const allCats   = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  const IconItem = ({
    id, icon, label, count,
  }: {
    id: FilterType;
    icon: React.ReactNode;
    label: string;
    count?: number;
  }) => {
    const active = currentFilter === id;
    return (
      <button onClick={() => setFilter(id)} className="sidebar-item"
        data-active={active} aria-current={active ? 'page' : undefined}>
        <span className="sidebar-item__icon">{icon}</span>
        <span className="sidebar-item__label">{label}</span>
        {count != null && count > 0 && <span className="sidebar-item__badge">{count}</span>}
      </button>
    );
  };

  // Kategori default + custom pakai emoji mereka sendiri (tetap emoji untuk kategori)
  const CatItem = ({ id, emoji, label, count }: { id: FilterType; emoji: string; label: string; count?: number }) => {
    const active = currentFilter === id;
    return (
      <button onClick={() => setFilter(id)} className="sidebar-item"
        data-active={active} aria-current={active ? 'page' : undefined}>
        <span className="sidebar-item__emoji">{emoji}</span>
        <span className="sidebar-item__label">{label}</span>
        {count != null && count > 0 && <span className="sidebar-item__badge">{count}</span>}
      </button>
    );
  };

  return (
    <aside className="sidebar" aria-label="Navigasi">
      {/* Logo */}
      <div className="sidebar-logo">
        <VaultIcon size={28} />
        <div className="sidebar-logo__text">
          <span className="sidebar-logo__name">Vault</span>
          <span className="sidebar-logo__version">v1.0</span>
        </div>
      </div>

      {/* Filter utama */}
      <nav className="sidebar-section">
        <IconItem id="all" icon={<LayoutGrid size={16} />} label="Semua"       count={vault.length} />
        <IconItem id="fav" icon={<Star size={16} />}       label="Favorit"     count={favCount} />
        <IconItem id="bin" icon={<Trash2 size={16} />}     label="Recycle Bin" count={recycleBin.length} />
      </nav>

      <div className="sidebar-divider" />
      <div className="sidebar-section-label">Kategori</div>

      {/* Kategori — tetap pakai emoji kategori */}
      <nav className="sidebar-section sidebar-cats">
        {allCats.map((cat) => (
          <CatItem key={cat.id} id={cat.id} emoji={cat.emoji} label={cat.label} count={countFor(cat.id)} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />
      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={onSettingsClick}>
          <span className="sidebar-item__icon"><Settings size={16} /></span>
          <span className="sidebar-item__label">Pengaturan</span>
        </button>
      </div>
    </aside>
  );
}
