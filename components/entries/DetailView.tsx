'use client';

import { useState, useCallback } from 'react';
import { Copy, Check, Eye, EyeOff, Pencil, Trash2, Star, ExternalLink, ArrowLeft } from 'lucide-react';
import { useVaultStore, type VaultEntry, type EntryCategory } from '@/lib/store/vaultStore';
import { CategoryIcon, CATEGORY_CONFIG } from './CategoryIcon';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, size = 13 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  if (!value) return null;

  return (
    <button
      onClick={handleCopy}
      title="Salin"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: 'transparent',
        color: copied ? 'var(--gold)' : 'var(--text-muted)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'color var(--transition-fast)',
      }}
      onMouseEnter={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
      onMouseLeave={(e) => { if (!copied) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

interface FieldRowProps {
  label: string;
  value: string | undefined;
  secret?: boolean;
  isLink?: boolean;
}

function FieldRow({ label, value, secret, isLink }: FieldRowProps) {
  const [show, setShow] = useState(false);

  if (!value) return null;

  const displayValue = secret && !show
    ? '•'.repeat(Math.min(value.length, 20))
    : value;

  return (
    <div style={{
      padding: 'var(--space-3) 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        fontWeight: 500,
        marginBottom: 4,
        letterSpacing: '0.03em',
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <p style={{
          flex: 1,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          fontFamily: secret ? 'var(--font-jetbrains)' : 'var(--font-outfit)',
          wordBreak: 'break-all',
          lineHeight: 1.4,
          letterSpacing: secret && !show ? '0.1em' : undefined,
        }}>
          {displayValue}
        </p>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {secret && (
            <button
              onClick={() => setShow((v) => !v)}
              title={show ? 'Sembunyikan' : 'Tampilkan'}
              style={iconBtnStyle}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          <CopyButton value={value} />
          {isLink && (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...iconBtnStyle, display: 'inline-flex', textDecoration: 'none', color: 'var(--text-muted)' }}
              title="Buka URL"
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fields per category ──────────────────────────────────────────────────────

function PasswordDetail({ entry }: { entry: VaultEntry }) {
  return (
    <>
      <FieldRow label="Username" value={entry.username} />
      <FieldRow label="Password" value={entry.password} secret />
      <FieldRow label="URL" value={entry.url} isLink />
      <FieldRow label="Catatan" value={entry.notes} />
    </>
  );
}

function EmailDetail({ entry }: { entry: VaultEntry }) {
  return (
    <>
      <FieldRow label="Email" value={entry.email} />
      <FieldRow label="Username" value={entry.username} />
      <FieldRow label="Password" value={entry.password} secret />
      <FieldRow label="URL Provider" value={entry.url} isLink />
      <FieldRow label="Catatan" value={entry.notes} />
    </>
  );
}

function KartuDetail({ entry }: { entry: VaultEntry }) {
  return (
    <>
      <FieldRow label="Nomor Kartu" value={entry.cardNumber} secret />
      <FieldRow label="Pemegang Kartu" value={entry.cardHolder} />
      <FieldRow label="Kadaluarsa" value={entry.cardExpiry} />
      <FieldRow label="CVV" value={entry.cardCVV} secret />
      <FieldRow label="Catatan" value={entry.notes} />
    </>
  );
}

function WifiDetail({ entry }: { entry: VaultEntry }) {
  return (
    <>
      <FieldRow label="SSID / Nama Jaringan" value={entry.wifiSSID} />
      <FieldRow label="Password Wi-Fi" value={entry.wifiPassword} secret />
      <FieldRow label="Catatan" value={entry.notes} />
    </>
  );
}

function CatatanDetail({ entry }: { entry: VaultEntry }) {
  return <FieldRow label="Isi Catatan" value={entry.notes} />;
}

function LainnyaDetail({ entry }: { entry: VaultEntry }) {
  return (
    <>
      <FieldRow label="Username / ID" value={entry.username} />
      <FieldRow label="Email" value={entry.email} />
      <FieldRow label="Password / PIN / Kode" value={entry.password} secret />
      <FieldRow label="URL" value={entry.url} isLink />
      <FieldRow label="Catatan" value={entry.notes} />
    </>
  );
}

// ─── Delete confirm (inline) ──────────────────────────────────────────────────

function DeleteBar({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      margin: 'var(--space-4) 0',
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      animation: 'fadeScaleIn 150ms ease both',
    }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
        Yakin hapus <strong>{title}</strong>? Tidak dapat dibatalkan.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Batal</button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: '#EF4444',
            color: '#fff',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Ya, Hapus
        </button>
      </div>
    </div>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────

export function DetailView() {
  const { selectedId, getEntry, startEditing, deleteEntry, toggleFavorite, setSelectedId } = useVaultStore();
  const [showDelete, setShowDelete] = useState(false);
  const isMobile = useIsMobile();

  const entry = selectedId ? getEntry(selectedId) : null;

  const handleDelete = useCallback(async () => {
    if (!entry) return;
    await deleteEntry(entry.id);
    setShowDelete(false);
  }, [entry, deleteEntry]);

  const handleFavorite = useCallback(() => {
    if (entry) toggleFavorite(entry.id);
  }, [entry, toggleFavorite]);

  // Desktop: placeholder saat tidak ada entri dipilih
  if (!entry) {
    if (isMobile) return null; // mobile: tidak tampil sama sekali
    return (
      <div style={{
        borderLeft: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 'var(--space-2)',
      }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>🔐</span>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Pilih entri untuk melihat detail</p>
      </div>
    );
  }

  // Mobile: bungkus dengan fullscreen overlay
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 800,
        background: 'var(--bg-root)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight var(--transition-normal) var(--transition-spring) both',
      }}>
        {/* Mobile back bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '0 var(--space-4)',
          height: 'var(--appbar-height)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setSelectedId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gold)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-outfit)', fontWeight: 600, padding: '4px 0',
            }}
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
        <DetailContent
          entry={entry}
          showDelete={showDelete}
          setShowDelete={setShowDelete}
          onDelete={handleDelete}
          onFavorite={handleFavorite}
          onEdit={() => startEditing(entry.id)}
        />
      </div>
    );
  }

  // Desktop: panel kanan
  return (
    <div style={{
      borderLeft: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeScaleIn var(--transition-normal) ease both',
    }}>
      <DetailContent
        entry={entry}
        showDelete={showDelete}
        setShowDelete={setShowDelete}
        onDelete={handleDelete}
        onFavorite={handleFavorite}
        onEdit={() => startEditing(entry.id)}
      />
    </div>
  );
}

// ─── DetailContent — shared between desktop panel & mobile overlay ─────────────

interface DetailContentProps {
  entry: VaultEntry;
  showDelete: boolean;
  setShowDelete: (v: boolean) => void;
  onDelete: () => void;
  onFavorite: () => void;
  onEdit: () => void;
}

function DetailContent({ entry, showDelete, setShowDelete, onDelete, onFavorite, onEdit }: DetailContentProps) {
  const config = CATEGORY_CONFIG[entry.category];
  const updatedAt = new Date(entry.updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const createdAt = new Date(entry.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <>
      {/* Header */}
      <div style={{
        padding: 'var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
          <CategoryIcon category={entry.category} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: 'var(--text-md)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}>
              {entry.title}
            </h2>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: config.color,
              marginTop: 3,
              fontWeight: 500,
            }}>
              {config.label}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            onClick={onEdit}
            style={actionBtnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-card)')}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={onFavorite}
            style={{
              ...actionBtnStyle,
              color: entry.isFavorite ? 'var(--gold)' : 'var(--text-secondary)',
              borderColor: entry.isFavorite ? 'var(--gold-border)' : 'var(--border-default)',
              background: entry.isFavorite ? 'var(--gold-soft)' : 'var(--bg-card)',
            }}
            onMouseEnter={(e) => { if (!entry.isFavorite) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { if (!entry.isFavorite) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
          >
            <Star size={13} fill={entry.isFavorite ? 'currentColor' : 'none'} />
            {entry.isFavorite ? 'Favorit' : 'Favorit'}
          </button>
          <button
            onClick={() => setShowDelete(!showDelete)}
            style={{
              ...actionBtnStyle,
              color: '#EF4444',
              borderColor: showDelete ? 'rgba(239,68,68,0.4)' : 'var(--border-default)',
              background: showDelete ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
            }}
            onMouseEnter={(e) => { if (!showDelete) (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
            onMouseLeave={(e) => { if (!showDelete) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
          >
            <Trash2 size={13} />
            Hapus
          </button>
        </div>

        {showDelete && (
          <DeleteBar
            title={entry.title}
            onConfirm={onDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-5)' }}>
        {entry.category === 'password' && <PasswordDetail entry={entry} />}
        {entry.category === 'email' && <EmailDetail entry={entry} />}
        {entry.category === 'kartu' && <KartuDetail entry={entry} />}
        {entry.category === 'wifi' && <WifiDetail entry={entry} />}
        {entry.category === 'catatan' && <CatatanDetail entry={entry} />}
        {entry.category === 'lainnya' && <LainnyaDetail entry={entry} />}

        {/* Metadata */}
        <div style={{
          padding: 'var(--space-4) 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Diperbarui: {updatedAt}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Dibuat: {createdAt}</p>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-jetbrains)',
            marginTop: 2,
            opacity: 0.5,
          }}>
            ID: {entry.id}
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  transition: 'color var(--transition-fast)',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-outfit)',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-xs)',
  fontFamily: 'var(--font-outfit)',
  fontWeight: 500,
  cursor: 'pointer',
};
