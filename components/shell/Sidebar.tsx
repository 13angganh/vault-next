'use client';

/**
 * Vault Next — Sidebar
 * - Overlay dari kiri + backdrop blur
 * - Auto-close langsung saat klik menu item
 * - Width 260px
 * - Semua icon Lucide (tidak ada emoji di nav)
 * - Tong Sampah (bukan Recycle Bin)
 */

import { LayoutGrid, Star, Trash2, Settings, X } from 'lucide-react';
import { VaultIcon }          from '@/components/LoadingScreen';
import { useAppStore }        from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType }    from '@/lib/store/appStore';
import { CategoryIcon }       from '@/components/entries/CategoryIcon';

interface SidebarProps {
  open:            boolean;
  onClose:         () => void;
  onSettingsClick: () => void;
}

export function Sidebar({ open, onClose, onSettingsClick }: SidebarProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);

  const countFor = (catId: string) => vault.filter((e) => e.cat === catId).length;
  const favCount = vault.filter((e) => e.fav).length;
  const allCats  = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  /* Klik menu item → tutup sidebar langsung */
  const handleNav = (filterId: FilterType) => {
    setFilter(filterId);
    onClose();
  };

  const handleSettings = () => {
    onSettingsClick();
    onClose();
  };

  /* Nav item dengan Lucide icon */
  const IconItem = ({
    id, icon, label, count,
  }: { id: FilterType; icon: React.ReactNode; label: string; count?: number }) => {
    const active = currentFilter === id;
    return (
      <button
        onClick={() => handleNav(id)}
        className="sidebar-item"
        data-active={active}
        aria-current={active ? 'page' : undefined}
      >
        <span className="sidebar-item__icon">{icon}</span>
        <span className="sidebar-item__label">{label}</span>
        {count != null && count > 0 && (
          <span className="sidebar-item__badge">{count}</span>
        )}
      </button>
    );
  };

  /* Kategori item — Lucide icon via CategoryIcon */
  const CatItem = ({ id, label, count }: { id: FilterType; label: string; count?: number }) => {
    const active = currentFilter === id;
    return (
      <button
        onClick={() => handleNav(id)}
        className="sidebar-item"
        data-active={active}
        aria-current={active ? 'page' : undefined}
      >
        <CategoryIcon catId={id} customCats={customCats} size="sm" />
        <span className="sidebar-item__label">{label}</span>
        {count != null && count > 0 && (
          <span className="sidebar-item__badge">{count}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`sidebar-overlay${open ? ' sidebar-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`sidebar${open ? ' sidebar--open' : ''}`}
        aria-label="Navigasi"
        aria-hidden={!open}
      >
        {/* Header sidebar */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <VaultIcon size={26} />
            <div className="sidebar-logo__text">
              <span className="sidebar-logo__name">Vault</span>
              <span className="sidebar-logo__version">v1.0</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Tutup menu">
            <X size={18} />
          </button>
        </div>

        {/* Navigasi utama */}
        <nav className="sidebar-section">
          <IconItem id="all" icon={<LayoutGrid size={16} />} label="Semua"       count={vault.length} />
          <IconItem id="fav" icon={<Star size={16} />}       label="Favorit"     count={favCount} />
          <IconItem id="bin" icon={<Trash2 size={16} />}     label="Tong Sampah" count={recycleBin.length} />
        </nav>

        <div className="sidebar-divider" />
        <div className="sidebar-section-label">Kategori</div>

        {/* Kategori */}
        <nav className="sidebar-section sidebar-cats">
          {allCats.map((cat) => (
            <CatItem
              key={cat.id}
              id={cat.id}
              label={cat.label}
              count={countFor(cat.id)}
            />
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Footer — Pengaturan */}
        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={handleSettings}>
            <span className="sidebar-item__icon"><Settings size={16} /></span>
            <span className="sidebar-item__label">Pengaturan</span>
          </button>
        </div>
      </aside>
    </>
  );
}
