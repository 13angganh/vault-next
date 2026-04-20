'use client';

import { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

// ─── Step 1: Setup PIN ───────────────────────────────────────────────────────

function StepSetupPIN({ onNext }: { onNext: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (pin.length !== 6) return setError('PIN harus 6 digit');
    if (pin !== confirmPin) return setError('PIN tidak cocok');
    setError('');
    onNext(pin);
  };

  const inputStyle = {
    width: '100%',
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '22px',
    fontFamily: 'var(--font-jetbrains)',
    letterSpacing: '0.4em',
    textAlign: 'center' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', margin: '0 0 var(--space-1) 0' }}>
          Buat PIN
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
          PIN 6 digit untuk membuka vault setiap hari
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          maxLength={6}
          inputMode="numeric"
          style={inputStyle}
        />
        <input
          type="password"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Ulangi PIN"
          maxLength={6}
          inputMode="numeric"
          style={{ ...inputStyle, borderColor: confirmPin && confirmPin !== pin ? 'var(--status-danger)' : 'var(--border-default)' }}
        />
      </div>

      {error && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--status-danger)', fontFamily: 'var(--font-outfit)' }}>{error}</p>}

      <button
        onClick={handleNext}
        disabled={pin.length !== 6 || confirmPin.length !== 6}
        style={btnStyle(pin.length === 6 && confirmPin.length === 6)}
      >
        Lanjut
      </button>
    </div>
  );
}

// ─── Step 2: Setup Master Password ──────────────────────────────────────────

function StepSetupMasterPW({ onNext }: { onNext: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (pw.length < 8) return setError('Minimal 8 karakter');
    if (pw !== confirmPw) return setError('Kata sandi tidak cocok');
    setError('');
    onNext(pw);
  };

  const strength = pw.length === 0 ? 0 : pw.length < 8 ? 1 : pw.length < 12 ? 2 : pw.match(/[A-Z]/) && pw.match(/[0-9]/) ? 4 : 3;
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const strengthColors = ['', 'var(--strength-1)', 'var(--strength-3)', 'var(--strength-4)', 'var(--strength-5)'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', margin: '0 0 var(--space-1) 0' }}>
          Kata Sandi Utama
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
          Cadangan jika lupa PIN. Simpan dengan aman.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div style={{ position: 'relative' }}>
          <input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Kata sandi utama"
            style={{
              width: '100%',
              padding: 'var(--space-4) var(--space-12) var(--space-4) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-base)',
              fontFamily: 'var(--font-jetbrains)',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
          <button onClick={() => setShow((s) => !s)} style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Strength bar */}
        {pw.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'var(--bg-hover)', overflow: 'hidden' }}>
              <div style={{ width: `${(strength / 4) * 100}%`, height: '100%', background: strengthColors[strength], transition: 'all var(--transition-base)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: strengthColors[strength], fontFamily: 'var(--font-outfit)', whiteSpace: 'nowrap' }}>
              {strengthLabel[strength]}
            </span>
          </div>
        )}

        <input
          type={show ? 'text' : 'password'}
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Ulangi kata sandi"
          style={{
            width: '100%',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${confirmPw && confirmPw !== pw ? 'var(--status-danger)' : 'var(--border-default)'}`,
            background: 'var(--bg-input)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            fontFamily: 'var(--font-jetbrains)',
            outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {error && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--status-danger)', fontFamily: 'var(--font-outfit)' }}>{error}</p>}

      <button onClick={handleNext} disabled={pw.length < 8 || confirmPw.length === 0} style={btnStyle(pw.length >= 8 && confirmPw.length > 0)}>
        Lanjut
      </button>
    </div>
  );
}

// ─── Step 3: Tampilkan Seed Phrase ──────────────────────────────────────────

function StepShowSeed({ seedPhrase, isLoading, onConfirm }: { seedPhrase: string; isLoading: boolean; onConfirm: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const words = seedPhrase.split(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', margin: '0 0 var(--space-1) 0' }}>
          Seed Phrase
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
          Simpan 12 kata ini di tempat aman. Satu-satunya cara pemulihan.
        </p>
      </div>

      {/* Warning */}
      <div style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
        <AlertTriangle size={14} color="var(--gold)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', margin: 0, lineHeight: 1.6 }}>
          Jangan screenshot. Tulis tangan dan simpan offline.
        </p>
      </div>

      {/* Words Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
        {words.map((word, i) => (
          <div key={i} style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains)', minWidth: '14px' }}>{i + 1}.</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-jetbrains)', fontWeight: 'var(--fw-medium)' }}>{word}</span>
          </div>
        ))}
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        style={{
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-subtle)',
          color: copied ? 'var(--status-success)' : 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-outfit)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Tersalin!' : 'Salin ke clipboard'}
      </button>

      {/* Checkbox */}
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          style={{ marginTop: '3px', accentColor: 'var(--gold)', width: '16px', height: '16px' }}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', lineHeight: 1.5 }}>
          Saya sudah menyimpan seed phrase ini dengan aman
        </span>
      </label>

      <button
        onClick={onConfirm}
        disabled={!confirmed || isLoading}
        style={btnStyle(confirmed && !isLoading)}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Menyiapkan...
          </span>
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldCheck size={16} />
            Selesai, Buka Vault
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function btnStyle(enabled: boolean) {
  return {
    padding: 'var(--space-4)',
    borderRadius: 'var(--radius-lg)',
    background: enabled ? 'var(--gold)' : 'var(--bg-hover)',
    border: 'none',
    color: enabled ? 'var(--text-inverse)' : 'var(--text-muted)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--fw-button)' as const,
    fontFamily: 'var(--font-outfit)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all var(--transition-base)',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

// ─── SetupFlow Container ─────────────────────────────────────────────────────

export function SetupFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pin, setPin] = useState('');
  const [masterPW, setMasterPW] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');

  const { setupVault, confirmSetupSeed, isLoading, error } = useAuthStore();

  const handlePINNext = (p: string) => {
    setPin(p);
    setStep(2);
  };

  const handlePWNext = async (pw: string) => {
    setMasterPW(pw);
    try {
      const result = await setupVault(pin, pw);
      setSeedPhrase(result.seedPhrase);
      setStep(3);
    } catch {
      // error ditangani di store
    }
  };

  const handleConfirmSeed = () => {
    confirmSetupSeed();
  };

  // Progress indicator
  const steps = ['PIN', 'Kata Sandi', 'Seed Phrase'];

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-root)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)', fontFamily: 'var(--font-jetbrains)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 var(--space-1) 0' }}>
            VAULT NEXT
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)', margin: 0 }}>
            Selamat datang — mari siapkan vault Anda
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDone || isCurrent ? 'var(--gold)' : 'var(--bg-hover)',
                    border: `1px solid ${isDone || isCurrent ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontFamily: 'var(--font-outfit)',
                    fontWeight: 'var(--fw-semibold)',
                    color: isDone || isCurrent ? 'var(--text-inverse)' : 'var(--text-muted)',
                    transition: 'all var(--transition-base)',
                  }}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-outfit)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: '1px', background: isDone ? 'var(--gold)' : 'var(--border-subtle)', transition: 'background var(--transition-base)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-card)',
        }}>
          {step === 1 && <StepSetupPIN onNext={handlePINNext} />}
          {step === 2 && <StepSetupMasterPW onNext={handlePWNext} />}
          {step === 3 && <StepShowSeed seedPhrase={seedPhrase} isLoading={isLoading} onConfirm={handleConfirmSeed} />}
        </div>

        {error && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--status-danger)', textAlign: 'center', fontFamily: 'var(--font-outfit)' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
