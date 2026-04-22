'use client';

import { useState } from 'react';
import { ArrowLeft, ShieldCheck, TriangleAlert } from 'lucide-react';

interface RecoveryPanelProps {
  loading?: boolean;
  error?: string;
  onSubmit: (phrase: string) => void;
  onBack: () => void;
}

export function RecoveryPanel({ loading, error, onSubmit, onBack }: RecoveryPanelProps) {
  const [phrase, setPhrase] = useState('');

  const handleSubmit = () => {
    if (!phrase.trim() || loading) return;
    onSubmit(phrase.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>

      {/* Warning banner */}
      <div style={{
        padding: '12px 14px',
        background: 'rgba(255,77,109,0.06)',
        border: '1px solid rgba(255,77,109,0.2)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <TriangleAlert size={14} style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text2)', lineHeight: 1.6 }}>
          Recovery phrase hanya digunakan untuk <strong style={{ color: 'var(--text)' }}>memulihkan master password</strong>.
          Pastikan kamu berada di tempat aman.
        </span>
      </div>

      {/* Textarea */}
      <div>
        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', display: 'block', marginBottom: 6 }}>
          Recovery phrase / seed phrase
        </label>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="Ketikkan recovery phrase kamu…"
          rows={4}
          autoComplete="off"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'var(--bg-s1)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            resize: 'none',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
            boxSizing: 'border-box',
            lineHeight: 1.6,
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = 'var(--gold-border)';
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = 'var(--border)';
          }}
        />
        {error && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: 6 }}>
            {error}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!phrase.trim() || loading}
        className="btn btn-gold"
        style={{
          width: '100%', justifyContent: 'center', gap: 8,
          opacity: !phrase.trim() || loading ? 0.5 : 1,
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
            Memulihkan…
          </span>
        ) : (
          <>
            <ShieldCheck size={16} />
            Pulihkan Akses
          </>
        )}
      </button>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-xs)', color: 'var(--muted2)',
          display: 'flex', alignItems: 'center', gap: 6,
          margin: '0 auto', padding: 0,
          transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted2)')}
      >
        <ArrowLeft size={13} />
        Kembali ke login
      </button>
    </div>
  );
}
