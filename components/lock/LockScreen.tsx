'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/primitives';
import {
  Sun, Moon, KeyRound, Lock, Fingerprint,
  RefreshCw, ArrowLeft, Plus, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { VaultIcon }          from '@/components/common/LoadingScreen';
import { useTheme }           from '@/components/providers/ThemeProvider';
import { PINPad }             from './PINPad';
import { RecoveryPanel }      from './RecoveryPanel';
import { SetupFlow }          from './SetupFlow';
import { BiometricHintModal } from './BiometricHintModal';
import {
  unlockVault, setupVault, verifyPinAndGetMaster,
  hasPinSetup, recoverMasterPw, hasVaultData, getVaultHint,
} from '@/lib/vaultService';
import type { UnlockPayload } from '@/lib/vaultService';

function hasBiometricCredential(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('vault_bio_cred') && !!window.PublicKeyCredential;
}

type Panel = 'pin' | 'master' | 'seed' | 'recovery' | 'setup';

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS   = 5 * 60 * 1000;

interface LockScreenProps {
  onUnlocked: (payload: UnlockPayload, masterPw: string) => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const { theme, toggleTheme } = useTheme();

  const initialPanel = (): Panel => {
    if (!hasVaultData()) return 'setup';
    if (hasPinSetup())   return 'pin';
    return 'master';
  };

  const [panel,         setPanel]         = useState<Panel>(initialPanel);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [showBiometric, setShowBiometric] = useState(false);

  const [pinBuf,         setPinBuf]         = useState('');
  const [pinAttempts,    setPinAttempts]    = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [lockRemain,     setLockRemain]     = useState(0);

  const [masterInput, setMasterInput] = useState('');
  const [masterShow,  setMasterShow]  = useState(false);
  const [seedInput,   setSeedInput]   = useState('');

  const hint      = getVaultHint();
  const pinLocked = Date.now() < pinLockedUntil;

  useEffect(() => {
    if (!pinLocked) { setLockRemain(0); return; }
    const tick = () => {
      const r = Math.ceil((pinLockedUntil - Date.now()) / 1000);
      setLockRemain(r <= 0 ? 0 : r);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pinLockedUntil, pinLocked]);

  const goPanel = (p: Panel) => {
    setPanel(p); setError('');
    setPinBuf(''); setMasterInput(''); setSeedInput('');
  };

  const doUnlockWithMaster = useCallback(async (masterPw: string) => {
    setLoading(true); setError('');
    try {
      const payload = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Password salah');
    } finally { setLoading(false); }
  }, [onUnlocked]);

  const handleMasterSubmit = () => {
    if (!masterInput.trim()) { setError('Masukkan master password'); return; }
    doUnlockWithMaster(masterInput);
  };

  const handlePinSubmit = useCallback(async () => {
    if (pinLocked) { setError(`PIN dikunci. Coba lagi dalam ${lockRemain} detik.`); return; }
    if (pinBuf.length < 4) { setError('PIN minimal 4 digit'); return; }
    setLoading(true); setError('');
    try {
      const masterPw = await verifyPinAndGetMaster(pinBuf);
      setPinBuf('');
      await doUnlockWithMaster(masterPw);
    } catch (e) {
      setPinBuf('');
      const msg = (e as Error).message ?? 'PIN salah';
      if (msg.includes('Format PIN lama')) {
        setError('Format PIN lama. Masuk dengan master password, lalu setup ulang PIN.');
        goPanel('master');
      } else {
        const next = pinAttempts + 1;
        setPinAttempts(next);
        if (next >= MAX_PIN_ATTEMPTS) {
          setPinLockedUntil(Date.now() + PIN_LOCKOUT_MS);
          setPinAttempts(0);
          setError('Terlalu banyak percobaan. PIN dikunci 5 menit.');
        } else {
          setError(`PIN salah. ${MAX_PIN_ATTEMPTS - next} percobaan tersisa.`);
        }
      }
      setLoading(false);
    }
  }, [pinBuf, pinLocked, lockRemain, pinAttempts, doUnlockWithMaster]);

  const handleSeedLogin = async () => {
    if (!seedInput.trim()) { setError('Masukkan recovery phrase'); return; }
    setLoading(true); setError('');
    try {
      const masterPw = await recoverMasterPw(seedInput.trim());
      const payload  = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Recovery phrase salah');
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (phrase: string) => {
    setLoading(true); setError('');
    try {
      const masterPw = await recoverMasterPw(phrase);
      const payload  = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Recovery gagal');
      setLoading(false);
    }
  };

  const handleSetupComplete = async (masterPw: string, hintStr: string, recovery: string) => {
    await setupVault({ masterPw, hint: hintStr, recoveryPhrase: recovery });
    const payload = await unlockVault(masterPw);
    onUnlocked(payload, masterPw);
  };

  const S = { // inline style helpers untuk konsistensi
    link: {
      background: 'none', border: 'none', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 'var(--text-xs)', color: 'var(--muted2)',
      fontFamily: 'var(--font-sans)', fontWeight: 500,
      padding: '4px 0', transition: 'color 0.15s ease',
    } as React.CSSProperties,
  };

  return (
    <>
      <div className="ls">

        {/* Tema toggle */}
        <button className="ls-theme-btn" onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Logo — Sesi D: shield glow (M-14) */}
        <div className="ls-logo">
          <div className="lock-shield-icon">
            <VaultIcon size={44} />
            <span className="lock-shield-ring" aria-hidden="true" />
          </div>
          <h1 className="ls-title">
            Vault <span className="ls-title__gold">Next</span>
          </h1>
        </div>

        {/* Card */}
        <div className="ls-card">

          {/* ── PIN ── */}
          {panel === 'pin' && (
            <div className="ls-panel">
              {pinLocked && (
                <div className="ls-notice ls-notice--warn">
                  <Lock size={12} />
                  <span>Dikunci {lockRemain} detik lagi…</span>
                </div>
              )}

              <PINPad
                value={pinBuf}
                maxLen={8}
                onDigit={(d) => {
                  if (!pinLocked && !loading) {
                    setPinBuf((b) => b.length < 8 ? b + d : b);
                    setError('');
                  }
                }}
                onDelete={() => setPinBuf((b) => b.slice(0, -1))}
                onSubmit={handlePinSubmit}
                disabled={loading}
                locked={pinLocked}
                lockedLabel={`Dikunci ${lockRemain} detik lagi…`}
                error={error}
              />

              {/* Link navigasi — inline, tanpa titik pemisah, konsisten */}
              <div className="ls-links">
                <button style={S.link} onClick={() => goPanel('master')}>
                  <KeyRound size={11} /> Master Password
                </button>
                <button style={S.link} onClick={() => goPanel('seed')}>
                  <KeyRound size={11} /> Seed Phrase
                </button>
              </div>
            </div>
          )}

          {/* ── Master Password ── */}
          {panel === 'master' && (
            <div className="ls-panel">
              <div className="ls-section-title">Master Password</div>

              {hint && (
                <div className="ls-hint">
                  <span className="ls-hint__label">Petunjuk:</span> {hint}
                </div>
              )}

              <div className="ls-field">
                <div className="ls-pw-wrap">
                  <input
                    className="ls-input"
                    type={masterShow ? 'text' : 'password'}
                    value={masterInput}
                    onChange={(e) => { setMasterInput(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMasterSubmit()}
                    placeholder="Masukkan master password…"
                    autoFocus
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button className="ls-pw-toggle" type="button"
                    onClick={() => setMasterShow((v) => !v)}
                    aria-label={masterShow ? 'Sembunyikan' : 'Tampilkan'}>
                    {masterShow ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p className="ls-error">{error}</p>}
              </div>
              <Button variant="gold" full onClick={handleMasterSubmit} disabled={loading || !masterInput}>
                {loading
                  ? <><Loader2 size={14} className="spin" /> Membuka…</>
                  : 'Buka Vault'}
              </Button>

              <div className="ls-links">
                {hasPinSetup() && (
                  <button style={S.link} onClick={() => goPanel('pin')}>
                    <ArrowLeft size={11} /> Kembali ke PIN
                  </button>
                )}
                <button style={S.link} onClick={() => goPanel('seed')}>
                  <KeyRound size={11} /> Seed Phrase
                </button>
                <button style={S.link} onClick={() => goPanel('recovery')}>
                  <RefreshCw size={11} /> Lupa password?
                </button>
              </div>
            </div>
          )}

          {/* ── Seed Phrase ── */}
          {panel === 'seed' && (
            <div className="ls-panel">
              <div className="ls-section-title">Masuk via Seed Phrase</div>

              <div className="ls-field">
                <label className="ls-label">Recovery Phrase (pisahkan spasi)</label>
                <textarea
                  className="ls-textarea"
                  value={seedInput}
                  onChange={(e) => { setSeedInput(e.target.value); setError(''); }}
                  placeholder="kata1 kata2 kata3 kata4 kata5…"
                  rows={3}
                  autoFocus
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={loading}
                />
                {error && <p className="ls-error">{error}</p>}
              </div>
              <Button variant="gold" full onClick={handleSeedLogin} disabled={loading || !seedInput.trim()}>
                {loading
                  ? <><Loader2 size={14} className="spin" /> Membuka…</>
                  : 'Buka Vault'}
              </Button>

              <div className="ls-links">
                <button style={S.link} onClick={() => goPanel(hasPinSetup() ? 'pin' : 'master')}>
                  <ArrowLeft size={11} /> Kembali
                </button>
                <button style={S.link} onClick={() => goPanel('recovery')}>
                  <RefreshCw size={11} /> Reset password
                </button>
              </div>
            </div>
          )}

          {/* ── Recovery ── */}
          {panel === 'recovery' && (
            <div className="ls-panel">
              <RecoveryPanel
                onSubmit={handleRecoverySubmit}
                onBack={() => goPanel(hasPinSetup() ? 'pin' : 'master')}
                loading={loading}
                error={error}
              />
            </div>
          )}

          {/* ── Setup Baru ── */}
          {panel === 'setup' && (
            <div className="ls-panel">
              <SetupFlow onComplete={handleSetupComplete} />
            </div>
          )}

          {/* ── Footer: biometrik + setup baru ── */}
          {panel !== 'setup' && panel !== 'recovery' && (
            <div className="ls-footer">
              {hasBiometricCredential() && (
                <button className="ls-bio-btn" onClick={() => setShowBiometric(true)}
                  aria-label="Buka dengan sidik jari">
                  <Fingerprint size={20} />
                  <span>Sidik Jari</span>
                </button>
              )}
              <button style={S.link} onClick={() => goPanel('setup')}>
                <Plus size={11} /> Vault Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {showBiometric && (
        <BiometricHintModal
          mode="auth"
          onClose={() => setShowBiometric(false)}
          onSuccess={async (pw) => {
            setShowBiometric(false);
            await doUnlockWithMaster(pw);
          }}
        />
      )}
    </>
  );
}
