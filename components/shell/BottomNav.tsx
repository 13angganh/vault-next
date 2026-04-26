'use client';

/**
 * Vault Next — BottomNav
 * Sesi 6C: Setiap tab punya handler sendiri — bisa switch langsung dari Settings.
 */

import { Lock, Star, LayoutGrid, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';

interface BottomNavProps {
  onVaultTab:    () => void;
  onFavTab:      () => void;
  onCategoryTab: () => void;
  onSettingsTab: () => void;
  settingsActive?: boolean;
}

export function BottomNav({
  onVaultTab, onFavTab, onCategoryTab, onSettingsTab, settingsActive,
}: BottomNavProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);

  const activeTab: 'vault' | 'fav' | 'cats' | 'settings' = (() => {
    if (settingsActive)              return 'settings';
    if (currentFilter === 'fav')     return 'fav';
    if (currentFilter !== 'all' && currentFilter !== 'bin') return 'cats';
    return 'vault';
  })();

  const Tab = ({
    id, icon, label, onClick,
  }: {
    id: typeof activeTab;
    icon: React.ReactNode;
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
        <span className="bottom-nav__icon">{icon}</span>
        <span className="bottom-nav__label">{label}</span>
        {active && <span className="bottom-nav__indicator" />}
      </button>
    );
  };

  return (
    <nav className="bottom-nav" aria-label="Navigasi bawah">
      <Tab id="vault"    icon={<Lock size={20} />}       label="Vault"      onClick={onVaultTab} />
      <Tab id="fav"      icon={<Star size={20} />}       label="Favorit"    onClick={onFavTab} />
      <Tab id="cats"     icon={<LayoutGrid size={20} />} label="Kategori"   onClick={onCategoryTab} />
      <Tab id="settings" icon={<Settings size={20} />}   label="Pengaturan" onClick={onSettingsTab} />
    </nav>
  );
}
