'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useVaultStore, type ActiveView, type EntryCategory } from '@/lib/store/vaultStore';
import { useUIStore, type ActiveMainView } from '@/lib/store/uiStore';
import {
  Lock,
  Key,
  CreditCard,
  FileText,
  Wifi,
  Mail,
  MoreHorizontal,
  Star,
  Clock,
  LayoutGrid,
  ShieldCheck,
  Download,
  Settings,
  X,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_ITEMS: NavItem[] = [
  { id: 'semua',    label: 'Semua',     icon: <LayoutGrid size={15} /> },
  { id: 'favorit',  label: 'Favorit',   icon: <Star size={15} /> },
  { id: 'baru',     label: 'Baru',      icon: <Clock size={15} /> },
];

const ENTRY_CATEGORIES: NavItem[] = [
  { id: 'password', label: 'Password',  icon: <Key size={15} /> },
  { id: 'email',    label: 'Email',     icon: <Mail size={15} /> },
  { id: 'kartu',    label: 'Kartu',     icon: <CreditCard size={15} /> },
  { id: 'wifi',     label: 'Wi-Fi',     icon: <Wifi size={15} /> },
  { id: 'catatan',  label: 'Catatan',   icon: <FileText size={15} /> },
  { id: 'lainnya',  label: 'Lainnya',   icon: <MoreHorizontal size={15} /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        padding: '0 var(--space-3)',
        marginBottom: 'var(--space-1)',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function NavButton({
  item,
  isActive,
  count,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        border: isActive ? '1px solid var(--gold-border)' : '1px solid transparent',
        color: isActive ? 'var(--gold-text)' : 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-outfit)',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }
      }}
    >
      <span style={{ color: isActive ? 'var(--gold)' : 'inherit', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {count !== undefined && count > 0 && (
        <span style={{
          fontSize: '10px',
          fontFamily: 'var(--font-jetbrains)',
          color: isActive ? 'var(--gold)' : 'var(--text-muted)',
          background: isActive ? 'var(--gold-soft)' : 'var(--bg-overlay)',
          padding: '1px 6px',
          borderRadius: 'var(--radius-full)',
          fontWeight: 600,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

function FooterButton({
  icon,
  label,
  isActive,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        border: isActive ? '1px solid var(--gold-border)' : '1px solid transparent',
        color: danger ? 'var(--status-danger)' : isActive ? 'var(--gold-text)' : 'var(--text-muted)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-outfit)',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        textAlign: 'left',
        opacity: danger && !isActive ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = danger
            ? 'rgba(239,68,68,0.08)' : 'var(--bg-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = danger
            ? 'var(--status-danger)' : 'var(--text-secondary)';
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = danger
            ? 'var(--status-danger)' : 'var(--text-muted)';
          if (danger) (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
        }
      }}
    >
      <span style={{ color: isActive ? 'var(--gold)' : 'inherit', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Sidebar Content (reused by desktop + drawer) ─────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { lock } = useAuthStore();
  const { activeView, setActiveView, getCategoryCount } = useVaultStore();
  const { activeMainView, setActiveMainView, closeSidebar } = useUIStore();

  function handleVaultNav(view: ActiveView) {
    setActiveMainView('vault');
    setActiveView(view);
    closeSidebar();
  }

  function handleMainNav(view: ActiveMainView) {
    setActiveMainView(view);
    closeSidebar();
  }

  function handleLock() {
    lock();
    closeSidebar();
  }

  return (
    <>
      {/* Logo */}
      <div style={{
        padding: 'var(--space-5) var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <span style={{ color: 'var(--gold)', flexShrink: 0 }}>
          <ShieldCheck size={20} strokeWidth={1.5} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            Vault
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.06em' }}>
            v1.0
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: 'var(--space-4) var(--space-2)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        <SidebarSection label="Tampilkan">
          {CATEGORY_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeMainView === 'vault' && activeView === item.id}
              count={
                item.id === 'semua' ? getCategoryCount('semua') :
                item.id === 'favorit' ? getCategoryCount('favorit') :
                undefined
              }
              onClick={() => handleVaultNav(item.id)}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Kategori">
          {ENTRY_CATEGORIES.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeMainView === 'vault' && activeView === item.id}
              count={getCategoryCount(item.id as EntryCategory)}
              onClick={() => handleVaultNav(item.id)}
            />
          ))}
        </SidebarSection>
      </nav>

      {/* Footer */}
      <div style={{
        padding: 'var(--space-3) var(--space-2)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
      }}>
        <FooterButton
          icon={<Download size={15} />}
          label="Ekspor / Impor"
          isActive={activeMainView === 'export-import'}
          onClick={() => handleMainNav('export-import')}
        />
        <FooterButton
          icon={<Settings size={15} />}
          label="Pengaturan"
          isActive={activeMainView === 'settings'}
          onClick={() => handleMainNav('settings')}
        />
        <FooterButton
          icon={<Lock size={15} />}
          label="Kunci Vault"
          onClick={handleLock}
          danger
        />
      </div>
    </>
  );
}

// ─── Desktop Sidebar ───────────────────────────────────────────────────────────

export function Sidebar() {
  return (
    <aside
      className="sidebar-desktop"
      style={{
        width: 'var(--sidebar-width)',
        height: '100dvh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        animation: 'slideInLeft var(--transition-slow) ease both',
      }}
    >
      <SidebarContent />
    </aside>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

export function SidebarDrawer() {
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      <div
        onClick={closeSidebar}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'opacity var(--transition-normal)',
        }}
      />
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 'var(--sidebar-width)',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)',
        }}
      >
        <SidebarContent onClose={closeSidebar} />
      </aside>
    </>
  );
}
