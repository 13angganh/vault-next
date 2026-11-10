'use client';
import type { ReactNode } from 'react';
import { LayoutGrid, Star, Plus, Trash2, Settings } from 'lucide-react';
import { useAppStore } from '@/lib/store/appStore';
import type { FilterType } from '@/lib/store/appStore';

interface BottomNavProps {
  shellView:  'vault' | 'settings';
  onVault:    () => void;
  onSettings: () => void;
  onAdd:      () => void;
}

function Item({ on, label, icon, onClick }: { on: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={`bn-item${on ? ' bn-item--on' : ''}`} aria-current={on ? 'page' : undefined} onClick={onClick}>
      <span className="bn-item__icon">{icon}</span>
      <span className="bn-item__label">{label}</span>
    </button>
  );
}

export function BottomNav({ shellView, onVault, onSettings, onAdd }: BottomNavProps) {
  const filter    = useAppStore((s) => s.currentFilter);
  const setFilter = useAppStore((s) => s.setFilter);
  const inVault   = shellView === 'vault';
  const go = (f: FilterType) => { onVault(); setFilter(f); };
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      <Item on={inVault && filter !== 'fav' && filter !== 'bin'} label="Brankas" icon={<LayoutGrid size={20} />} onClick={() => go('all')} />
      <Item on={inVault && filter === 'fav'} label="Favorit" icon={<Star size={20} />} onClick={() => go('fav')} />
      <button type="button" className="bn-add" onClick={onAdd} aria-label="Tambah entri baru"><Plus size={24} strokeWidth={2.4} /></button>
      <Item on={inVault && filter === 'bin'} label="Sampah" icon={<Trash2 size={20} />} onClick={() => go('bin')} />
      <Item on={!inVault} label="Pengaturan" icon={<Settings size={20} />} onClick={onSettings} />
    </nav>
  );
}
