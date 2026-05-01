'use client';

/**
 * Vault Next — Header
 * - Hamburger kiri (buka/tutup sidebar overlay)
 * - Nama view aktif di tengah
 * - Search + Actions kanan
 * - Tap target 44×44px untuk semua icon button
 */

import { useEffect, useRef, useState, useCallback } from 'react';

import { Search, X, Plus, Sun, Moon, Lock, Timer, Menu } from 'lucide-react';
import { useAppStore }        from '@/lib/store/appStore';
import { useTheme }           from '@/components/providers/ThemeProvider';

interface HeaderProps {
  onAddEntry:       () => void;
  onToggleSidebar:  () => void;
  sidebarOpen:      boolean;
  activeView:       string;
  autoLockMinutes:  number;
  lastActivityAt:   number;
}

export function Header({
  onAddEntry,
  onToggleSidebar,
  sidebarOpen,
  activeView,
  autoLockMinutes,
  lastActivityAt,
}: HeaderProps) {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchQuery    = useAppStore((s) => s.searchQuery);
  const lock           = useAppStore((s) => s.lock);
  const { theme, toggleTheme } = useTheme();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [countdown,  setCountdown]  = useState('');
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      {/* Hamburger — kiri, flex-shrink:0 */}
      <button
        className="app-header__hamburger"
        onClick={onToggleSidebar}
        aria-label="Buka menu"
        aria-expanded={sidebarOpen}
      >
        <Menu size={20} />
      </button>

      {/* Search — melebar mengisi sisa ruang */}
      <div className="app-header__search-wrap">
        <Search size={14} className="app-header__search-icon" aria-hidden="true" />
        <input
          type="search"
          className="app-header__search"
          placeholder="Cari entri…"
          value={localQuery}
          onChange={(e) => handleSearch(e.target.value)}
          aria-label="Cari entri"
        />
        {localQuery && (
          <button
            className="app-header__search-clear"
            onClick={() => handleSearch('')}
            aria-label="Hapus pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Right actions — flex-shrink:0, ukuran tetap */}
      <div className="app-header__actions">
        {countdown && (
          <span className="app-header__countdown" title={`Auto-lock dalam ${countdown}`}>
            <Timer size={12} /> {countdown}
          </span>
        )}

        {/* Tambah — icon-only button agar tidak makan ruang */}
        {activeView !== 'Pengaturan' && (
          <button
            className="app-header__add-btn"
            onClick={onAddEntry}
            aria-label="Tambah entri baru"
            title="Tambah entri"
          >
            <Plus size={18} />
          </button>
        )}

        {/* Tema toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Kunci */}
        <button
          className="icon-btn icon-btn--danger"
          onClick={lock}
          aria-label="Kunci vault"
          title="Kunci vault"
        >
          <Lock size={16} />
        </button>
      </div>
    </header>
  );
}
