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
