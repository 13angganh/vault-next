'use client';

/**
 * Vault Next — BottomNav
 * Tab bar mobile (≤768px). Sesi 6B: semua emoji → Lucide icons.
 */

import { Lock, Star, LayoutGrid, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import type { FilterType } from '@/lib/store/appStore';

interface BottomNavProps {
  onCategoryTab:  () => void;
  onSettingsTab:  () => void;
  settingsActive?: boolean;   // AppShell pass ini saat shellView === 'settings'
}

export function BottomNav({ onCategoryTab, onSettingsTab, settingsActive }: BottomNavProps) {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);

  const activeTab: 'vault' | 'fav' | 'cats' | 'settings' = (() => {
    if (settingsActive)  return 'settings';
    if (currentFilter === 'fav') return 'fav';
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
      <Tab id="vault"    icon={<Lock size={20} />}        label="Vault"      onClick={() => setFilter('all')} />
      <Tab id="fav"      icon={<Star size={20} />}        label="Favorit"    onClick={() => setFilter('fav')} />
      <Tab id="cats"     icon={<LayoutGrid size={20} />}  label="Kategori"   onClick={onCategoryTab} />
      <Tab id="settings" icon={<Settings size={20} />}    label="Pengaturan" onClick={onSettingsTab} />
    </nav>
  );
}
