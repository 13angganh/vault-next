'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

interface MasterPwPanelProps {
  onSubmit: (password: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function MasterPwPanel({ onSubmit, onBack, isLoading = false, error = null }: MasterPwPanelProps) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async () => {
    if (!password || isLoading) return;
    await onSubmit(password);
    setPassword('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      width: '100%',
      maxWidth: '320px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 'var(--space-1)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <KeyRound size={16} color="var(--gold)" />
          <span style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-outfit)',
          }}>
            Kata Sandi Utama
          </span>
        </div>
      </div>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Masukkan kata sandi utama"
          autoFocus
          disabled={isLoading}
          style={{
            width: '100%',
            padding: 'var(--space-4) var(--space-12) var(--space-4) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${error ? 'var(--status-danger)' : 'var(--border-default)'}`,
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-jetbrains)',
            outline: 'none',
            boxSizing: 'border-box',
            letterSpacing: show ? 'normal' : '0.15em',
            transition: 'border-color var(--transition-fast)',
          }}
        />
        <button
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute',
            right: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 'var(--space-1)',
            display: 'flex',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--status-danger)',
          fontFamily: 'var(--font-outfit)',
          marginTop: 'calc(var(--space-2) * -1)',
        }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!password || isLoading}
        style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          background: password && !isLoading ? 'var(--gold)' : 'var(--bg-hover)',
          border: 'none',
          color: password && !isLoading ? 'var(--text-inverse)' : 'var(--text-muted)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--fw-button)',
          fontFamily: 'var(--font-outfit)',
          cursor: password && !isLoading ? 'pointer' : 'not-allowed',
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
            Memverifikasi...
          </>
        ) : (
          'Buka Vault'
        )}
      </button>
    </div>
  );
}
