'use client';

import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE } from '@/lib/animation';
import { Button } from '@/components/ui/primitives';
import {
  Sun, Moon, KeyRound, Lock, Fingerprint,
  RefreshCw, ArrowLeft, Plus, Loader2, Eye, EyeOff, ShieldCheck, Hash,
} from 'lucide-react';
import { VaultIcon }          from '@/components/common/LoadingScreen';
import { APP_VERSION }        from '@/lib/constants';
import { useTheme }           from '@/components/providers/ThemeProvider';
import { PINPad }             from './PINPad';
import { getPinLength } from '@/lib/pinLength';
import { RecoveryPanel }      from './RecoveryPanel';
import { SetupFlow }          from './SetupFlow';
import { BiometricHintModal } from './BiometricHintModal';
import { lsGet, lsSet, LS_BIO_CRED_ID, LS_BIO_SESSION } from '@/lib/storage';
import { useAppStore } from '@/lib/store/appStore';
import {
  unlockVault, setupVault, verifyPinAndGetMaster,
  hasPinSetup, recoverMasterPw, hasVaultData, getVaultHint,
} from '@/lib/vaultService';
import type { UnlockPayload } from '@/lib/vaultService';

function hasBiometricCredential(): boolean {
  if (typeof window === 'undefined') return false;
  return !!lsGet(LS_BIO_CRED_ID) && !!window.PublicKeyCredential;  // F2-07
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

  // F2-12: PIN state dari appStore (tidak duplikat)
  const pinBuf         = useAppStore((s) => s.pinBuffer);
  const pinAttempts    = useAppStore((s) => s.pinAttempts);
  const pinLockedUntil = useAppStore((s) => s.pinLockedUntil);
  const appendPin      = useAppStore((s) => s.appendPin);
  const clearPin       = useAppStore((s) => s.clearPin);
  const incrementPinAttempts = useAppStore((s) => s.incrementPinAttempts);
  const _resetPinAttempts    = useAppStore((s) => s.resetPinAttempts);
  const setPinLocked         = useAppStore((s) => s.setPinLocked);
  const [lockRemain,     setLockRemain]     = useState(0);

  const [masterInput, setMasterInput] = useState('');
  const [masterShow,  setMasterShow]  = useState(false);
  const [seedInput,   setSeedInput]   = useState('');

  const hint           = getVaultHint();
  const pinLocked      = Date.now() < pinLockedUntil;
  const prefersReduced = useReducedMotion();

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

  const goPanel = useCallback((p: Panel) => {
    setPanel(p); setError(''); setLoading(false);
    clearPin(); setMasterInput(''); setSeedInput('');
  }, [clearPin]);

  const doUnlockWithMaster = useCallback(async (masterPw: string) => {
    setLoading(true); setError('');
    try {
      const payload = await unlockVault(masterPw);
      // Simpan ke sessionStorage + LS fallback agar sidik jari tetap bekerja setelah background
      sessionStorage.setItem('vault_ss_mpw', masterPw);
      const credId = lsGet(LS_BIO_CRED_ID);
      if (credId) {
        // XOR obfuscate sederhana pakai credId sebagai key
        const textBytes = new TextEncoder().encode(masterPw);
        const keyBytes  = new TextEncoder().encode(credId);
        const out = new Uint8Array(textBytes.length);
        for (let i = 0; i < textBytes.length; i++) out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
        // Chunked, bukan spread sekaligus — hindari stack overflow untuk passphrase panjang
        let outBinary = '';
        for (let i = 0; i < out.length; i += 0x8000) outBinary += String.fromCharCode(...out.subarray(i, i + 0x8000));
        lsSet(LS_BIO_SESSION, btoa(outBinary));
      }
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Password salah');
      setLoading(false);
    }
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
      clearPin();
      await doUnlockWithMaster(masterPw);
      // loading akan tetap true sampai komponen unmount saat vault terbuka — ini normal
    } catch (e) {
      clearPin();
      const msg = (e as Error).message ?? 'PIN salah';
      if (msg.includes('Format PIN lama')) {
        setError('Format PIN lama. Masuk dengan master password, lalu setup ulang PIN.');
        goPanel('master');
      } else {
        incrementPinAttempts();
        const next = pinAttempts + 1;
        if (next >= MAX_PIN_ATTEMPTS) {
          setPinLocked(Date.now() + PIN_LOCKOUT_MS);
          setError('Terlalu banyak percobaan. PIN dikunci 5 menit.');
        } else {
          setError(`PIN salah. ${MAX_PIN_ATTEMPTS - next} percobaan tersisa.`);
        }
      }
      setLoading(false);
    }
  }, [pinBuf, pinLocked, lockRemain, pinAttempts, incrementPinAttempts, setPinLocked, clearPin, doUnlockWithMaster, goPanel]);

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

  // handleSeedLogin: alias ke handleRecoverySubmit (seed panel pakai textarea lokal)
  const handleSeedLogin = () => {
    if (!seedInput.trim()) { setError('Masukkan recovery phrase'); return; }
    handleRecoverySubmit(seedInput.trim());
  };

  const handleSetupComplete = async (masterPw: string, hintStr: string, recovery: string) => {
    await setupVault({ masterPw, hint: hintStr, recoveryPhrase: recovery });
    const payload = await unlockVault(masterPw);
    onUnlocked(payload, masterPw);
  };

  const hasPin   = hasPinSetup();
  const pinLen   = getPinLength();
  const showTabs = panel === 'pin' || panel === 'master' || panel === 'seed';
  const tabs: { id: Panel; label: string; icon: React.ReactNode }[] = [
    ...(hasPin ? [{ id: 'pin' as Panel, label: 'PIN', icon: <Hash size={14} /> }] : []),
    { id: 'master', label: 'Password', icon: <KeyRound size={14} /> },
    { id: 'seed',   label: 'Seed',     icon: <RefreshCw size={14} /> },
  ];
  const subtitle: Record<Panel, string> = {
    pin:      'Masukkan PIN untuk membuka brankas',
    master:   'Masukkan master password kamu',
    seed:     'Masuk dengan 5 kata recovery phrase',
    recovery: 'Pulihkan akses ke brankas',
    setup:    'Buat brankas pribadi yang terenkripsi',
  };

  return (
    <>
      <div className={`ls ls2${panel === 'setup' || panel === 'recovery' ? ' ls2--tall' : ''}${panel === 'pin' ? ' ls2--pin' : ''}`}>
        <div className="ls2-sp" aria-hidden="true" />
        <button className="ls-theme-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="ls2-hero">
          <div className="ls2-logo">
            <VaultIcon size={88} />
          </div>
          <h1 className="ls2-title"><span>Aurum</span> Vault</h1>
          <p className="ls2-sub">{subtitle[panel]}</p>
        </div>

        {showTabs && (
          <div className="ls2-tabs" role="tablist" aria-label="Metode masuk">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={panel === t.id}
                className={`ls2-tab${panel === t.id ? ' ls2-tab--on' : ''}`} onClick={() => goPanel(t.id)}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="ls-card ls2-card">
          <AnimatePresence mode="wait" initial={false}>
          {panel === 'pin' && (
            <motion.div className="ls-panel" key="panel-pin"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: DUR.normal, ease: EASE.out }}>
              {pinLocked && (
                <div className="ls-notice ls-notice--warn">
                  <Lock size={12} />
                  <span>Dikunci {lockRemain} detik lagi…</span>
                </div>
              )}

              <PINPad
                value={pinBuf}
                maxLen={pinLen ?? 8}
                onDigit={(d) => {
                  if (!pinLocked && !loading) {
                    appendPin(d);
                    setError('');
                  }
                }}
                onDelete={() => {
                  if (!pinLocked && !loading) {
                    useAppStore.setState({ pinBuffer: pinBuf.slice(0, -1) });
                    setError('');
                  }
                }}
                onSubmit={handlePinSubmit}
                disabled={loading}
                locked={pinLocked}
                lockedLabel={`Dikunci ${lockRemain} detik lagi…`}
                error={error}
                sublabel={pinLen === null ? 'Ketuk Buka setelah memasukkan PIN' : undefined}
              />
              {pinLen === null && (
                <button type="button" className="btn btn-primary ls2-pin-open" onClick={handlePinSubmit} disabled={loading || pinLocked || pinBuf.length < 4}>Buka</button>
              )}
            </motion.div>
          )}

          {/* ── Master Password ── */}
          {panel === 'master' && (
            <motion.div className="ls-panel" key="panel-master"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: DUR.normal, ease: EASE.out }}>
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
            </motion.div>
          )}

          {/* ── Seed Phrase ── */}
          {panel === 'seed' && (
            <motion.div className="ls-panel" key="panel-seed"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: DUR.normal, ease: EASE.out }}>
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
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint="done"
                  disabled={loading}
                />
                {error && <p className="ls-error">{error}</p>}
              </div>
              <Button variant="gold" full onClick={handleSeedLogin} disabled={loading || !seedInput.trim()}>
                {loading
                  ? <><Loader2 size={14} className="spin" /> Membuka…</>
                  : 'Buka Vault'}
              </Button>
            </motion.div>
          )}

          {/* ── Recovery ── */}
          {panel === 'recovery' && (
            <motion.div className="ls-panel" key="panel-recovery"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: DUR.normal, ease: EASE.out }}>
              <RecoveryPanel
                onSubmit={handleRecoverySubmit}
                onBack={() => goPanel(hasPinSetup() ? 'pin' : 'master')}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {/* ── Setup Baru ── */}
          {panel === 'setup' && (
            <motion.div className="ls-panel" key="panel-setup"
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: DUR.normal, ease: EASE.out }}>
              <SetupFlow onComplete={handleSetupComplete} />
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {showTabs && hasBiometricCredential() && (
          <button className="ls2-bio" onClick={() => setShowBiometric(true)} aria-label="Buka dengan sidik jari">
            <Fingerprint size={20} /><span>Masuk dengan sidik jari</span>
          </button>
        )}

        <div className="ls2-links">
          {panel === 'recovery' || panel === 'setup' ? (
            <button className="ls2-link" onClick={() => goPanel(hasPinSetup() ? 'pin' : 'master')}>
              <ArrowLeft size={13} /> Kembali ke login
            </button>
          ) : (
            <>
              <button className="ls2-link" onClick={() => goPanel('recovery')}><RefreshCw size={13} /> Lupa password?</button>
              <button className="ls2-link" onClick={() => goPanel('setup')}><Plus size={13} /> Vault baru</button>
            </>
          )}
        </div>

        <p className="ls2-note"><ShieldCheck size={13} /> Terenkripsi AES-256 · tanpa server · v{APP_VERSION}</p>
        <div className="ls2-sp" aria-hidden="true" />
      </div>
      {showBiometric && (
        <BiometricHintModal
          mode="auth"
          onClose={() => setShowBiometric(false)}
          onSuccess={async (pw) => { setShowBiometric(false); await doUnlockWithMaster(pw); }}
        />
      )}
    </>
  );
}
