'use client';

import { useEffect } from 'react';
import { Delete } from 'lucide-react';

interface PINPadProps {
  value:        string;
  maxLen?:      number;
  onDigit:      (d: string) => void;
  onDelete:     () => void;
  onSubmit?:    () => void;
  disabled?:    boolean;
  label?:       string;
  sublabel?:    string;
  error?:       string;
  locked?:      boolean;
  lockedLabel?: string;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function PINPad({
  value,
  maxLen = 6,
  onDigit,
  onDelete,
  onSubmit,
  disabled,
  label = 'Masukkan PIN',
  sublabel,
  error,
  locked,
  lockedLabel,
}: PINPadProps) {

  useEffect(() => {
    if (disabled || locked) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') onDigit(e.key);
      else if (e.key === 'Backspace') onDelete();
      else if (e.key === 'Enter' && value.length === maxLen) onSubmit?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, locked, value, maxLen, onDigit, onDelete, onSubmit]);

  useEffect(() => {
    if (value.length === maxLen && onSubmit) {
      const t = setTimeout(onSubmit, 80);
      return () => clearTimeout(t);
    }
  }, [value, maxLen, onSubmit]);

  const dots = Array.from({ length: maxLen }, (_, i) => i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>

      {/* Label + error */}
      <div style={{ textAlign: 'center', minHeight: 36 }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.04em' }}>
          {locked ? (lockedLabel ?? 'PIN Terkunci') : label}
        </div>
        {sublabel && !error && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>{sublabel}</div>
        )}
        {error && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2, animation: 'shake 0.3s ease' }}>
            {error}
          </div>
        )}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 10 }}>
        {dots.map((i) => {
          const filled = i < value.length;
          return (
            <div key={i} style={{
              width: 12, height: 12,
              borderRadius: '50%',
              border: `2px solid ${filled ? 'var(--gold)' : 'var(--border2)'}`,
              background: filled ? 'var(--gold)' : 'transparent',
              transition: 'all 0.15s ease',
              transform: filled ? 'scale(1.2)' : 'scale(1)',
            }} />
          );
        })}
      </div>

      {/* Keypad — kompak, 52px per tombol */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: '100%',
        maxWidth: 260,
        opacity: locked ? 0.4 : disabled ? 0.6 : 1,
        pointerEvents: locked || disabled ? 'none' : 'auto',
      }}>
        {KEYS.map((k, idx) => {
          const isEmpty = k === '';
          const isDel   = k === '⌫';
          return (
            <button
              key={idx}
              onClick={() => {
                if (isEmpty) return;
                if (isDel) onDelete();
                else if (value.length < maxLen) onDigit(k);
              }}
              disabled={isEmpty}
              style={{
                height: 52,
                borderRadius: 'var(--radius-md)',
                border: isEmpty ? 'none' : '1px solid var(--pin-key-border)',
                background: isEmpty ? 'transparent' : 'var(--pin-key-bg)',
                color: isDel ? 'var(--muted2)' : 'var(--text)',
                fontSize: isDel ? 16 : 'var(--text-lg)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor: isEmpty ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
              onMouseDown={(e) => {
                if (isEmpty) return;
                const el = e.currentTarget;
                el.style.background = 'var(--gold-soft)';
                el.style.transform = 'scale(0.93)';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--pin-key-bg)';
                el.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--pin-key-bg)';
                el.style.transform = 'scale(1)';
              }}
              onTouchStart={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--gold-soft)';
                el.style.transform = 'scale(0.93)';
              }}
              onTouchEnd={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--pin-key-bg)';
                el.style.transform = 'scale(1)';
              }}
            >
              {isDel ? <Delete size={18} /> : k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
