'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

type ShellView = 'vault' | 'settings';

export function AppShell() {
  const [shellView,     setShellView]     = useState<ShellView>('vault');
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [showBackup,    setShowBackup]    = useState(false);
  const [swUpdate,      setSwUpdate]      = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const vaultListRef = useRef<VaultListViewRef>(null);

  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);
  const setFilter       = useAppStore((s) => s.setFilter);

  useRipple();

  /* ── SW update listener ── */
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const handleSWUpdate = () => {
      setSwUpdate(true);
      setTimeout(() => window.location.reload(), 3000);
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
  }, []);

  const handleAddEntry = useCallback(() => {
    setShellView('vault');
    setFilter('all');
    setTimeout(() => vaultListRef.current?.openAddForm(), 80);
  }, [setFilter]);

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

  const handleGlobalLoading = useCallback((v: boolean) => {
    setGlobalLoading(v);
  }, []);

  const viewTitle = shellView === 'settings' ? 'Pengaturan' : 'Vault Next';

  return (
    <div className="app-shell">
      <AutoLockManager />

      {/* Linear progress bar */}
      {globalLoading && <div className="linear-progress" aria-hidden="true" />}

      {/* SW update bar */}
      {swUpdate && (
        <div className="sw-update-bar" role="status" aria-live="polite">
          <span>Versi baru tersedia, memperbarui…</span>
          <div className="sw-update-bar__dots">
            <span /><span /><span />
          </div>
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
