'use client';

/**
 * Vault Next — PasswordGenerator
 * Generator password built-in dengan:
 *   - Slider panjang 8–64
 *   - Toggle: huruf besar, angka, simbol
 *   - Preview real-time
 *   - Strength meter
 *   - Tombol copy + regenerate
 */

import { useState, useCallback, useEffect } from 'react';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

const CHARS = {
  lower:  'abcdefghijklmnopqrstuvwxyz',
  upper:  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generatePassword(length: number, useUpper: boolean, useDigits: boolean, useSymbols: boolean): string {
  let pool = CHARS.lower;
  const required: string[] = [];

  if (useUpper)   { pool += CHARS.upper;   required.push(CHARS.upper[Math.floor(Math.random() * CHARS.upper.length)]); }
  if (useDigits)  { pool += CHARS.digits;  required.push(CHARS.digits[Math.floor(Math.random() * CHARS.digits.length)]); }
  if (useSymbols) { pool += CHARS.symbols; required.push(CHARS.symbols[Math.floor(Math.random() * CHARS.symbols.length)]); }

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  const result = Array.from(arr, (n) => pool[n % pool.length]);

  // Inject required chars at random positions
  required.forEach((ch, i) => {
    result[i] = ch;
  });

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;   // callback saat "Pakai"
  onClose?: () => void;
}

export function PasswordGenerator({ onUse, onClose }: PasswordGeneratorProps) {
  const [length,     setLength]     = useState(16);
  const [useUpper,   setUseUpper]   = useState(true);
  const [useDigits,  setUseDigits]  = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password,   setPassword]   = useState('');
  const [copied,     setCopied]     = useState(false);

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, useUpper, useDigits, useSymbols));
    setCopied(false);
  }, [length, useUpper, useDigits, useSymbols]);

  // Generate on mount and option change
  useEffect(() => { regenerate(); }, [regenerate]);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUse = () => {
    if (onUse) onUse(password);
    if (onClose) onClose();
  };

  return (
    <div className="pw-gen">
      <div className="pw-gen__header">
        <h3 className="pw-gen__title">Generator Password</h3>
        {onClose && (
          <button className="pw-gen__close btn-icon" onClick={onClose} aria-label="Tutup">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Preview password */}
      <div className="pw-gen__preview">
        <code className="pw-gen__pw mono">{password}</code>
        <button
          className={`pw-gen__copy btn-icon ${copied ? 'pw-gen__copy--copied' : ''}`}
          onClick={handleCopy}
          aria-label="Salin password"
          title="Salin"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          className="pw-gen__regen btn-icon"
          onClick={regenerate}
          aria-label="Buat ulang"
          title="Buat ulang"
        >
          ↻
        </button>
      </div>

      {/* Strength meter */}
      <PasswordStrengthMeter password={password} />

      {/* Length slider */}
      <div className="pw-gen__row">
        <label className="pw-gen__label">
          Panjang
          <span className="pw-gen__length-val">{length}</span>
        </label>
        <input
          type="range"
          className="pw-gen__slider"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
        />
      </div>

      {/* Toggles */}
      <div className="pw-gen__toggles">
        {[
          { label: 'Huruf Besar (A–Z)', value: useUpper,   set: setUseUpper },
          { label: 'Angka (0–9)',        value: useDigits,  set: setUseDigits },
          { label: 'Simbol (!@#…)',      value: useSymbols, set: setUseSymbols },
        ].map(({ label, value, set }) => (
          <label key={label} className="pw-gen__toggle-row">
            <span>{label}</span>
            <button
              role="switch"
              aria-checked={value}
              className={`settings-toggle ${value ? 'settings-toggle--on' : ''}`}
              onClick={() => set(!value)}
            />
          </label>
        ))}
      </div>

      {/* Actions */}
      {onUse && (
        <div className="pw-gen__actions">
          <button className="btn btn--primary pw-gen__use-btn" onClick={handleUse}>
            Pakai Password Ini
          </button>
        </div>
      )}
    </div>
  );
}
