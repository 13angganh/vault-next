'use client';

/**
 * Sidebar v2 — drawer "Midnight Gold". Hanya dirender bila gaya navigasi = 'sidebar'.
 * Header berisi merek + ringkasan vault; menu dibagi Menu / Kategori; footer: Pengaturan, Tema, Kunci.
 */
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LayoutGrid, Star, Trash2, Settings, X, Sun, Moon, Lock, ChevronRight } from 'lucide-react';
import { VaultIcon }          from '@/components/common/LoadingScreen';
import { APP_VERSION }        from '@/lib/constants';
import { useAppStore }        from '@/lib/store/appStore';
import { useTheme }           from '@/components/providers/ThemeProvider';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { FilterType }    from '@/lib/store/appStore';
import { CategoryIcon }       from '@/components/entries/CategoryIcon';

interface SidebarProps {
  open:            boolean;
  onClose:         () => void;
  onSettingsClick: () => void;
  onNavVault:      () => void;
}

export function Sidebar({ open, onClose, onSettingsClick, onNavVault }: SidebarProps) {
  const prefersReduced = useReducedMotion();
  const { theme, toggleTheme } = useTheme();
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter     = useAppStore((s) => s.setFilter);
  const vault         = useAppStore((s) => s.vault);
  const recycleBin    = useAppStore((s) => s.recycleBin);
  const customCats    = useAppStore((s) => s.customCats);
  const lock          = useAppStore((s) => s.lock);

  const favCount = vault.filter((e) => e.fav).length;
  const allCats  = [...DEFAULT_CATEGORIES, ...customCats.map((c) => ({ id: c.id, label: c.label }))];
  const countFor = (id: string) => vault.filter((e) => e.cat === id).length;
  const go = (f: FilterType) => { onNavVault(); setFilter(f); onClose(); };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="sidebar-overlay sidebar-overlay--open" onClick={onClose} aria-hidden="true"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.aside className="sidebar sidebar--open sbx" aria-label="Menu navigasi" role="navigation"
            initial={{ x: prefersReduced ? 0 : '-100%' }} animate={{ x: 0 }} exit={{ x: prefersReduced ? 0 : '-100%' }}
            transition={{ duration: prefersReduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="sbx-hero">
              <div className="sbx-top">
                <div className="sbx-brand">
                  <span className="sbx-brand__mark"><VaultIcon size={42} /></span>
                  <div>
                    <div className="sbx-brand__name"><span>Aurum</span> Vault</div>
                    <div className="sbx-brand__ver">v{APP_VERSION}</div>
                  </div>
                </div>
                <button className="sbx-close" onClick={onClose} aria-label="Tutup menu"><X size={18} /></button>
              </div>
              <div className="sbx-stats">
                <div><b>{vault.length}</b><span>Entri</span></div>
                <div><b>{favCount}</b><span>Favorit</span></div>
                <div><b>{recycleBin.length}</b><span>Sampah</span></div>
              </div>
            </div>

            <div className="sbx-scroll">
              <p className="sbx-label">Menu</p>
              <Item icon={<LayoutGrid size={17} />} label="Semua entri" count={vault.length} active={currentFilter === 'all'} onClick={() => go('all')} />
              <Item icon={<Star size={17} />} label="Favorit" count={favCount} active={currentFilter === 'fav'} onClick={() => go('fav')} />
              <Item icon={<Trash2 size={17} />} label="Sampah" count={recycleBin.length} active={currentFilter === 'bin'} onClick={() => go('bin')} />
              <p className="sbx-label">Kategori</p>
              {allCats.map((c) => (
                <Item key={c.id} icon={<CategoryIcon catId={c.id} customCats={customCats} size="sm" />} label={c.label}
                  count={countFor(c.id)} active={currentFilter === c.id} onClick={() => go(c.id as FilterType)} plain />
              ))}
            </div>

            <div className="sbx-foot">
              <button className="sbx-settings" onClick={() => { onSettingsClick(); onClose(); }}>
                <span className="sbx-item__icon"><Settings size={17} /></span>
                <span>Pengaturan</span>
                <ChevronRight size={16} />
              </button>
              <div className="sbx-foot__row">
                <button className="sbx-pill" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}{theme === 'dark' ? 'Terang' : 'Gelap'}
                </button>
                <button className="sbx-pill sbx-pill--danger" onClick={() => { onClose(); lock(); }}>
                  <Lock size={15} />Kunci
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function Item({ icon, label, count, active, onClick, plain }: { icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void; plain?: boolean }) {
  return (
    <button className="sbx-item" data-active={active} onClick={onClick} aria-current={active ? 'page' : undefined}>
      <span className={`sbx-item__icon${plain ? ' sbx-item__icon--plain' : ''}`}>{icon}</span>
      <span className="sbx-item__label">{label}</span>
      {count != null && count > 0 && <span className="sbx-item__count">{count}</span>}
    </button>
  );
}
