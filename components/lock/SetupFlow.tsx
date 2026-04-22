'use client';

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface SetupFlowProps {
  onComplete: (masterPw: string, hint: string, recoveryPhrase: string) => Promise<void>;
}

type Step = 'password' | 'pin_offer' | 'hint' | 'recovery' | 'done';

export function SetupFlow({ onComplete }: SetupFlowProps) {
  const [step, setStep]             = useState<Step>('password');
  const [pw, setPw]                 = useState('');
  const [pwConfirm, setPwConfirm]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showPwC, setShowPwC]       = useState(false);
  const [hint, setHint]             = useState('');
  const [recovery, setRecovery]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const pwStrength = getStrength(pw);

  // ── Step: Password ──────────────────────────────────────────────────────────
  const handlePasswordNext = () => {
    setError('');
    if (pw.length < 6) { setError('Password minimal 6 karakter'); return; }
    if (pw !== pwConfirm) { setError('Password tidak cocok'); return; }
    setStep('hint');
  };

  // ── Step: Hint ──────────────────────────────────────────────────────────────
  const handleHintNext = () => setStep('recovery');

  // ── Step: Recovery ──────────────────────────────────────────────────────────
  const handleRecoveryNext = () => setStep('done');

  // ── Step: Done ──────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    setLoading(true);
    try {
      await onComplete(pw, hint, recovery);
    } catch (e) {
      setError('Gagal membuat vault. Coba lagi.');
      setLoading(false);
    }
  };

  const stepLabels: Step[] = ['password', 'hint', 'recovery', 'done'];
  const stepIdx = stepLabels.indexOf(step);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {stepLabels.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < stepLabels.length - 1 ? 1 : undefined }}>
            <div style={{
              width: 22, height: 22,
              borderRadius: '50%',
              background: i < stepIdx ? 'var(--gold)' : i === stepIdx ? 'var(--gold-soft)' : 'var(--bg-s3)',
              border: `1.5px solid ${i <= stepIdx ? 'var(--gold)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'all var(--transition-base)',
            }}>
              {i < stepIdx
                ? <CheckCircle2 size={12} style={{ color: 'var(--bg)' }} />
                : <span style={{ fontSize: 10, fontWeight: 700, color: i === stepIdx ? 'var(--gold)' : 'var(--muted)' }}>{i + 1}</span>
              }
            </div>
            {i < stepLabels.length - 1 && (
              <div style={{
                flex: 1, height: 1.5,
                background: i < stepIdx ? 'var(--gold)' : 'var(--border)',
                transition: 'background var(--transition-base)',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step: Password ── */}
      {step === 'password' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Buat Master Password
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
            Password ini mengenkripsi semua data vault kamu. Pilih yang kuat dan mudah diingat.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(''); }}
                placeholder="Master password…"
                autoFocus
                style={inputStyle(!!error && pw.length > 0)}
              />
              <ToggleEye show={showPw} onToggle={() => setShowPw(s => !s)} />
            </div>

            {/* Strength bar */}
            {pw && (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i < pwStrength.level ? pwStrength.color : 'var(--border)',
                      transition: 'background 0.2s ease',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: pwStrength.color }}>{pwStrength.label}</span>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type={showPwC ? 'text' : 'password'}
                value={pwConfirm}
                onChange={(e) => { setPwConfirm(e.target.value); setError(''); }}
                placeholder="Konfirmasi password…"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordNext()}
                style={inputStyle(!!error && pwConfirm.length > 0 && pw !== pwConfirm)}
              />
              <ToggleEye show={showPwC} onToggle={() => setShowPwC(s => !s)} />
            </div>

            {error && <ErrMsg msg={error} />}

            <button
              onClick={handlePasswordNext}
              disabled={!pw || !pwConfirm}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', gap: 8, marginTop: 'var(--space-2)', opacity: !pw || !pwConfirm ? 0.5 : 1 }}
            >
              Lanjut <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Hint ── */}
      {step === 'hint' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Petunjuk Password <span style={{ color: 'var(--muted2)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>(opsional)</span>
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
            Petunjuk ini akan muncul di halaman login. <strong style={{ color: 'var(--text2)' }}>Jangan tulis password-nya langsung.</strong>
          </p>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Contoh: nama hewan peliharaan + tahun lahir"
            maxLength={100}
            autoFocus
            style={{ ...inputStyle(false), marginBottom: 'var(--space-5)' }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={() => setStep('password')} className="btn btn-ghost" style={{ gap: 6 }}>
              <ArrowLeft size={14} /> Kembali
            </button>
            <button onClick={handleHintNext} className="btn btn-gold" style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
              Lanjut <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Recovery ── */}
      {step === 'recovery' && (
        <div style={{ animation: 'fadeUp 0.3s ease both' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Recovery Phrase <span style={{ color: 'var(--muted2)', fontWeight: 400, fontSize: 'var(--text-sm)' }}>(opsional)</span>
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
            Jika kamu lupa master password, recovery phrase ini bisa digunakan untuk memulihkan akses.
            Simpan di tempat yang aman dan rahasia.
          </p>
          <textarea
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            placeholder="Ketikkan recovery phrase kamu… (boleh dikosongkan)"
            rows={3}
            autoFocus
            style={{
              ...inputStyle(false),
              resize: 'none',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.7,
              marginBottom: 'var(--space-5)',
            }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={() => setStep('hint')} className="btn btn-ghost" style={{ gap: 6 }}>
              <ArrowLeft size={14} /> Kembali
            </button>
            <button onClick={handleRecoveryNext} className="btn btn-gold" style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
              Lanjut <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === 'done' && (
        <div style={{ animation: 'fadeUp 0.3s ease both', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            background: 'rgba(0,212,170,0.1)',
            border: '1.5px solid rgba(0,212,170,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-4)',
          }}>
            <ShieldCheck size={28} style={{ color: 'var(--teal)' }} />
          </div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Vault siap dibuat!
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
            Data kamu akan dienkripsi dengan <strong style={{ color: 'var(--text2)' }}>AES-256-GCM + PBKDF2 dua lapis</strong>.
            Tidak ada server — semua tersimpan di perangkat ini.
          </p>

          {/* Summary */}
          <div style={{
            textAlign: 'left',
            background: 'var(--bg-s1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}>
            {[
              { label: 'Password', value: '••••••' + (pw.length > 6 ? '•'.repeat(pw.length - 6) : '') },
              { label: 'Petunjuk', value: hint || '(tidak diset)' },
              { label: 'Recovery', value: recovery ? `${recovery.length} karakter` : '(tidak diset)' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 0',
                fontSize: 'var(--text-xs)',
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ color: 'var(--muted2)' }}>{item.label}</span>
                <span style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{item.value}</span>
              </div>
            ))}
          </div>

          {error && <ErrMsg msg={error} />}

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button onClick={() => setStep('recovery')} className="btn btn-ghost" style={{ gap: 6 }}>
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="btn btn-gold"
              style={{ flex: 1, justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid var(--gold)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }} />
                  Membuat Vault…
                </>
              ) : (
                <>
                  <KeyRound size={15} />
                  Buat Vault Sekarang
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px 40px 13px 14px',
    background: 'var(--bg-s1)',
    border: `1px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--text)',
    fontSize: 'var(--text-sm)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    boxSizing: 'border-box' as const,
  };
}

function ToggleEye({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--muted2)', padding: 4, display: 'flex',
      }}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', animation: 'fadeIn 0.2s ease', textAlign: 'center' }}>
      {msg}
    </div>
  );
}

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 16) score++;

  const levels = [
    { label: 'Sangat Lemah', color: 'var(--str-1)' },
    { label: 'Lemah',        color: 'var(--str-2)' },
    { label: 'Biasa',        color: 'var(--str-3)' },
    { label: 'Cukup',        color: 'var(--str-4)' },
    { label: 'Kuat',         color: 'var(--str-5)' },
    { label: 'Sangat Kuat',  color: 'var(--str-6)' },
    { label: 'Tak Tertandingi', color: 'var(--str-7)' },
  ];
  return { level: Math.min(score + 1, 7), ...levels[Math.min(score, 6)] };
}
