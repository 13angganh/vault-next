'use client';

import { useState } from 'react';
import {
  Lock,
  KeyRound,
  Moon,
  Sun,
  Timer,
  Eye,
  EyeOff,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useUIStore } from '@/lib/store/uiStore';
import { useVaultStore } from '@/lib/store/vaultStore';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { hashPIN, hashMasterPW } from '@/lib/crypto';
import { useTheme } from '@/components/providers/ThemeProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  description,
  children,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-4)',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--bg-hover)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(240,165,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color: danger ? '#ef4444' : 'var(--gold)' }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-sm)', fontWeight: 600,
          color: danger ? '#ef4444' : 'var(--text-primary)',
        }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 'var(--text-xs)',
      fontWeight: 600,
      color: 'var(--text-muted)',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: 'var(--space-2)',
      paddingLeft: 'var(--space-1)',
    }}>
      {children}
    </h2>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}>
      {children}
    </div>
  );
}

// ─── PIN Change Panel ─────────────────────────────────────────────────────────

function ChangePINPanel({ onClose }: { onClose: () => void }) {
  const { toast } = useUIStore();
  const { getSalt } = useAuthStore();
  const [oldPIN, setOldPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (newPIN.length < 4) { setError('PIN baru minimal 4 digit.'); return; }
    if (newPIN !== confirmPIN) { setError('Konfirmasi PIN tidak cocok.'); return; }

    setIsLoading(true);
    try {
      const salt = getSalt();
      const storedHash = storage.get(STORAGE_KEYS.PIN_HASH);
      const oldHash = await hashPIN(oldPIN, salt);
      if (oldHash !== storedHash) { setError('PIN lama tidak benar.'); setIsLoading(false); return; }

      const newHash = await hashPIN(newPIN, salt);
      storage.set(STORAGE_KEYS.PIN_HASH, newHash);
      toast.success('PIN berhasil diubah');
      onClose();
    } catch {
      setError('Gagal mengubah PIN. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PanelOverlay onClose={onClose} title="Ubah PIN">
      <InputField label="PIN Lama" value={oldPIN} onChange={setOldPIN} show={showOld} onToggle={() => setShowOld(!showOld)} type="number" placeholder="Masukkan PIN lama" />
      <InputField label="PIN Baru" value={newPIN} onChange={setNewPIN} show={showNew} onToggle={() => setShowNew(!showNew)} type="number" placeholder="Min. 4 digit" />
      <InputField label="Konfirmasi PIN Baru" value={confirmPIN} onChange={setConfirmPIN} show={showNew} type="number" placeholder="Ulangi PIN baru" />
      {error && <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444' }}>{error}</p>}
      <PanelActions onClose={onClose} onSave={handleSave} isLoading={isLoading} />
    </PanelOverlay>
  );
}

// ─── Master PW Change Panel ───────────────────────────────────────────────────

function ChangeMasterPWPanel({ onClose }: { onClose: () => void }) {
  const { toast } = useUIStore();
  const { getSalt } = useAuthStore();
  const { saveVault } = useVaultStore();
  const [oldPW, setOldPW] = useState('');
  const [newPW, setNewPW] = useState('');
  const [confirmPW, setConfirmPW] = useState('');
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (newPW.length < 8) { setError('Password baru minimal 8 karakter.'); return; }
    if (newPW !== confirmPW) { setError('Konfirmasi password tidak cocok.'); return; }

    setIsLoading(true);
    try {
      const salt = getSalt();
      const storedHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
      const oldHash = await hashMasterPW(oldPW, salt);
      if (oldHash !== storedHash) { setError('Password lama tidak benar.'); setIsLoading(false); return; }

      const newHash = await hashMasterPW(newPW, salt);
      storage.set(STORAGE_KEYS.MASTER_PW_HASH, newHash);

      // Re-derive key and re-encrypt vault
      const { deriveKey } = await import('@/lib/crypto');
      const newKey = await deriveKey(newHash, salt);
      useVaultStore.setState({ encryptionKey: newKey });
      await saveVault();

      toast.success('Master password berhasil diubah dan vault dienkripsi ulang');
      onClose();
    } catch {
      setError('Gagal mengubah password. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PanelOverlay onClose={onClose} title="Ubah Master Password">
      <InputField label="Password Lama" value={oldPW} onChange={setOldPW} show={show} onToggle={() => setShow(!show)} placeholder="Password lama" />
      <InputField label="Password Baru" value={newPW} onChange={setNewPW} show={show} placeholder="Min. 8 karakter" />
      <InputField label="Konfirmasi Password Baru" value={confirmPW} onChange={setConfirmPW} show={show} placeholder="Ulangi password baru" />
      {error && <p style={{ fontSize: 'var(--text-xs)', color: '#ef4444' }}>{error}</p>}
      <PanelActions onClose={onClose} onSave={handleSave} isLoading={isLoading} />
    </PanelOverlay>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function PanelOverlay({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)',
        maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
      }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, show, onToggle, type = 'text', placeholder,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  show?: boolean; onToggle?: () => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type={show || type === 'text' ? 'text' : 'password'}
          inputMode={type === 'number' ? 'numeric' : undefined}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: onToggle ? '8px 36px 8px 12px' : '8px 12px',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)', fontFamily: 'var(--font-outfit)', outline: 'none',
          }}
        />
        {onToggle && (
          <button
            onClick={onToggle}
            style={{
              position: 'absolute', right: 10, color: 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

function PanelActions({ onClose, onSave, isLoading }: { onClose: () => void; onSave: () => void; isLoading: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
      <button
        onClick={onClose}
        style={{
          flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
          fontFamily: 'var(--font-outfit)',
        }}
      >
        Batal
      </button>
      <button
        onClick={onSave}
        disabled={isLoading}
        style={{
          flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
          background: 'var(--gold)', border: 'none', color: 'var(--bg-root)',
          fontSize: 'var(--text-sm)', fontWeight: 600, cursor: isLoading ? 'wait' : 'pointer',
          fontFamily: 'var(--font-outfit)', opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const SESSION_OPTIONS = [
  { label: '2 menit', ms: 2 * 60 * 1000 },
  { label: '5 menit', ms: 5 * 60 * 1000 },
  { label: '15 menit', ms: 15 * 60 * 1000 },
  { label: '30 menit', ms: 30 * 60 * 1000 },
  { label: '1 jam', ms: 60 * 60 * 1000 },
];

export function SettingsView() {
  const { lock, sessionExpiryMs } = useAuthStore();
  const { clearVault } = useVaultStore();
  const { toast } = useUIStore();
  const { theme, toggleTheme } = useTheme();
  const [openPanel, setOpenPanel] = useState<'pin' | 'master' | null>(null);

  function handleLock() {
    clearVault();
    lock();
    toast.info('Vault dikunci');
  }

  function handleSessionChange(ms: number) {
    useAuthStore.setState({ sessionExpiryMs: ms });
    const label = SESSION_OPTIONS.find((o) => o.ms === ms)?.label ?? '?';
    toast.success(`Timeout sesi diubah ke ${label}`);
  }

  const currentSessionLabel = SESSION_OPTIONS.find((o) => o.ms === sessionExpiryMs)?.label ?? '5 menit';

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      maxWidth: 600,
      width: '100%',
      margin: '0 auto',
      animation: 'fadeScaleIn var(--transition-slow) ease both',
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Pengaturan
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          Konfigurasi keamanan dan tampilan Vault
        </p>
      </div>

      {/* ── Keamanan ── */}
      <div>
        <SectionTitle>Keamanan</SectionTitle>
        <SectionCard>
          <button
            onClick={() => setOpenPanel('pin')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <SettingRow icon={<Lock size={16} />} label="Ubah PIN" description="Ganti PIN kamu">
              <ChevronRight size={16} color="var(--text-muted)" />
            </SettingRow>
          </button>
          <button
            onClick={() => setOpenPanel('master')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <SettingRow icon={<KeyRound size={16} />} label="Ubah Master Password" description="Vault akan dienkripsi ulang">
              <ChevronRight size={16} color="var(--text-muted)" />
            </SettingRow>
          </button>
        </SectionCard>
      </div>

      {/* ── Sesi ── */}
      <div>
        <SectionTitle>Sesi</SectionTitle>
        <SectionCard>
          <SettingRow
            icon={<Timer size={16} />}
            label="Timeout Otomatis"
            description={`Kunci vault setelah tidak aktif · Sekarang: ${currentSessionLabel}`}
          >
            <select
              value={sessionExpiryMs}
              onChange={(e) => handleSessionChange(Number(e.target.value))}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontFamily: 'var(--font-outfit)',
                padding: '6px var(--space-3)', cursor: 'pointer', outline: 'none',
              }}
            >
              {SESSION_OPTIONS.map((o) => (
                <option key={o.ms} value={o.ms}>{o.label}</option>
              ))}
            </select>
          </SettingRow>
        </SectionCard>
      </div>

      {/* ── Tampilan ── */}
      <div>
        <SectionTitle>Tampilan</SectionTitle>
        <SectionCard>
          <SettingRow
            icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            label="Tema"
            description={theme === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif'}
          >
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-outfit)',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </button>
          </SettingRow>
        </SectionCard>
      </div>

      {/* ── Aksi ── */}
      <div>
        <SectionTitle>Aksi</SectionTitle>
        <SectionCard>
          <button
            onClick={handleLock}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
          >
            <SettingRow icon={<LogOut size={16} />} label="Kunci Vault Sekarang" description="Kembali ke layar kunci" danger>
              <ChevronRight size={16} color="#ef4444" />
            </SettingRow>
          </button>
        </SectionCard>
      </div>

      {/* ── Info ── */}
      <div style={{ textAlign: 'center', paddingBottom: 'var(--space-8)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains)' }}>
          Vault Next v1.0 · AES-256-GCM · 100% Offline
        </p>
      </div>

      {/* Panels */}
      {openPanel === 'pin' && <ChangePINPanel onClose={() => setOpenPanel(null)} />}
      {openPanel === 'master' && <ChangeMasterPWPanel onClose={() => setOpenPanel(null)} />}
    </div>
  );
}
