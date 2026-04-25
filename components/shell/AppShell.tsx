'use client';

/**
 * Vault Next — AppShell
 * - Hamburger sidebar overlay (bukan persistent)
 * - Tidak ada BottomNav
 * - Single active view dengan animasi mount/unmount (fadeScaleIn)
 * - SW update listener: notifikasi "Versi baru tersedia..." → auto reload
 * - Linear progress bar di atas header saat loading
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRipple }           from '@/lib/hooks/useRipple';
import { AutoLockManager }    from '@/components/shell/AutoLockManager';
import { Sidebar }            from '@/components/shell/Sidebar';
import { Header }             from '@/components/shell/Header';
import { VaultListView }      from '@/components/views/VaultListView';
import type { VaultListViewRef } from '@/components/views/VaultListView';
import { SettingsView }       from '@/components/views/SettingsView';
import { BackupReminderModal } from '@/components/views/BackupReminderModal';
import { BackupModal }        from '@/components/views/BackupModal';
import { useAppStore }        from '@/lib/store/appStore';

type ShellView = 'vault' | 'settings';

export function AppShell() {
  const [shellView,    setShellView]    = useState<ShellView>('vault');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [showBackup,   setShowBackup]   = useState(false);
  const [swUpdate,     setSwUpdate]     = useState(false);   // notifikasi SW update
  const [globalLoading, setGlobalLoading] = useState(false); // linear progress bar
  const vaultListRef = useRef<VaultListViewRef>(null);

  useRipple(); // Ripple effect untuk semua .btn, .icon-btn, .sidebar-item

  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);
  const setFilter       = useAppStore((s) => s.setFilter);

  /* ── Service Worker update listener ── */
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSWUpdate = () => {
      setSwUpdate(true);
      /* Auto-reload setelah 3 detik (setelah user baca notifikasi) */
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
    };
  }, []);

  /* ── Handlers ── */
  const handleAddEntry = useCallback(() => {
    setShellView('vault');
    setFilter('all');
    /* Beri waktu sedikit untuk view vault aktif dulu */
    setTimeout(() => vaultListRef.current?.openAddForm(), 80);
  }, [setFilter]);

  const handleNavSettings = useCallback(() => {
    setShellView('settings');
  }, []);

  const handleGlobalLoading = useCallback((v: boolean) => {
    setGlobalLoading(v);
  }, []);

  /* Nama view untuk header */
  const viewTitle = shellView === 'settings' ? 'Pengaturan' : 'Vault';

  return (
    <div className="app-shell">
      <AutoLockManager />

      {/* Linear progress bar — global loading indicator */}
      {globalLoading && <div className="linear-progress" aria-hidden="true" />}

      {/* SW update notifikasi */}
      {swUpdate && (
        <div className="sw-update-bar" role="status" aria-live="polite">
          <span>Versi baru tersedia, memperbarui…</span>
          <div className="sw-update-bar__dots">
            <span /><span /><span />
          </div>
        </div>
      )}

      <Header
        onAddEntry={handleAddEntry}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        activeView={viewTitle}
        autoLockMinutes={autoLockMinutes}
        lastActivityAt={lastActivityAt}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSettingsClick={handleNavSettings}
      />

      {/* Main content — single active view dengan animasi */}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {shellView === 'vault' && (
          <div className="shell-view-anim" key="vault">
            <VaultListView
              ref={vaultListRef}
              onGlobalLoading={handleGlobalLoading}
            />
          </div>
        )}
        {shellView === 'settings' && (
          <div className="shell-view-anim" key="settings">
            <SettingsView onClose={() => setShellView('vault')} />
          </div>
        )}
      </main>

      <BackupReminderModal onOpenBackup={() => setShowBackup(true)} />
      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  );
}
