'use client';

/**
 * Vault Next — BottomNav
 * Tab bar mobile (≤768px): Vault · Favorit · Kategori · Pengaturan
 */

import { useAppStore } from '@/lib/store/appStore';
import type { FilterType } from '@/lib/store/appStore';

interface BottomNavProps {
  onCategoryTab: () => void;   // buka drawer kategori
  onSettingsTab: () => void;   // buka halaman settings
}

export function BottomNav({ onCategoryTab, onSettingsTab }: BottomNavProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);

  // Tentukan tab aktif dari currentFilter
  const activeTab: 'vault' | 'fav' | 'cats' | 'settings' = (() => {
    if (currentFilter === 'fav') return 'fav';
    if (currentFilter === 'settings') return 'settings';
    // Jika bukan 'all' / 'fav' / 'bin', berarti di kategori
    if (currentFilter !== 'all' && currentFilter !== 'bin') return 'cats';
    return 'vault';
  })();

  const Tab = ({
    id,
    emoji,
    label,
    onClick,
  }: {
    id: typeof activeTab;
    emoji: string;
    label: string;
    onClick: () => void;
  }) => {
    const active = activeTab === id;
    return (
      <button
        className="bottom-nav__tab"
        data-active={active}
        onClick={onClick}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        <span className="bottom-nav__emoji">{emoji}</span>
        <span className="bottom-nav__label">{label}</span>
        {active && <span className="bottom-nav__indicator" />}
      </button>
    );
  };

  return (
    <nav className="bottom-nav" aria-label="Navigasi bawah">
      <Tab id="vault"    emoji="🔐" label="Vault"     onClick={() => setFilter('all')} />
      <Tab id="fav"      emoji="⭐" label="Favorit"   onClick={() => setFilter('fav')} />
      <Tab id="cats"     emoji="🗂️" label="Kategori"  onClick={onCategoryTab} />
      <Tab id="settings" emoji="⚙️" label="Pengaturan" onClick={onSettingsTab} />
    </nav>
  );
}
