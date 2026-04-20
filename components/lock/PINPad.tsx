'use client';

import { useState, useEffect, useCallback } from 'react';
import { Delete, Fingerprint } from 'lucide-react';

interface PINPadProps {
  onComplete: (pin: string) => void;
  onBiometric?: () => void;
  isLoading?: boolean;
  error?: string | null;
  label?: string;
  pinLength?: number;
  disabled?: boolean;
}

export function PINPad({
  onComplete,
  onBiometric,
  isLoading = false,
  error = null,
  label = 'Masukkan PIN',
  pinLength = 6,
  disabled = false,
}: PINPadProps) {
  const [pin, setPin] = useState('');
  const [dotShake, setDotShake] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Shake dots saat error
  useEffect(() => {
    if (error) {
      setDotShake(true);
      setPin('');
      const t = setTimeout(() => setDotShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Auto-submit saat PIN penuh
  useEffect(() => {
    if (pin.length === pinLength) {
      const t = setTimeout(() => {
        onComplete(pin);
        setPin('');
      }, 120);
      return () => clearTimeout(t);
    }
  }, [pin, pinLength, onComplete]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (disabled || isLoading) return;
      if (e.key >= '0' && e.key <= '9') handlePress(e.key);
      if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [disabled, isLoading, pin]);

  const handlePress = useCallback((digit: string) => {
    if (disabled || isLoading || pin.length >= pinLength) return;
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 150);
    setPin((p) => p + digit);
  }, [disabled, isLoading, pin.length, pinLength]);

  const handleDelete = useCallback(() => {
    if (disabled || isLoading) return;
    setPin((p) => p.slice(0, -1));
  }, [disabled, isLoading]);

  const KEYS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-8)' }}>
      {/* Label */}
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-outfit)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 'var(--fw-medium)',
      }}>
        {label}
      </p>

      {/* PIN Dots */}
      <div
        className={dotShake ? 'animate-shake' : ''}
        style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}
      >
        {Array.from({ length: pinLength }).map((_, i) => {
          const filled = i < pin.length;
          return (
            <div
              key={i}
              style={{
                width: filled ? '14px' : '12px',
                height: filled ? '14px' : '12px',
                borderRadius: '50%',
                background: filled ? 'var(--gold)' : 'transparent',
                border: filled ? '2px solid var(--gold)' : '2px solid var(--border-default)',
                boxShadow: filled ? 'var(--gold-glow)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            />
          );
        })}
      </div>

      {/* Error Message */}
      <div style={{ minHeight: '20px' }}>
        {error && (
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--status-danger)',
            textAlign: 'center',
            fontFamily: 'var(--font-outfit)',
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {KEYS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <button
                    key="bio"
                    onClick={onBiometric}
                    disabled={disabled || isLoading}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-xl)',
                      background: 'transparent',
                      border: 'none',
                      color: onBiometric ? 'var(--text-muted)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: onBiometric ? 'pointer' : 'default',
                      transition: 'all var(--transition-fast)',
                    }}
                    aria-label="Biometrik"
                  >
                    {onBiometric && <Fingerprint size={24} strokeWidth={1.5} />}
                  </button>
                );
              }

              if (key === 'del') {
                return (
                  <button
                    key="del"
                    onClick={handleDelete}
                    disabled={disabled || isLoading || pin.length === 0}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-xl)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: pin.length > 0 ? 'pointer' : 'default',
                      transition: 'all var(--transition-fast)',
                      opacity: pin.length === 0 ? 0.3 : 1,
                    }}
                    aria-label="Hapus"
                  >
                    <Delete size={22} strokeWidth={1.5} />
                  </button>
                );
              }

              // Digit
              const isPressed = pressedKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePress(key)}
                  disabled={disabled || isLoading}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-xl)',
                    background: isPressed ? 'var(--bg-active)' : 'var(--bg-card)',
                    border: `1px solid ${isPressed ? 'var(--gold-border)' : 'var(--border-subtle)'}`,
                    color: 'var(--text-primary)',
                    fontSize: '22px',
                    fontWeight: 'var(--fw-medium)',
                    fontFamily: 'var(--font-outfit)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isPressed ? 'var(--gold-glow)' : 'var(--shadow-card)',
                    transform: isPressed ? 'scale(0.93)' : 'scale(1)',
                    opacity: isLoading ? 0.5 : 1,
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
