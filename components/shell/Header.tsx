'use client';

/**
 * Vault Next — Header
 * Sesi 6B: semua emoji → Lucide icons.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Plus, Sun, Moon, Lock, Timer } from 'lucide-react';
import { useAppStore }   from '@/lib/store/appStore';
import { useTheme }      from '@/components/providers/ThemeProvider';
import { VaultIcon }     from '@/components/LoadingScreen';

interface HeaderProps {
  onAddEntry:      () => void;
  autoLockMinutes: number;
  lastActivityAt:  number;
}

export function Header({ onAddEntry, autoLockMinutes, lastActivityAt }: HeaderProps) {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchQuery    = useAppStore((s) => s.searchQuery);
  const lock           = useAppStore((s) => s.lock);
  const { theme, toggleTheme } = useTheme();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [countdown,  setCountdown]  = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((val: string) => {
    setLocalQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(val), 280);
  }, [setSearchQuery]);

  useEffect(() => { setLocalQuery(searchQuery); }, [searchQuery]);

  useEffect(() => {
    if (autoLockMinutes <= 0) { setCountdown(''); return; }
    const update = () => {
      const remaining = autoLockMinutes * 60 - (Date.now() - lastActivityAt) / 1000;
      if (remaining <= 0) { setCountdown(''); return; }
      const m = Math.floor(remaining / 60);
      const s = Math.floor(remaining % 60);
      setCountdown(remaining <= 120 ? `${m}:${String(s).padStart(2, '0')}` : '');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [autoLockMinutes, lastActivityAt]);

  return (
    <header className="app-header">
      {/* Mobile logo */}
      <div className="app-header__logo-mobile">
        <VaultIcon size={22} />
        <span className="app-header__logo-text">Vault</span>
      </div>

      {/* Search */}
      <div className="app-header__search-wrap">
        <Search size={15} className="app-header__search-icon" aria-hidden="true" />
        <input
          type="search"
          className="app-header__search"
          placeholder="Cari entri…"
          value={localQuery}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Cari entri"
        />
        {localQuery && (
          <button className="app-header__search-clear" onClick={() => handleSearch('')} aria-label="Hapus pencarian">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className="app-header__actions">
        {countdown && (
          <span className="app-header__countdown" title={`Auto-lock dalam ${countdown}`}>
            <Timer size={12} /> {countdown}
          </span>
        )}

        <button className="btn btn-primary app-header__add-btn" onClick={onAddEntry} aria-label="Tambah entri baru">
          <Plus size={16} />
          <span className="app-header__add-label">Tambah</span>
        </button>

        <button className="icon-btn" onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="icon-btn icon-btn--danger" onClick={lock} aria-label="Kunci vault" title="Kunci vault">
          <Lock size={16} />
        </button>
      </div>
    </header>
  );
}
