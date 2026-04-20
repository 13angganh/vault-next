'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Eye, EyeOff, ChevronDown } from 'lucide-react';
import {
  useVaultStore,
  type VaultEntry,
  type EntryCategory,
} from '@/lib/store/vaultStore';
import { CategoryIcon, CATEGORY_CONFIG } from './CategoryIcon';
import { PasswordGenerator } from './PasswordGenerator';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>;

const EMPTY_FORM: FormData = {
  category: 'password',
  title: '',
  username: '',
  email: '',
  password: '',
  url: '',
  notes: '',
  cardNumber: '',
  cardHolder: '',
  cardExpiry: '',
  cardCVV: '',
  wifiSSID: '',
  wifiPassword: '',
  isFavorite: false,
};

// ─── Field helpers ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'url' | 'email';
  mono?: boolean;
  required?: boolean;
  maxLength?: number;
}

function Field({ label, value, onChange, placeholder, type = 'text', mono, required, maxLength }: FieldProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={{
            ...inputStyle,
            fontFamily: mono ? 'var(--font-jetbrains)' : 'var(--font-outfit)',
            paddingRight: isPassword ? 36 : undefined,
            letterSpacing: isPassword && !show ? '0.15em' : undefined,
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 4,
            }}
          >
            {show ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: Omit<FieldProps, 'type' | 'mono' | 'maxLength'>) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <label style={labelStyle}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          ...inputStyle,
          resize: 'vertical',
          minHeight: 72,
          lineHeight: 'var(--lh-normal)',
        }}
      />
    </div>
  );
}

// ─── Category selector ────────────────────────────────────────────────────────

const CATEGORIES: EntryCategory[] = ['password', 'email', 'kartu', 'wifi', 'catatan', 'lainnya'];

function CategorySelect({
  value,
  onChange,
  disabled,
}: {
  value: EntryCategory;
  onChange: (c: EntryCategory) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = CATEGORY_CONFIG[value];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ marginBottom: 'var(--space-3)', position: 'relative' }} ref={ref}>
      <label style={labelStyle}>Kategori</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          ...inputStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
        }}
      >
        <CategoryIcon category={value} size="sm" />
        <span style={{ flex: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}>
          {config.label}
        </span>
        {!disabled && <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 4,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-modal)',
          zIndex: 500,
          overflow: 'hidden',
          animation: 'fadeScaleIn 150ms ease both',
        }}>
          {CATEGORIES.map((cat) => {
            const c = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange(cat); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '8px 12px',
                  width: '100%',
                  background: cat === value ? 'var(--bg-active)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-outfit)',
                  transition: 'background var(--transition-fast)',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (cat !== value) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (cat !== value) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <CategoryIcon category={cat} size="sm" />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Fields per category ──────────────────────────────────────────────────────

function PasswordFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Username" value={data.username ?? ''} onChange={(v) => update('username', v)} placeholder="nama_pengguna" />
      <div>
        <Field label="Password" value={data.password ?? ''} onChange={(v) => update('password', v)} type="password" mono required placeholder="••••••••" />
        <PasswordGenerator onUse={(pw) => update('password', pw)} />
      </div>
      <Field label="URL / Website" value={data.url ?? ''} onChange={(v) => update('url', v)} type="url" placeholder="https://example.com" />
      <TextareaField label="Catatan" value={data.notes ?? ''} onChange={(v) => update('notes', v)} placeholder="Catatan tambahan..." />
    </>
  );
}

function EmailFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Alamat Email" value={data.email ?? ''} onChange={(v) => update('email', v)} type="email" required placeholder="nama@email.com" />
      <Field label="Username" value={data.username ?? ''} onChange={(v) => update('username', v)} placeholder="nama_pengguna" />
      <div>
        <Field label="Password" value={data.password ?? ''} onChange={(v) => update('password', v)} type="password" mono placeholder="••••••••" />
        <PasswordGenerator onUse={(pw) => update('password', pw)} />
      </div>
      <Field label="URL Provider" value={data.url ?? ''} onChange={(v) => update('url', v)} type="url" placeholder="https://mail.google.com" />
      <TextareaField label="Catatan" value={data.notes ?? ''} onChange={(v) => update('notes', v)} placeholder="Catatan tambahan..." />
    </>
  );
}

function KartuFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Nomor Kartu" value={data.cardNumber ?? ''} onChange={(v) => update('cardNumber', v)} mono required placeholder="1234 5678 9012 3456" maxLength={19} />
      <Field label="Nama Pemegang Kartu" value={data.cardHolder ?? ''} onChange={(v) => update('cardHolder', v)} placeholder="NAMA LENGKAP" required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Field label="Kadaluarsa" value={data.cardExpiry ?? ''} onChange={(v) => update('cardExpiry', v)} placeholder="MM/YY" maxLength={5} />
        <Field label="CVV" value={data.cardCVV ?? ''} onChange={(v) => update('cardCVV', v)} type="password" mono placeholder="•••" maxLength={4} />
      </div>
      <TextareaField label="Catatan" value={data.notes ?? ''} onChange={(v) => update('notes', v)} placeholder="Bank, limit, dll..." />
    </>
  );
}

function WifiFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Nama Jaringan (SSID)" value={data.wifiSSID ?? ''} onChange={(v) => update('wifiSSID', v)} required placeholder="NamaWiFi" />
      <div>
        <Field label="Password Wi-Fi" value={data.wifiPassword ?? ''} onChange={(v) => update('wifiPassword', v)} type="password" mono placeholder="••••••••" />
        <PasswordGenerator onUse={(pw) => update('wifiPassword', pw)} />
      </div>
      <TextareaField label="Catatan" value={data.notes ?? ''} onChange={(v) => update('notes', v)} placeholder="Router, provider, dll..." />
    </>
  );
}

function CatatanFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <label style={labelStyle}>Isi Catatan <span style={{ color: '#EF4444' }}>*</span></label>
      <textarea
        value={data.notes ?? ''}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Tulis catatan di sini..."
        rows={8}
        style={{ ...inputStyle, resize: 'vertical', minHeight: 160, lineHeight: 'var(--lh-normal)' }}
      />
    </div>
  );
}

function LainnyaFields({ data, update }: { data: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <Field label="Username / ID" value={data.username ?? ''} onChange={(v) => update('username', v)} placeholder="ID atau username" />
      <Field label="Email" value={data.email ?? ''} onChange={(v) => update('email', v)} type="email" placeholder="nama@email.com" />
      <div>
        <Field label="Password / PIN / Kode" value={data.password ?? ''} onChange={(v) => update('password', v)} type="password" mono placeholder="••••••••" />
        <PasswordGenerator onUse={(pw) => update('password', pw)} />
      </div>
      <Field label="URL" value={data.url ?? ''} onChange={(v) => update('url', v)} type="url" placeholder="https://..." />
      <TextareaField label="Catatan" value={data.notes ?? ''} onChange={(v) => update('notes', v)} placeholder="Catatan tambahan..." />
    </>
  );
}

// ─── EntryForm ────────────────────────────────────────────────────────────────

export function EntryForm() {
  const {
    isCreating,
    editingId,
    pendingCategory,
    stopCreating,
    stopEditing,
    addEntry,
    updateEntry,
    getEntry,
  } = useVaultStore();

  const isEditing = !!editingId;
  const existingEntry = editingId ? getEntry(editingId) : null;

  // Initialise form
  const [data, setData] = useState<FormData>(() => {
    if (existingEntry) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...rest } = existingEntry;
      return rest;
    }
    return {
      ...EMPTY_FORM,
      category: pendingCategory ?? 'password',
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Keyboard shortcut: Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isCreating) stopCreating();
        if (isEditing) stopEditing();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCreating, isEditing, stopCreating, stopEditing]);

  const update = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  }, [error]);

  const updateStr = useCallback((key: keyof FormData, value: string) => {
    update(key, value as FormData[typeof key]);
  }, [update]);

  const handleCancel = () => {
    if (isCreating) stopCreating();
    if (isEditing) stopEditing();
  };

  const validate = (): boolean => {
    if (!data.title.trim()) { setError('Judul wajib diisi'); return false; }
    if (data.category === 'catatan' && !data.notes?.trim()) { setError('Isi catatan wajib diisi'); return false; }
    if (data.category === 'kartu' && !data.cardNumber?.trim()) { setError('Nomor kartu wajib diisi'); return false; }
    if (data.category === 'wifi' && !data.wifiSSID?.trim()) { setError('Nama jaringan (SSID) wajib diisi'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await updateEntry(editingId, data);
      } else {
        await addEntry(data);
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldProps = { data, update: updateStr };
  const isMobile = useIsMobile();

  // ── Mobile: fullscreen overlay tanpa backdrop ─────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        background: 'var(--bg-root)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight var(--transition-normal) var(--transition-spring) both',
      }}>
        <FormContent
          data={data}
          isEditing={isEditing}
          saving={saving}
          error={error}
          fieldProps={fieldProps}
          update={update}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    );
  }

  // ── Desktop: slide-in panel dari kanan ────────────────────────────────────
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      zIndex: 900,
      animation: 'fadeIn 200ms ease both',
    }}>
      <div style={{
        width: 400,
        height: '100%',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight 220ms var(--transition-spring) both',
        boxShadow: 'var(--shadow-modal)',
      }}>
        <FormContent
          data={data}
          isEditing={isEditing}
          saving={saving}
          error={error}
          fieldProps={fieldProps}
          update={update}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

// ─── FormContent — shared antara mobile & desktop ─────────────────────────────

interface FormContentProps {
  data: FormData;
  isEditing: boolean;
  saving: boolean;
  error: string;
  fieldProps: { data: FormData; update: (key: keyof FormData, value: string) => void };
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  onCancel: () => void;
  onSave: () => void;
}

function FormContent({ data, isEditing, saving, error, fieldProps, update, onCancel, onSave }: FormContentProps) {
  return (
    <>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <CategoryIcon category={data.category} size="md" />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEditing ? 'Edit Entri' : 'Tambah Entri'}
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 1 }}>
            {isEditing ? 'Perbarui informasi entri' : 'Isi detail entri baru'}
          </p>
        </div>
        <button onClick={onCancel} style={closeButtonStyle}>
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
        <Field label="Judul" value={data.title} onChange={(v) => fieldProps.update('title', v)} required placeholder="Nama entri..." />
        <CategorySelect value={data.category} onChange={(v) => update('category', v as FormData['category'])} disabled={isEditing} />

        {data.category === 'password' && <PasswordFields {...fieldProps} />}
        {data.category === 'email' && <EmailFields {...fieldProps} />}
        {data.category === 'kartu' && <KartuFields {...fieldProps} />}
        {data.category === 'wifi' && <WifiFields {...fieldProps} />}
        {data.category === 'catatan' && <CatatanFields {...fieldProps} />}
        {data.category === 'lainnya' && <LainnyaFields {...fieldProps} />}

        {/* Favorit toggle */}
        <button
          onClick={() => update('isFavorite', !data.isFavorite as unknown as FormData['isFavorite'])}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginTop: 'var(--space-2)',
            padding: '6px 0',
            background: 'none', border: 'none', cursor: 'pointer',
            color: data.isFavorite ? 'var(--gold)' : 'var(--text-muted)',
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-outfit)',
            transition: 'color var(--transition-fast)',
          }}
        >
          <span style={{ fontSize: 14 }}>{data.isFavorite ? '★' : '☆'}</span>
          {data.isFavorite ? 'Ditandai Favorit' : 'Tandai sebagai Favorit'}
        </button>

        {error && (
          <p style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--text-xs)',
            color: '#EF4444',
            animation: 'shake 300ms ease both',
          }}>
            ⚠ {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        <button onClick={onCancel} style={cancelBtnStyle} disabled={saving}>
          Batal
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: saving ? 'var(--bg-overlay)' : 'var(--gold)',
            color: saving ? 'var(--text-muted)' : 'var(--bg-root)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          {saving ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan'}
        </button>
      </div>
    </>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 4,
  letterSpacing: '0.02em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-outfit)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-fast)',
};

const closeButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-outfit)',
  fontWeight: 500,
  cursor: 'pointer',
};
