'use client';

/**
 * Vault Next — SetupFlow
 * Wizard multi-step setup vault pertama kali.
 * Sesi B: refactor pakai Button primitive.
 * Fix STYLE-01: inline style → CSS classes (styles/components/lock.css)
 */

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

interface SetupFlowProps {
  onComplete: (masterPw: string, hint: string, recoveryPhrase: string) => Promise<void>;
}

type Step = 'password' | 'hint' | 'recovery' | 'done';

export function SetupFlow({ onComplete }: SetupFlowProps) {
  const [step, setStep]           = useState<Step>('password');
  const [pw, setPw]               = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [showPwC, setShowPwC]     = useState(false);
  const [hint, setHint]           = useState('');
  const [recovery, setRecovery]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const pwStrength = getStrength(pw);

  const handlePasswordNext = () => {
    setError('');
    if (pw.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (pw !== pwConfirm) { setError('Password tidak cocok'); return; }
    setStep('hint');
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await onComplete(pw, hint, recovery);
    } catch {
      setError('Gagal membuat vault. Coba lagi.');
      setLoading(false);
    }
  };

  const stepLabels: Step[] = ['password', 'hint', 'recovery', 'done'];
  const stepIdx = stepLabels.indexOf(step);

  return (
    <div className="setup-flow">

      {/* Progress steps */}
      <div className="setup-steps">
        {stepLabels.map((s, i) => (
          <div key={s} className="setup-step">
            <div className={[
              'setup-step__dot',
              i < stepIdx   ? 'setup-step__dot--done'   : '',
              i === stepIdx ? 'setup-step__dot--active' : '',
            ].filter(Boolean).join(' ')}>
              {i < stepIdx
                ? <CheckCircle2 size={12} style={{ color: 'var(--bg)' }} />
                : (
                  <span className={`setup-step__num${i === stepIdx ? ' setup-step__num--active' : ''}`}>
                    {i + 1}
                  </span>
                )
              }
            </div>
            {i < stepLabels.length - 1 && (
              <div className={`setup-step__line${i < stepIdx ? ' setup-step__line--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Password */}
      {step === 'password' && (
        <div className="setup-panel">
          <h3 className="setup-panel__title">Buat Master Password</h3>
          <p className="setup-panel__desc">
            Password ini mengenkripsi semua data vault kamu. Pilih yang kuat dan mudah diingat.
          </p>
          <div className="setup-panel__fields">
            <div className="setup-panel__field-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(''); }}
                placeholder="Master password…"
                autoFocus
                className={`setup-input${!!error && pw.length > 0 ? ' setup-input--error' : ''}`}
              />
              <ToggleEye show={showPw} onToggle={() => setShowPw((s) => !s)} />
            </div>

            {pw && (
              <div className="setup-strength">
                <div className="setup-strength__bars">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className="setup-strength__bar"
                      style={{ background: i < pwStrength.level ? pwStrength.color : undefined }}
                    />
                  ))}
                </div>
                <span className="setup-strength__label" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </span>
              </div>
            )}

            <div className="setup-panel__field-wrap">
              <input
                type={showPwC ? 'text' : 'password'}
                value={pwConfirm}
                onChange={(e) => { setPwConfirm(e.target.value); setError(''); }}
                placeholder="Konfirmasi password…"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordNext()}
                className={`setup-input${!!error && pwConfirm.length > 0 && pw !== pwConfirm ? ' setup-input--error' : ''}`}
              />
              <ToggleEye show={showPwC} onToggle={() => setShowPwC((s) => !s)} />
            </div>

            {error && <ErrMsg msg={error} />}

            <Button
              variant="gold"
              full
              disabled={!pw || !pwConfirm}
              onClick={handlePasswordNext}
              rightIcon={<ArrowRight size={15} />}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {/* Step: Hint */}
      {step === 'hint' && (
        <div className="setup-panel">
          <h3 className="setup-panel__title">
            Petunjuk Password{' '}
            <span className="setup-panel__title-muted">(opsional)</span>
          </h3>
          <p className="setup-panel__desc">
            Petunjuk ini akan muncul di halaman login.{' '}
            <strong style={{ color: 'var(--text2)' }}>Jangan tulis password-nya langsung.</strong>
          </p>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Contoh: nama hewan peliharaan + tahun lahir"
            maxLength={100}
            autoFocus
            className="setup-input"
            style={{ marginBottom: 'var(--space-5)' }}
          />
          <div className="setup-panel__row">
            <Button variant="ghost" onClick={() => setStep('password')} leftIcon={<ArrowLeft size={14} />}>
              Kembali
            </Button>
            <Button variant="gold" style={{ flex: 1 }} onClick={() => setStep('recovery')} rightIcon={<ArrowRight size={15} />}>
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {/* Step: Recovery */}
      {step === 'recovery' && (
        <div className="setup-panel">
          <h3 className="setup-panel__title">
            Recovery Phrase{' '}
            <span className="setup-panel__title-muted">(opsional)</span>
          </h3>
          <p className="setup-panel__desc">
            Jika kamu lupa master password, recovery phrase ini bisa digunakan untuk memulihkan akses. Simpan di tempat aman.
          </p>
          <textarea
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            placeholder="Ketikkan recovery phrase kamu… (boleh dikosongkan)"
            rows={3}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
            enterKeyHint="next"
            className="setup-input setup-input--mono setup-input--textarea"
            style={{ marginBottom: 'var(--space-5)' }}
          />
          <div className="setup-panel__row">
            <Button variant="ghost" onClick={() => setStep('hint')} leftIcon={<ArrowLeft size={14} />}>
              Kembali
            </Button>
            <Button variant="gold" style={{ flex: 1 }} onClick={() => setStep('done')} rightIcon={<ArrowRight size={15} />}>
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="setup-panel setup-panel--center">
          <div className="setup-done-icon">
            <ShieldCheck size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 className="setup-done-title">Vault siap dibuat!</h3>
          <p className="setup-done-desc">
            Data kamu akan dienkripsi dengan{' '}
            <strong style={{ color: 'var(--text2)' }}>AES-256-GCM + PBKDF2 dua lapis</strong>.
            Tidak ada server — semua tersimpan di perangkat ini.
          </p>
          <div className="setup-summary">
            {[
              { label: 'Password', value: '••••••' + (pw.length > 6 ? '•'.repeat(pw.length - 6) : '') },
              { label: 'Petunjuk', value: hint || '(tidak diset)' },
              { label: 'Recovery', value: recovery ? `${recovery.length} karakter` : '(tidak diset)' },
            ].map((item) => (
              <div key={item.label} className="setup-summary__row">
                <span className="setup-summary__label">{item.label}</span>
                <span className="setup-summary__value">{item.value}</span>
              </div>
            ))}
          </div>
          {error && <ErrMsg msg={error} />}
          <div className="setup-panel__row">
            <Button variant="ghost" onClick={() => setStep('recovery')} leftIcon={<ArrowLeft size={14} />} />
            <Button
              variant="gold"
              style={{ flex: 1 }}
              loading={loading}
              onClick={handleFinish}
              leftIcon={!loading ? <KeyRound size={15} /> : undefined}
            >
              {loading ? 'Membuat Vault…' : 'Buat Vault Sekarang'}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Sub-components ── */

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="setup-eye-btn"
      aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return <div className="setup-error">{msg}</div>;
}

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (pw.length >= 12)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[a-z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 16)          score++;
  const levels = [
    { label: 'Sangat Lemah',    color: 'var(--str-1)' },
    { label: 'Lemah',           color: 'var(--str-2)' },
    { label: 'Biasa',           color: 'var(--str-3)' },
    { label: 'Cukup',           color: 'var(--str-4)' },
    { label: 'Kuat',            color: 'var(--str-5)' },
    { label: 'Sangat Kuat',     color: 'var(--str-6)' },
    { label: 'Tak Tertandingi', color: 'var(--str-7)' },
  ];
  return { level: Math.min(score + 1, 7), ...levels[Math.min(score, 6)] };
}
