'use client';

/**
 * Vault Next — Header
 * Top bar: search (debounced), tombol + Tambah, lock, theme toggle.
 * Responsif: muncul di semua ukuran layar (desktop + mobile).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/appStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { VaultIcon } from '@/components/LoadingScreen';

interface HeaderProps {
  onAddEntry: () => void;    // buka modal tambah entri (Sesi 4)
  autoLockMinutes: number;
  lastActivityAt: number;
}

export function Header({ onAddEntry, autoLockMinutes, lastActivityAt }: HeaderProps) {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const searchQuery    = useAppStore((s) => s.searchQuery);
  const lock           = useAppStore((s) => s.lock);
  const { theme, toggleTheme } = useTheme();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [countdown, setCountdown]   = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search
  const handleSearch = useCallback((val: string) => {
    setLocalQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 280);
  }, [setSearchQuery]);

  // Sinkronisasi saat store reset
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Countdown auto-lock
  useEffect(() => {
    if (autoLockMinutes <= 0) { setCountdown(''); return; }

    const update = () => {
      const elapsed = (Date.now() - lastActivityAt) / 1000;
      const remaining = autoLockMinutes * 60 - elapsed;
      if (remaining <= 0) { setCountdown(''); return; }
      const m = Math.floor(remaining / 60);
      const s = Math.floor(remaining % 60);
      // Hanya tampilkan countdown di 2 menit terakhir
      if (remaining <= 120) {
        setCountdown(`${m}:${String(s).padStart(2, '0')}`);
      } else {
        setCountdown('');
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [autoLockMinutes, lastActivityAt]);

  return (
    <header className="app-header">
      {/* Mobile: logo kiri */}
      <div className="app-header__logo-mobile">
        <VaultIcon size={22} />
        <span className="app-header__logo-text">Vault</span>
      </div>

      {/* Search bar */}
      <div className="app-header__search-wrap">
        <span className="app-header__search-icon" aria-hidden="true">🔍</span>
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
            ✕
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className="app-header__actions">
        {/* Countdown badge */}
        {countdown && (
          <span
            className="app-header__countdown"
            title={`Auto-lock dalam ${countdown}`}
            aria-label={`Auto-lock dalam ${countdown}`}
          >
            🔒 {countdown}
          </span>
        )}

        {/* Tambah */}
        <button
          className="btn btn-primary app-header__add-btn"
          onClick={onAddEntry}
          aria-label="Tambah entri baru"
        >
          <span aria-hidden="true">+</span>
          <span className="app-header__add-label">Tambah</span>
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Lock */}
        <button
          className="icon-btn icon-btn--danger"
          onClick={lock}
          aria-label="Kunci vault"
          title="Kunci vault"
        >
          🔒
        </button>
      </div>
    </header>
  );
}
