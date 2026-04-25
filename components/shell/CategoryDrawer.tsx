'use client';

/**
 * Vault Next — CategoryDrawer
 * Bottom sheet untuk memilih kategori di mobile.
 * FIX Sesi 6B: smooth exit animation + Lucide icons.
 */

import { useEffect, useState, useCallback } from 'react';
import { LayoutGrid, Star, Trash2 } from 'lucide-react';
import { useAppStore }       from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType }   from '@/lib/store/appStore';

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CategoryDrawer({ open, onClose }: CategoryDrawerProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);

  // Render state: 'hidden' | 'visible' | 'closing'
  const [renderState, setRenderState] = useState<'hidden' | 'visible' | 'closing'>('hidden');

  useEffect(() => {
    if (open) {
      setRenderState('visible');
    } else if (renderState === 'visible') {
      // Trigger closing animation, then unmount
      setRenderState('closing');
      const timer = setTimeout(() => setRenderState('hidden'), 260);
      return () => clearTimeout(timer);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Escape key
  useEffect(() => {
    if (renderState === 'hidden') return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [renderState, handleClose]);

  if (renderState === 'hidden') return null;

  const closing = renderState === 'closing';

  const allCats = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  const countFor = (catId: string) => vault.filter((e) => e.cat === catId).length;

  const pick = (id: FilterType) => {
    setFilter(id);
    handleClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay"
        data-closing={closing}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="drawer"
        data-closing={closing}
        role="dialog"
        aria-modal="true"
        aria-label="Pilih kategori"
      >
        <div className="drawer-handle" />
        <h3 className="drawer-title">Kategori</h3>

        {/* Filter utama */}
        <div className="drawer-section">
          {[
            { id: 'all' as FilterType, icon: <LayoutGrid size={18} />, label: 'Semua',       count: vault.length },
            { id: 'fav' as FilterType, icon: <Star size={18} />,       label: 'Favorit',     count: vault.filter((e) => e.fav).length },
            { id: 'bin' as FilterType, icon: <Trash2 size={18} />,     label: 'Tong Sampah', count: recycleBin.length },
          ].map((item) => (
            <button key={item.id} className="drawer-item"
              data-active={currentFilter === item.id} onClick={() => pick(item.id)}>
              <span className="drawer-item__icon">{item.icon}</span>
              <span className="drawer-item__label">{item.label}</span>
              {item.count > 0 && <span className="drawer-item__badge">{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="drawer-divider" />
        <div className="drawer-section-label">Kategori</div>

        <div className="drawer-section">
          {allCats.map((cat) => {
            const cnt = countFor(cat.id);
            return (
              <button key={cat.id} className="drawer-item"
                data-active={currentFilter === cat.id} onClick={() => pick(cat.id)}>
                <span className="drawer-item__emoji">{cat.emoji}</span>
                <span className="drawer-item__label">{cat.label}</span>
                {cnt > 0 && <span className="drawer-item__badge">{cnt}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
