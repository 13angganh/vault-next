'use client';

/**
 * Vault Next — PINPad
 * Sesi D: micro-animations PIN dots (M-12) — bounceIn on fill, shake on error,
 * success flash gold→teal, key press smooth scale.
 */

import { useEffect, useRef } from 'react';
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
  success?:     boolean;   // Sesi D: flash hijau saat unlock berhasil
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
  success = false,
}: PINPadProps) {
  const prevLen  = useRef(0);
  const dotRefs  = useRef<(HTMLDivElement | null)[]>([]);

  /* Keyboard support */
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

  /* Auto-submit */
  useEffect(() => {
    if (value.length === maxLen && onSubmit) {
      const t = setTimeout(onSubmit, 80);
      return () => clearTimeout(t);
    }
  }, [value, maxLen, onSubmit]);

  /* Dot bounce animation saat digit ditambah */
  useEffect(() => {
    const newLen = value.length;
    if (newLen > prevLen.current && newLen > 0) {
      const dot = dotRefs.current[newLen - 1];
      if (dot) {
        dot.style.animation = 'none';
        // force reflow
        void dot.offsetHeight;
        dot.style.animation = 'pinDotBounce 0.28s var(--ease-spring) both';
      }
    }
    prevLen.current = newLen;
  }, [value]);

  const dots = Array.from({ length: maxLen }, (_, i) => i);

  /* Tentukan warna dot */
  const getDotStyle = (i: number): React.CSSProperties => {
    const filled = i < value.length;
    if (success && filled) {
      return {
        border: '2px solid var(--teal)',
        background: 'var(--teal)',
        transform: 'scale(1.15)',
      };
    }
    if (error && filled) {
      return {
        border: '2px solid var(--red)',
        background: 'var(--red)',
      };
    }
    return {
      border: `2px solid ${filled ? 'var(--gold)' : 'var(--border2)'}`,
      background: filled ? 'var(--gold)' : 'transparent',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>

      {/* Label + sublabel + error */}
      <div style={{ textAlign: 'center', minHeight: 40 }}>
        <div style={{
          fontSize: 'var(--text-sm)', fontWeight: 600,
          color: 'var(--text)', letterSpacing: '0.04em',
        }}>
          {locked ? (lockedLabel ?? 'PIN Terkunci') : label}
        </div>
        {sublabel && !error && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {sublabel}
          </div>
        )}
        {error && (
          <div style={{
            fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2,
            animation: 'shake 350ms var(--ease-default) both',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* PIN Dots — dengan animasi M-12 */}
      <div
        className={error ? 'animate-shake' : ''}
        style={{
          display: 'flex', gap: 10,
          animation: error ? 'shake 350ms var(--ease-default) both' : undefined,
        }}
      >
        {dots.map((i) => (
          <div
            key={i}
            ref={(el) => { dotRefs.current[i] = el; }}
            style={{
              width: 12, height: 12,
              borderRadius: '50%',
              transition: 'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease',
              ...getDotStyle(i),
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        width: '100%',
        maxWidth: 260,
        opacity:       locked ? 0.4 : disabled ? 0.6 : 1,
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
              className="pin-key"
              style={{
                height: 52,
                borderRadius: 'var(--radius-md)',
                border:    isEmpty ? 'none' : '1px solid var(--pin-key-border)',
                background: isEmpty ? 'transparent' : 'var(--pin-key-bg)',
                color:     isDel ? 'var(--muted2)' : 'var(--text)',
                fontSize:  isDel ? 16 : 'var(--text-lg)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 500,
                cursor:    isEmpty ? 'default' : 'pointer',
                display:   'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.1s ease, transform 0.1s ease, box-shadow 0.1s ease',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
              onPointerDown={(e) => {
                if (isEmpty) return;
                const el = e.currentTarget;
                el.style.background = 'var(--gold-soft)';
                el.style.transform  = 'scale(0.91)';
                el.style.boxShadow  = '0 0 0 2px var(--gold-glow)';
              }}
              onPointerUp={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--pin-key-bg)';
                el.style.transform  = 'scale(1)';
                el.style.boxShadow  = 'none';
              }}
              onPointerLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = 'var(--pin-key-bg)';
                el.style.transform  = 'scale(1)';
                el.style.boxShadow  = 'none';
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
