'use client';

/**
 * Vault Next — Sidebar
 * - Overlay dari kiri + backdrop blur, auto-close saat klik item
 * - Nama konsisten: "Vault Next"
 * - Kategori: dropdown collapse/expand dengan chevron
 * - Width 260px (via --sidebar-width token)
 * - Semua icon Lucide
 */

import { useState } from 'react';
import { LayoutGrid, Star, Trash2, Settings, X, ChevronDown } from 'lucide-react';
import { VaultIcon }          from '@/components/common/LoadingScreen';
import { useAppStore }        from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType }    from '@/lib/store/appStore';
import { CategoryIcon }       from '@/components/entries/CategoryIcon';

interface SidebarProps {
  open:            boolean;
  onClose:         () => void;
  onSettingsClick: () => void;
  onNavVault:      () => void;  // dipanggil saat nav ke vault filter
}

export function Sidebar({ open, onClose, onSettingsClick, onNavVault }: SidebarProps) {
  const [catsOpen, setCatsOpen] = useState(true);

  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);

  const countFor = (catId: string) => vault.filter((e) => e.cat === catId).length;
  const favCount = vault.filter((e) => e.fav).length;
  const allCats  = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label })),
  ];

  /* Klik menu item → switch ke vault view + set filter + tutup sidebar */
  const handleNav = (filterId: FilterType) => {
    onNavVault();
    setFilter(filterId);
    onClose();
  };

  const handleSettings = () => {
    onSettingsClick();
    onClose();
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
        aria-label="Menu navigasi"
        aria-hidden={!open}
        role="navigation"
      >
        {/* ── Header sidebar ── */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <VaultIcon size={26} />
            <div className="sidebar-logo__text">
              <span className="sidebar-logo__name">Vault</span>
              <span className="sidebar-logo__name sidebar-logo__name--gold"> Next</span>
            </div>
          </div>
          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable area: nav + kategori ── */}
        <div className="sidebar-scroll-area">
          <nav className="sidebar-section">
            <NavItem
              id="all"
              icon={<LayoutGrid size={16} />}
              label="Semua"
              count={vault.length}
              active={currentFilter === 'all'}
              onClick={() => handleNav('all')}
            />
            <NavItem
              id="fav"
              icon={<Star size={16} />}
              label="Favorit"
              count={favCount}
              active={currentFilter === 'fav'}
              onClick={() => handleNav('fav')}
            />
            <NavItem
              id="bin"
              icon={<Trash2 size={16} />}
              label="Tong Sampah"
              count={recycleBin.length}
              active={currentFilter === 'bin'}
              onClick={() => handleNav('bin')}
            />
          </nav>

          <div className="sidebar-divider" />

          {/* Kategori: dropdown toggle */}
          <button
            className={`sidebar-section-label${catsOpen ? ' sidebar-section-label--open' : ''}`}
            onClick={() => setCatsOpen((v) => !v)}
            aria-expanded={catsOpen}
            aria-controls="sidebar-cats"
          >
            <span>Kategori</span>
            <ChevronDown size={14} className="sidebar-section-label__chevron" />
          </button>

          <nav
            id="sidebar-cats"
            className={`sidebar-section sidebar-cats${catsOpen ? ' sidebar-cats--open' : ''}`}
          >
            {allCats.map((cat) => (
              <NavItem
                key={cat.id}
                id={cat.id}
                icon={
                  <CategoryIcon
                    catId={cat.id}
                    customCats={customCats}
                    size="sm"
                  />
                }
                label={cat.label}
                count={countFor(cat.id)}
                active={currentFilter === cat.id}
                onClick={() => handleNav(cat.id as FilterType)}
              />
            ))}
          </nav>
        </div>

        {/* ── Footer: Pengaturan — fixed di bawah ── */}
        <div className="sidebar-divider" />
        <div className="sidebar-footer">
          <NavItem
            id="settings"
            icon={<Settings size={16} />}
            label="Pengaturan"
            active={false}
            onClick={handleSettings}
          />
        </div>
      </aside>
    </>
  );
}

/* ── NavItem component ── */
function NavItem({
  icon, label, count, active, onClick,
}: {
  id:      string;
  icon:    React.ReactNode;
  label:   string;
  count?:  number;
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
}
