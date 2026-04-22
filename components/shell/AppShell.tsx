'use client';

/**
 * Vault Next — AppShell
 * Layout utama saat vault terbuka.
 *
 * Desktop (≥769px):
 *   ┌─────────────────────────────────────────────────┐
 *   │  Header (full width)                            │
 *   ├───────────┬─────────────────────────────────────┤
 *   │  Sidebar  │  Main content (view aktif)          │
 *   └───────────┴─────────────────────────────────────┘
 *
 * Mobile (≤768px):
 *   ┌─────────────────────────────────────────────────┐
 *   │  Header                                         │
 *   ├─────────────────────────────────────────────────┤
 *   │  Main content                                   │
 *   ├─────────────────────────────────────────────────┤
 *   │  BottomNav                                      │
 *   └─────────────────────────────────────────────────┘
 */

import { useState, useRef } from 'react';
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
  const [shellView,        setShellView]        = useState<ShellView>('vault');
  const [catDrawerOpen,    setCatDrawerOpen]     = useState(false);
  const [showBackup,       setShowBackup]        = useState(false);
  const vaultListRef = useRef<VaultListViewRef>(null);

  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);

  const handleAddEntry = () => {
    // Switch to vault view first, then open form
    setShellView('vault');
    // Small delay to ensure VaultListView is mounted
    setTimeout(() => vaultListRef.current?.openAddForm(), 50);
  };

  return (
    <div className="app-shell">
      {/* Auto-lock invisible component */}
      <AutoLockManager />

      {/* ── Header (full width) ── */}
      <Header
        onAddEntry={handleAddEntry}
        autoLockMinutes={autoLockMinutes}
        lastActivityAt={lastActivityAt}
      />

      {/* ── Body (sidebar + main) ── */}
      <div className="app-body">
        {/* Sidebar — hanya desktop */}
        <Sidebar onSettingsClick={() => setShellView('settings')} />

        {/* Main content */}
        <main className="app-main" id="main-content" tabIndex={-1}>
          {shellView === 'vault' && <VaultListView ref={vaultListRef} />}
          {shellView === 'settings' && (
            <SettingsView onClose={() => setShellView('vault')} />
          )}
        </main>
      </div>

      {/* ── BottomNav — hanya mobile ── */}
      <BottomNav
        onCategoryTab={() => setCatDrawerOpen(true)}
        onSettingsTab={() => setShellView('settings')}
      />

      {/* ── Category Drawer — mobile ── */}
      <CategoryDrawer
        open={catDrawerOpen}
        onClose={() => setCatDrawerOpen(false)}
      />

      {/* ── Backup Reminder — auto popup ── */}
      <BackupReminderModal onOpenBackup={() => setShowBackup(true)} />

      {/* ── Backup Modal (manual open) ── */}
      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </div>
  );
}
