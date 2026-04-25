'use client';

/**
 * Vault Next — LockScreen (Sesi 6B — rewrite bersih)
 *
 * Panel:
 *  pin      — PIN pad, standalone unlock vault (FIX utama)
 *  master   — master password
 *  seed     — masuk via seed phrase TANPA reset (seperti app lama)
 *  recovery — recovery / reset password
 *  setup    — buat vault baru
 */

import { useState, useCallback, useEffect } from 'react';
import { Sun, Moon, KeyRound, Lock, Fingerprint, RefreshCw, ArrowLeft, Plus, Loader2, Eye, EyeOff } from 'lucide-react';

import { VaultIcon }          from '@/components/LoadingScreen';
import { useTheme }           from '@/components/providers/ThemeProvider';
import { PINPad }             from './PINPad';
import { RecoveryPanel }      from './RecoveryPanel';
import { SetupFlow }          from './SetupFlow';
import { BiometricHintModal } from './BiometricHintModal';

import {
  unlockVault,
  setupVault,
  verifyPinAndGetMaster,
  hasPinSetup,
  recoverMasterPw,
  hasVaultData,
  getVaultHint,
} from '@/lib/vaultService';
import type { UnlockPayload } from '@/lib/vaultService';
/* Helper: cek apakah biometrik credential sudah terdaftar di perangkat */
function hasBiometricCredential(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('vault_bio_cred') && !!window.PublicKeyCredential;
}

/* Helper: apakah session aktif (master pw tersimpan sementara) */
function hasBiometricSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('vault_ss_mpw');
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

  const [panel,          setPanel]          = useState<Panel>(initialPanel);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [showBiometric,  setShowBiometric]  = useState(false);

  // PIN state
  const [pinBuf,         setPinBuf]         = useState('');
  const [pinAttempts,    setPinAttempts]    = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState(0);
  const [lockRemain,     setLockRemain]     = useState(0);

  // Master password state
  const [masterInput,    setMasterInput]    = useState('');
  const [masterShow,     setMasterShow]     = useState(false);

  // Seed phrase state
  const [seedInput,      setSeedInput]      = useState('');

  const hint      = getVaultHint();
  const pinLocked = Date.now() < pinLockedUntil;

  // Countdown timer
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
    setPanel(p);
    setError('');
    setPinBuf('');
    setMasterInput('');
    setSeedInput('');
  };

  // ── Unlock via master password ─────────────────────────────────────────────
  const doUnlockWithMaster = useCallback(async (masterPw: string) => {
    setLoading(true);
    setError('');
    try {
      const payload = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Password salah');
    } finally {
      setLoading(false);
    }
  }, [onUnlocked]);

  const handleMasterSubmit = () => {
    if (!masterInput.trim()) { setError('Masukkan master password'); return; }
    doUnlockWithMaster(masterInput);
  };

  // ── Unlock via PIN (standalone — langsung buka vault) ──────────────────────
  const handlePinSubmit = useCallback(async () => {
    if (pinLocked) {
      setError(`PIN dikunci. Coba lagi dalam ${lockRemain} detik.`);
      return;
    }
    if (pinBuf.length < 4) { setError('PIN minimal 4 digit'); return; }

    setLoading(true);
    setError('');
    try {
      const masterPw = await verifyPinAndGetMaster(pinBuf);
      setPinBuf('');
      await doUnlockWithMaster(masterPw);
    } catch (e) {
      setPinBuf('');
      const msg = (e as Error).message ?? 'PIN salah';

      if (msg.includes('Format PIN lama')) {
        setError('Format PIN lama terdeteksi. Masuk dengan master password, lalu setup ulang PIN di Pengaturan.');
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

  // ── Seed phrase login (masuk langsung tanpa reset) ─────────────────────────
  const handleSeedLogin = async () => {
    if (!seedInput.trim()) { setError('Masukkan recovery phrase'); return; }
    setLoading(true);
    setError('');
    try {
      const masterPw = await recoverMasterPw(seedInput.trim());
      const payload  = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Recovery phrase salah');
      setLoading(false);
    }
  };

  // ── Recovery panel submit ──────────────────────────────────────────────────
  const handleRecoverySubmit = async (phrase: string) => {
    setLoading(true);
    setError('');
    try {
      const masterPw = await recoverMasterPw(phrase);
      const payload  = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Recovery gagal');
      setLoading(false);
    }
  };

  // ── Setup vault baru ───────────────────────────────────────────────────────
  const handleSetupComplete = async (masterPw: string, hintStr: string, recovery: string) => {
    await setupVault({ masterPw, hint: hintStr, recoveryPhrase: recovery });
    const payload = await unlockVault(masterPw);
    onUnlocked(payload, masterPw);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="lock-screen">

        {/* Theme toggle */}
        <button className="lock-theme-btn" onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logo */}
        <div className="lock-logo-wrap">
          <VaultIcon size={52} />
          <h1 className="lock-title">
            Vault <span className="lock-title__accent">Next</span>
          </h1>
        </div>

        {/* Card */}
        <div className="lock-card">

          {/* ── PIN ── */}
          {panel === 'pin' && (
            <div className="lock-panel">
              <div className="lock-panel__header">
                <Lock size={20} className="lock-panel__icon" />
                <div>
                  <div className="lock-panel__title">Masukkan PIN</div>
                  <div className="lock-panel__sub">
                    {pinLocked ? `Dikunci ${lockRemain} detik lagi…` : 'PIN untuk membuka Vault'}
                  </div>
                </div>
              </div>

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

              <div className="lock-panel__links lock-panel__links--row">
                <button className="lock-link" onClick={() => goPanel('master')}>
                  Master Password
                </button>
                <span className="lock-link-dot">·</span>
                <button className="lock-link" onClick={() => goPanel('seed')}>
                  Seed Phrase
                </button>
              </div>
            </div>
          )}

          {/* ── Master Password ── */}
          {panel === 'master' && (
            <div className="lock-panel">
              <div className="lock-panel__header">
                <KeyRound size={20} className="lock-panel__icon" />
                <div>
                  <div className="lock-panel__title">Master Password</div>
                  <div className="lock-panel__sub">Gunakan master password untuk membuka vault</div>
                </div>
              </div>

              {hint && (
                <div className="lock-hint">
                  <span className="lock-hint__label">Petunjuk:</span> {hint}
                </div>
              )}

              <div className="lock-field">
                <div className="lock-pw-wrap">
                  <input
                    className="lock-input"
                    type={masterShow ? 'text' : 'password'}
                    value={masterInput}
                    onChange={(e) => { setMasterInput(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMasterSubmit()}
                    placeholder="Masukkan master password..."
                    autoFocus
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button className="lock-pw-toggle" type="button"
                    onClick={() => setMasterShow((v) => !v)}
                    aria-label={masterShow ? 'Sembunyikan' : 'Tampilkan'}>
                    {masterShow ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <p className="lock-error">{error}</p>}
              </div>

              <button className="btn btn-primary lock-submit-btn"
                onClick={handleMasterSubmit} disabled={loading || !masterInput}>
                {loading ? <><Loader2 size={15} style={{animation:'spin 1s linear infinite'}} /> Membuka…</> : 'Buka Vault'}
              </button>

              <div className="lock-panel__links">
                {hasPinSetup() && (
                  <button className="lock-link" onClick={() => goPanel('pin')}>
                    <ArrowLeft size={13} /> Kembali ke PIN
                  </button>
                )}
                <button className="lock-link" onClick={() => goPanel('seed')}>
                  <KeyRound size={13} /> Masuk via Seed Phrase
                </button>
                <button className="lock-link lock-link--muted" onClick={() => goPanel('recovery')}>
                  <RefreshCw size={12} /> Lupa password?
                </button>
              </div>
            </div>
          )}

          {/* ── Seed Phrase Login ── */}
          {panel === 'seed' && (
            <div className="lock-panel">
              <div className="lock-panel__header">
                <KeyRound size={20} className="lock-panel__icon" />
                <div>
                  <div className="lock-panel__title">Masuk via Seed Phrase</div>
                  <div className="lock-panel__sub">Vault terbuka langsung, data tidak terhapus</div>
                </div>
              </div>

              <div className="lock-seed-info">
                Masukkan seed phrase → vault langsung terbuka dengan semua data utuh.
              </div>

              <div className="lock-field">
                <label className="lock-label">Recovery Phrase (pisahkan spasi)</label>
                <textarea
                  className="lock-textarea"
                  value={seedInput}
                  onChange={(e) => { setSeedInput(e.target.value); setError(''); }}
                  placeholder="kata1 kata2 kata3 kata4 kata5..."
                  rows={3}
                  autoFocus
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  disabled={loading}
                />
                {error && <p className="lock-error">{error}</p>}
              </div>

              <button className="btn btn-primary lock-submit-btn"
                onClick={handleSeedLogin} disabled={loading || !seedInput.trim()}>
                {loading ? <><Loader2 size={15} style={{animation:'spin 1s linear infinite'}} /> Membuka…</> : 'Buka Vault'}
              </button>

              <div className="lock-panel__links">
                <button className="lock-link" onClick={() => goPanel(hasPinSetup() ? 'pin' : 'master')}>
                  <ArrowLeft size={13} /> Kembali
                </button>
                <button className="lock-link lock-link--muted" onClick={() => goPanel('recovery')}>
                  <RefreshCw size={12} /> Reset password
                </button>
              </div>
            </div>
          )}

          {/* ── Recovery ── */}
          {panel === 'recovery' && (
            <div className="lock-panel">
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
            <div className="lock-panel">
              <SetupFlow onComplete={handleSetupComplete} />
            </div>
          )}

          {/* ── Footer ── */}
          {panel !== 'setup' && panel !== 'recovery' && (
            <div className="lock-footer">
              <button className="lock-link lock-link--muted" onClick={() => goPanel('setup')}>
                <Plus size={13} /> Setup Vault Baru
              </button>
              {hasBiometricCredential() && (
                <button
                  className="lock-bio-btn"
                  onClick={() => setShowBiometric(true)}
                  aria-label="Buka dengan sidik jari"
                >
                  <Fingerprint size={22} />
                  <span>Sidik Jari</span>
                </button>
              )}
              {!hasBiometricCredential() && (
                <button className="lock-link lock-link--muted"
                  onClick={() => setShowBiometric(true)} aria-label="Info biometrik">
                  <Fingerprint size={13} /> Biometrik
                </button>
              )}
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
