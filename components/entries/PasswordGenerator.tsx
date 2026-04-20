'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Generator logic ──────────────────────────────────────────────────────────

const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generatePassword(length: number, opts: GeneratorOptions): string {
  let pool = CHARS.lower;
  if (opts.upper) pool += CHARS.upper;
  if (opts.digits) pool += CHARS.digits;
  if (opts.symbols) pool += CHARS.symbols;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((n) => pool[n % pool.length])
    .join('');
}

interface GeneratorOptions {
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

// ─── Strength ─────────────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Sangat Lemah', color: 'var(--strength-1)' };
  if (score === 2) return { score, label: 'Lemah', color: 'var(--strength-2)' };
  if (score === 3) return { score, label: 'Sedang', color: 'var(--strength-3)' };
  if (score === 4) return { score, label: 'Kuat', color: 'var(--strength-4)' };
  return { score, label: 'Sangat Kuat', color: 'var(--strength-5)' };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PasswordGeneratorProps {
  onUse: (pw: string) => void;
}

export function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState<GeneratorOptions>({
    upper: true,
    digits: true,
    symbols: true,
  });
  const [generated, setGenerated] = useState(() => generatePassword(16, { upper: true, digits: true, symbols: true }));
  const [copied, setCopied] = useState(false);

  const strength = getStrength(generated);

  const regenerate = useCallback(() => {
    setGenerated(generatePassword(length, opts));
  }, [length, opts]);

  const handleToggleOpt = (key: keyof GeneratorOptions) => {
    setOpts((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setGenerated(generatePassword(length, next));
      return next;
    });
  };

  const handleLength = (val: number) => {
    setLength(val);
    setGenerated(generatePassword(val, opts));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleUse = () => {
    onUse(generated);
    setOpen(false);
  };

  return (
    <div style={{ marginTop: 4 }}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--gold)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-outfit)',
          cursor: 'pointer',
          fontWeight: 500,
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-soft)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <RefreshCw size={11} />
        Generator Password
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          marginTop: 8,
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-subtle)',
          animation: 'fadeScaleIn 150ms ease both',
        }}>
          {/* Generated password display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-2)',
          }}>
            <div style={{
              flex: 1,
              fontFamily: 'var(--font-jetbrains)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
            }}>
              {generated}
            </div>
            <button onClick={() => regenerate()} title="Generate ulang" style={iconBtnStyle}>
              <RefreshCw size={13} />
            </button>
            <button onClick={handleCopy} title="Salin" style={{ ...iconBtnStyle, color: copied ? 'var(--gold)' : undefined }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          {/* Strength bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <div style={{ flex: 1, height: 4, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(strength.score / 5) * 100}%`,
                background: strength.color,
                borderRadius: 4,
                transition: 'width var(--transition-normal), background var(--transition-normal)',
              }} />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: strength.color, minWidth: 72, textAlign: 'right', fontWeight: 500 }}>
              {strength.label}
            </span>
          </div>

          {/* Length slider */}
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Panjang</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)', fontFamily: 'var(--font-jetbrains)', fontWeight: 600 }}>{length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => handleLength(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)', cursor: 'pointer' }}
            />
          </div>

          {/* Options */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
            {([
              { key: 'upper', label: 'A-Z' },
              { key: 'digits', label: '0-9' },
              { key: 'symbols', label: '!@#' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleToggleOpt(key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: opts[key] ? '1px solid var(--gold-border)' : '1px solid var(--border-default)',
                  background: opts[key] ? 'var(--gold-soft)' : 'transparent',
                  color: opts[key] ? 'var(--gold-text)' : 'var(--text-muted)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-jetbrains)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Use button */}
          <button
            type="button"
            onClick={handleUse}
            style={{
              width: '100%',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'var(--gold)',
              color: 'var(--bg-root)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-outfit)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Gunakan Password Ini
          </button>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-subtle)',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'color var(--transition-fast), background var(--transition-fast)',
};
