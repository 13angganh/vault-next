'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';

interface RecoveryPanelProps {
  onSubmit: (phrase: string, newPIN: string, newMasterPW: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function RecoveryPanel({ onSubmit, onBack, isLoading = false, error = null }: RecoveryPanelProps) {
  const [phrase, setPhrase] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [newMasterPW, setNewMasterPW] = useState('');
  const [showPW, setShowPW] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const isValidPhrase = phrase.trim().split(/\s+/).length === 12;
  const isValidPIN = newPIN.length === 6 && /^\d+$/.test(newPIN);
  const isValidPW = newMasterPW.length >= 8;
  const canSubmit = isValidPhrase && isValidPIN && isValidPW && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(phrase.trim().toLowerCase(), newPIN, newMasterPW);
  };

  const inputStyle = (hasError?: boolean) => ({
    width: '100%',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${hasError ? 'var(--status-danger)' : 'var(--border-default)'}`,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-jetbrains)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color var(--transition-fast)',
    resize: 'none' as const,
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      width: '100%',
      maxWidth: '320px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 'var(--space-1)', display: 'flex',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ShieldAlert size={16} color="var(--status-warning)" />
          <span style={{
            fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
            fontFamily: 'var(--font-outfit)',
          }}>
            Pemulihan Akun
          </span>
        </div>
      </div>

      {/* Warning */}
      <div style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-outfit)',
        lineHeight: 1.6,
      }}>
        Masukkan 12 kata seed phrase secara berurutan, dipisah spasi. Data vault tetap aman.
      </div>

      {/* Seed Phrase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
          Seed Phrase (12 kata)
        </label>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="kata1 kata2 kata3 ... kata12"
          rows={3}
          disabled={isLoading}
          style={inputStyle()}
        />
        {phrase && !isValidPhrase && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--status-danger)', fontFamily: 'var(--font-outfit)' }}>
            Harus tepat 12 kata
          </p>
        )}
      </div>

      {/* New PIN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
          PIN Baru (6 digit)
        </label>
        <input
          type="password"
          value={newPIN}
          onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          disabled={isLoading}
          maxLength={6}
          inputMode="numeric"
          style={{ ...inputStyle(), letterSpacing: '0.2em' }}
        />
      </div>

      {/* New Master PW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
          Kata Sandi Utama Baru (min. 8 karakter)
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPW ? 'text' : 'password'}
            value={newMasterPW}
            onChange={(e) => setNewMasterPW(e.target.value)}
            placeholder="Kata sandi baru"
            disabled={isLoading}
            style={{ ...inputStyle(), paddingRight: 'var(--space-10)' }}
          />
          <button
            onClick={() => setShowPW((s) => !s)}
            style={{
              position: 'absolute', right: 'var(--space-3)', top: '50%',
              transform: 'translateY(-50%)', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
            }}
          >
            {showPW ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--status-danger)',
          fontFamily: 'var(--font-outfit)',
        }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: canSubmit ? 'var(--gold)' : 'var(--bg-hover)',
          border: 'none',
          color: canSubmit ? 'var(--text-inverse)' : 'var(--text-muted)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--fw-button)',
          fontFamily: 'var(--font-outfit)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          transition: 'all var(--transition-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Memulihkan...
          </>
        ) : (
          'Pulihkan Akun'
        )}
      </button>
    </div>
  );
}
