'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, LogIn, HelpCircle } from 'lucide-react';

interface MasterPwPanelProps {
  hint?: string;
  loading?: boolean;
  error?: string;
  onSubmit: (pw: string) => void;
  onShowRecovery: () => void;
  onShowBiometric?: () => void;
}

export function MasterPwPanel({
  hint,
  loading,
  error,
  onSubmit,
  onShowRecovery,
  onShowBiometric,
}: MasterPwPanelProps) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Delay sedikit untuk menunggu animasi panel muncul
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // Clear field saat ada error baru
  useEffect(() => {
    if (error) {
      setPw('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [error]);

  const handleSubmit = () => {
    if (!pw.trim() || loading) return;
    onSubmit(pw);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>

      {/* Hint */}
      {hint && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-md)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <HelpCircle size={14} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gold-text)', lineHeight: 1.5 }}>
            <strong>Petunjuk:</strong> {hint}
          </span>
        </div>
      )}

      {/* Password input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type={show ? 'text' : 'password'}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Master password…"
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '14px 48px 14px 16px',
            background: 'var(--bg-s1)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            boxSizing: 'border-box',
            animation: error ? 'shake 0.3s ease' : 'none',
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = 'var(--gold-border)';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = 'var(--border)';
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted2)', padding: 4, display: 'flex',
            transition: 'color var(--transition-fast)',
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--danger)',
          textAlign: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!pw.trim() || loading}
        className="btn btn-gold"
        style={{
          width: '100%',
          justifyContent: 'center',
          gap: 8,
          opacity: !pw.trim() || loading ? 0.5 : 1,
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 14, height: 14,
              border: '2px solid var(--gold)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              display: 'inline-block',
            }} />
            Membuka…
          </span>
        ) : (
          <>
            <LogIn size={16} />
            Buka Vault
          </>
        )}
      </button>

      {/* Footer links */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 'var(--space-2)',
      }}>
        <button
          onClick={onShowRecovery}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-xs)', color: 'var(--muted2)',
            padding: 0, transition: 'color var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted2)')}
        >
          Lupa password?
        </button>

        {onShowBiometric && (
          <button
            onClick={onShowBiometric}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 'var(--text-xs)', color: 'var(--muted2)',
              padding: 0, transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted2)')}
          >
            Biometrik?
          </button>
        )}
      </div>
    </div>
  );
}
