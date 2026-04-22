'use client';

/**
 * Vault Next — CategoryDrawer
 * Bottom sheet / drawer untuk memilih kategori di mobile.
 * Muncul saat tap tab "Kategori" di BottomNav.
 */

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType } from '@/lib/store/appStore';

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

  const allCats = [
    ...DEFAULT_CATEGORIES,
    ...customCats.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  const countFor = (catId: string) => vault.filter((e) => e.cat === catId).length;

  // Tutup drawer saat Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const pick = (id: FilterType) => {
    setFilter(id);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Pilih kategori">
        <div className="drawer-handle" />
        <h3 className="drawer-title">Kategori</h3>

        {/* Filter Semua, Favorit, Recycle Bin */}
        <div className="drawer-section">
          {[
            { id: 'all' as FilterType,  emoji: '🗂️', label: 'Semua',       count: vault.length },
            { id: 'fav' as FilterType,  emoji: '⭐', label: 'Favorit',     count: vault.filter((e) => e.fav).length },
            { id: 'bin' as FilterType,  emoji: '🗑️', label: 'Recycle Bin', count: recycleBin.length },
          ].map((item) => (
            <button
              key={item.id}
              className="drawer-item"
              data-active={currentFilter === item.id}
              onClick={() => pick(item.id)}
            >
              <span className="drawer-item__emoji">{item.emoji}</span>
              <span className="drawer-item__label">{item.label}</span>
              {item.count > 0 && (
                <span className="drawer-item__badge">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="drawer-divider" />
        <div className="drawer-section-label">Kategori</div>

        <div className="drawer-section">
          {allCats.map((cat) => {
            const cnt = countFor(cat.id);
            return (
              <button
                key={cat.id}
                className="drawer-item"
                data-active={currentFilter === cat.id}
                onClick={() => pick(cat.id)}
              >
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
