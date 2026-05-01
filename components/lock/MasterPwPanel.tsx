'use client';

/**
 * Vault Next — MasterPwPanel
 * Sesi B: refactor pakai Button primitive.
 */

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, LogIn, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

interface MasterPwPanelProps {
  hint?: string;
  loading?: boolean;
  error?: string;
  onSubmit: (pw: string) => void;
  onShowRecovery: () => void;
  onShowBiometric?: () => void;
}

export function MasterPwPanel({ hint, loading, error, onSubmit, onShowRecovery, onShowBiometric }: MasterPwPanelProps) {
  const [pw, setPw]     = useState('');
  const [show, setShow] = useState(false);
  const inputRef        = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (error) { setPw(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [error]);

  const handleSubmit = () => { if (!pw.trim() || loading) return; onSubmit(pw); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      {hint && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '10px 14px', background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
          borderRadius: 'var(--radius-md)', animation: 'fadeIn 0.3s ease',
        }}>
          <HelpCircle size={14} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gold-text)', lineHeight: 1.5 }}>
            <strong>Petunjuk:</strong> {hint}
          </span>
        </div>
      )}

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
            width: '100%', padding: '14px 48px 14px 16px',
            background: 'var(--bg-s1)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', color: 'var(--text)',
            fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)',
            outline: 'none', transition: 'border-color var(--transition-fast)',
            boxSizing: 'border-box', animation: error ? 'shake 0.3s ease' : 'none',
          }}
        />
        <button type="button" onClick={() => setShow((s) => !s)} style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted2)', padding: 4, display: 'flex',
        }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
          {error}
        </div>
      )}

      <Button variant="gold" full loading={loading} disabled={!pw.trim() || !!loading}
        onClick={handleSubmit} leftIcon={!loading ? <LogIn size={16} /> : undefined}>
        {loading ? 'Membuka…' : 'Buka Vault'}
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
        <button onClick={onShowRecovery} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-xs)', color: 'var(--muted2)', padding: 0, transition: 'color var(--transition-fast)',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted2)')}>
          Lupa password?
        </button>
        {onShowBiometric && (
          <button onClick={onShowBiometric} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-xs)', color: 'var(--muted2)', padding: 0, transition: 'color var(--transition-fast)',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted2)')}>
            Biometrik?
          </button>
        )}
      </div>
    </div>
  );
}
