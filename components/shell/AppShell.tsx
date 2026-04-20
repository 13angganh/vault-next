'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useVaultStore } from '@/lib/store/vaultStore';
import { useUIStore } from '@/lib/store/uiStore';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { Sidebar, SidebarDrawer } from './Sidebar';
import { Header } from './Header';
import { EntryCard } from '@/components/entries/EntryCard';
import { DetailView } from '@/components/entries/DetailView';
import { EntryForm } from '@/components/entries/EntryForm';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { InstallBanner } from '@/components/ui/InstallBanner';
import { ExportImportView } from '@/components/views/ExportImportView';
import { SettingsView } from '@/components/views/SettingsView';
import { Menu } from 'lucide-react';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { activeView, searchQuery, startCreating } = useVaultStore();

  if (searchQuery) {
    return (
      <div style={emptyStyle}>
        <span style={{ fontSize: 32 }}>🔍</span>
        <p style={emptyTitleStyle}>Tidak ada hasil</p>
        <p style={emptyDescStyle}>Coba kata kunci lain</p>
      </div>
    );
  }

  if (activeView === 'favorit') {
    return (
      <div style={emptyStyle}>
        <span style={{ fontSize: 32 }}>⭐</span>
        <p style={emptyTitleStyle}>Belum ada favorit</p>
        <p style={emptyDescStyle}>Bintangi entri untuk melihatnya di sini</p>
      </div>
    );
  }

  return (
    <div style={emptyStyle}>
      <span style={{ fontSize: 32 }}>🔐</span>
      <p style={emptyTitleStyle}>Vault kosong</p>
      <p style={emptyDescStyle}>Mulai dengan menambahkan entri pertama</p>
      <button
        onClick={() => startCreating()}
        style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-2) var(--space-5)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--gold)',
          border: 'none',
          color: 'var(--bg-root)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-outfit)',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Tambah Entri
      </button>
    </div>
  );
}

const emptyStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', height: '100%', gap: 'var(--space-2)',
  animation: 'fadeScaleIn var(--transition-slow) ease both',
};
const emptyTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)',
};
const emptyDescStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)', color: 'var(--text-muted)',
};

// ─── Entry list ───────────────────────────────────────────────────────────────

function EntryList() {
  const { getFilteredEntries, isCreating } = useVaultStore();
  const entries = getFilteredEntries();

  if (entries.length === 0 && !isCreating) {
    return <EmptyState />;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      padding: 'var(--space-4)', overflowY: 'auto', height: '100%',
    }}>
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

// ─── Vault View (main entry list + detail) ────────────────────────────────────

function VaultView() {
  const { isCreating, editingId } = useVaultStore();

  return (
    <div style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      overflow: 'hidden',
      position: 'relative',
    }}
      className="vault-grid"
    >
      <EntryList />
      <DetailView />
      {(isCreating || editingId) && <EntryForm />}
    </div>
  );
}

// ─── Mobile Header (hamburger) ────────────────────────────────────────────────

function MobileMenuButton() {
  const { toggleSidebar } = useUIStore();

  return (
    <button
      onClick={toggleSidebar}
      className="mobile-menu-btn"
      style={{
        display: 'none', // shown via CSS @media
        alignItems: 'center',
        justifyContent: 'center',
        width: 36, height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <Menu size={18} />
    </button>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell() {
  const { recordActivity, checkSessionExpiry, isUnlocked } = useAuthStore();
  const { loadVault, clearVault, isLoaded } = useVaultStore();
  const { activeMainView } = useUIStore();

  // Load vault on mount
  useEffect(() => {
    if (isUnlocked && !isLoaded) {
      const salt = storage.get(STORAGE_KEYS.SALT);
      const masterHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
      if (salt && masterHash) {
        loadVault(masterHash, salt);
      }
    }
  }, [isUnlocked, isLoaded, loadVault]);

  // Clear vault when locked
  useEffect(() => {
    if (!isUnlocked) {
      clearVault();
    }
  }, [isUnlocked, clearVault]);

  // Session expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 30_000);
    return () => clearInterval(interval);
  }, [checkSessionExpiry]);

  // Record activity
  const handleActivity = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [handleActivity]);

  if (!isUnlocked) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg-root)',
        animation: 'fadeIn var(--transition-normal) ease both',
      }}
    >
      {/* Install prompt banner — hilang otomatis jika sudah terinstall */}
      <InstallBanner />

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Drawer Sidebar */}
        <SidebarDrawer />

        {/* Main area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Header — hanya tampil di vault view */}
          {activeMainView === 'vault' && (
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <MobileMenuButton />
              <Header />
            </div>
          )}

          {/* Mobile topbar for non-vault views */}
          {activeMainView !== 'vault' && (
            <div
              className="mobile-topbar"
              style={{
                display: 'none', // shown via CSS @media
                height: 'var(--appbar-height)',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-subtle)',
                alignItems: 'center',
                padding: '0 var(--space-4)',
                gap: 'var(--space-3)',
                flexShrink: 0,
              }}
            >
              <MobileMenuButton />
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {activeMainView === 'export-import' ? 'Ekspor / Impor' : 'Pengaturan'}
              </span>
            </div>
          )}

          {/* Content area — animasi transisi antar view */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {activeMainView === 'vault' && (
              <div key="vault" style={{ flex: 1, display: 'flex', overflow: 'hidden', animation: 'viewEnter var(--transition-normal) ease both' }}>
                <VaultView />
              </div>
            )}
            {activeMainView === 'export-import' && (
              <div key="export" style={{ flex: 1, display: 'flex', overflow: 'hidden', animation: 'viewEnter var(--transition-normal) ease both' }}>
                <ExportImportView />
              </div>
            )}
            {activeMainView === 'settings' && (
              <div key="settings" style={{ flex: 1, display: 'flex', overflow: 'hidden', animation: 'viewEnter var(--transition-normal) ease both' }}>
                <SettingsView />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
