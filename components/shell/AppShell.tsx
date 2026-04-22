'use client';

/**
 * Vault Next — AppShell
 * Sesi 6C fixes:
 * - Bug 3: BottomNav bisa switch langsung dari Settings ke Vault/Favorit/Kategori
 * - Bug 2: view transition smooth tanpa jumpy
 */

import { useState, useRef, useCallback } from 'react';
import { AutoLockManager }      from '@/components/shell/AutoLockManager';
import { Sidebar }               from '@/components/shell/Sidebar';
import { BottomNav }             from '@/components/shell/BottomNav';
import { Header }                from '@/components/shell/Header';
import { CategoryDrawer }        from '@/components/shell/CategoryDrawer';
import { VaultListView }         from '@/components/views/VaultListView';
import type { VaultListViewRef } from '@/components/views/VaultListView';
import { SettingsView }          from '@/components/views/SettingsView';
import { BackupReminderModal }   from '@/components/views/BackupReminderModal';
import { BackupModal }           from '@/components/views/BackupModal';
import { useAppStore }           from '@/lib/store/appStore';

type ShellView = 'vault' | 'settings';

export function AppShell() {
  const [shellView,     setShellView]     = useState<ShellView>('vault');
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [showBackup,    setShowBackup]    = useState(false);
  const vaultListRef = useRef<VaultListViewRef>(null);

  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);
  const setFilter       = useAppStore((s) => s.setFilter);

  // Buka form tambah entri — selalu switch ke vault dulu
  const handleAddEntry = useCallback(() => {
    setShellView('vault');
    setTimeout(() => vaultListRef.current?.openAddForm(), 50);
  }, []);

  // Navigasi dari BottomNav — bisa switch dari settings langsung ke vault/fav
  const handleNavVault = useCallback(() => {
    setFilter('all');
    setShellView('vault');
  }, [setFilter]);

  const handleNavFav = useCallback(() => {
    setFilter('fav');
    setShellView('vault');
  }, [setFilter]);

  const handleNavCategory = useCallback(() => {
    setShellView('vault');
    setCatDrawerOpen(true);
  }, []);

  const handleNavSettings = useCallback(() => {
    setShellView('settings');
  }, []);

  return (
    <div className="app-shell">
      <AutoLockManager />

      <Header
        onAddEntry={handleAddEntry}
        autoLockMinutes={autoLockMinutes}
        lastActivityAt={lastActivityAt}
      />

      <div className="app-body">
        <Sidebar onSettingsClick={handleNavSettings} />

        <main className="app-main" id="main-content" tabIndex={-1}>
          {/* Kedua view di-render sekaligus, visibility dikontrol CSS — tidak ada mount/unmount */}
          <div className={`shell-view ${shellView === 'vault' ? 'shell-view--active' : 'shell-view--hidden'}`}>
            <VaultListView ref={vaultListRef} />
          </div>
          <div className={`shell-view ${shellView === 'settings' ? 'shell-view--active' : 'shell-view--hidden'}`}>
            <SettingsView onClose={() => setShellView('vault')} />
          </div>
        </main>
      </div>

      <BottomNav
        onVaultTab={handleNavVault}
        onFavTab={handleNavFav}
        onCategoryTab={handleNavCategory}
        onSettingsTab={handleNavSettings}
        settingsActive={shellView === 'settings'}
      />

      <CategoryDrawer
        open={catDrawerOpen}
        onClose={() => setCatDrawerOpen(false)}
      />

      <BackupReminderModal onOpenBackup={() => setShowBackup(true)} />
      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  );
}
