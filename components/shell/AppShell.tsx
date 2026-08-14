'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE }               from '@/lib/animation';
import { useRipple }            from '@/lib/hooks/useRipple';
import { AutoLockManager }      from '@/components/shell/AutoLockManager';
import { Sidebar }              from '@/components/shell/Sidebar';
import { Header }               from '@/components/shell/Header';
import { VaultListView }        from '@/components/vault/VaultListView';
import type { VaultListViewRef } from '@/components/vault/VaultListView';
import { SettingsView }         from '@/components/settings/SettingsView';
import { BackupReminderModal }  from '@/components/settings/BackupReminderModal';
import { BackupModal }          from '@/components/settings/BackupModal';
import { useAppStore }          from '@/lib/store/appStore';
import { APP_NAME }             from '@/lib/constants';

type ShellView = 'vault' | 'settings';

export function AppShell() {
  const [shellView,   setShellView]   = useState<ShellView>('vault');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBackup,  setShowBackup]  = useState(false);
  const [swUpdate,    setSwUpdate]    = useState(false);
  const vaultListRef = useRef<VaultListViewRef>(null);

  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);
  const setFilter       = useAppStore((s) => s.setFilter);

  useRipple();

  /* ── SW update listener ──
   * v1.7.0: sebelumnya auto-reload paksa 3 detik setelah SW baru terpasang,
   * tanpa opsi tunda dan tanpa cek apakah user sedang mengetik. Untuk
   * password manager ini berisiko: kalau reload terjadi saat user mengisi
   * form panjang (mis. seed phrase), input yang belum tersimpan bisa hilang.
   * Sekarang: tunda otomatis kalau ada input/textarea/contenteditable yang
   * sedang fokus, dan selalu beri tombol eksplisit alih-alih auto-reload
   * buta. Update tetap tersimpan (browser sudah punya SW baru di background,
   * lihat sw.js), reload cuma soal KAPAN tab ini mengambilnya. */
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isUserTyping = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
    };

    const handleSWUpdate = () => {
      setSwUpdate(true);
      if (!isUserTyping()) {
        setTimeout(() => window.location.reload(), 3000);
      }
      // Kalau user sedang mengetik: TIDAK auto-reload. Bar tetap tampil
      // dengan tombol "Perbarui sekarang" — reload menunggu keputusan user.
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
  }, []);

  const handleAddEntry = useCallback(() => {
    setShellView('vault');
    setFilter('all');
    setTimeout(() => vaultListRef.current?.openAddForm(), 80);
  }, [setFilter]);

  // v1.7.0: onClose sebelumnya inline `() => setShowBackup(false)` di JSX —
  // closure baru setiap render AppShell (yang terjadi di setiap keystroke
  // manapun di app, lewat AutoLockManager yang update lastActivityAt).
  // BackupModal meneruskan onClose ke useFocusTrap sebagai onEscape;
  // referensi yang berubah-ubah itu membuat efek fokusnya re-run terus dan
  // merebut fokus dari textarea sync manual saat user sedang mengetik di
  // dalamnya. setShowBackup dari useState stabil secara referensi, jadi
  // dependency array kosong di sini aman.
  const handleCloseBackup = useCallback(() => setShowBackup(false), []);
  const handleOpenBackup  = useCallback(() => setShowBackup(true), []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Jangan intercept jika sedang di dalam input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Cmd/Ctrl + K → fokus ke search
      if (mod && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) searchInput.focus();
        return;
      }

      // Cmd/Ctrl + / → toggle sidebar
      if (mod && e.key === '/') {
        e.preventDefault();
        setSidebarOpen((v) => !v);
        return;
      }

      // Cmd/Ctrl + N → tambah entri baru (hanya di vault view)
      if (mod && e.key === 'n' && !isEditing) {
        e.preventDefault();
        handleAddEntry();
        return;
      }

      // Escape → tutup sidebar jika terbuka
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddEntry]);

  const handleNavSettings = useCallback(() => {
    setShellView('settings');
  }, []);

  const viewTitle      = shellView === 'settings' ? 'Pengaturan' : APP_NAME;
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="app-shell"
      initial={prefersReduced ? false : { opacity: 0, y: 6 }}
      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: DUR.expand, ease: EASE.out }}
    >
      <AutoLockManager />

      {/* SW update bar */}
      {swUpdate && (
        <div className="sw-update-bar" role="status" aria-live="polite">
          <span>Versi baru tersedia</span>
          <div className="sw-update-bar__dots">
            <span /><span /><span />
          </div>
          <button
            type="button"
            className="sw-update-bar__btn"
            onClick={() => window.location.reload()}
          >
            Perbarui sekarang
          </button>
        </div>
      )}

      {/* Header — sticky di atas */}
      <Header
        onAddEntry={handleAddEntry}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        activeView={viewTitle}
        autoLockMinutes={autoLockMinutes}
        lastActivityAt={lastActivityAt}
      />

      {/* Sidebar overlay */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettingsClick={handleNavSettings}
        onNavVault={() => setShellView('vault')}
      />

      {/* Konten utama — HARUS scrollable */}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {shellView === 'vault' && (
          <div className="shell-view-anim" key="vault">
            <VaultListView ref={vaultListRef} />
          </div>
        )}
        {shellView === 'settings' && (
          <div className="shell-view-anim" key="settings">
            <SettingsView onClose={() => setShellView('vault')} />
          </div>
        )}
      </main>

      <BackupReminderModal onOpenBackup={handleOpenBackup} />
      {showBackup && <BackupModal onClose={handleCloseBackup} />}
    </motion.div>
  );
}
