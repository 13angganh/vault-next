'use client';

import { useState, useCallback } from 'react';
import { Sun, Moon, Shield } from 'lucide-react';

import { VaultIcon } from '@/components/LoadingScreen';
import { useTheme } from '@/components/providers/ThemeProvider';
import { MasterPwPanel } from './MasterPwPanel';
import { PINPad } from './PINPad';
import { RecoveryPanel } from './RecoveryPanel';
import { SetupFlow } from './SetupFlow';
import { BiometricHintModal } from './BiometricHintModal';

import {
  unlockVault,
  setupVault,
  setupPin,
  verifyPin,
  hasPinSetup,
  recoverMasterPw,
  hasVaultData,
  getVaultHint,
} from '@/lib/vaultService';
import { useAppStore } from '@/lib/store/appStore';
import type { UnlockPayload } from '@/lib/vaultService';

// ─── Panel type ───────────────────────────────────────────────────────────────
type Panel = 'pin' | 'master' | 'recovery' | 'setup' | 'biometric';

// ─── PIN lockout constants ────────────────────────────────────────────────────
const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS   = 5 * 60 * 1000; // 5 menit

// ─── Component ────────────────────────────────────────────────────────────────

interface LockScreenProps {
  onUnlocked: (payload: UnlockPayload, masterPw: string) => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const store = useAppStore();

  // Tentukan panel awal
  const initialPanel = (): Panel => {
    if (!hasVaultData()) return 'setup';
    if (hasPinSetup()) return 'pin';
    return 'master';
  };

  const [panel, setPanel]         = useState<Panel>(initialPanel);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showBiometric, setShowBiometric] = useState(false);

  // PIN state
  const [pinBuf, setPinBuf]       = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockedUntil, setPinLockedUntil] = useState(0);

  // Setelah recover, simpan master pw untuk re-enkripsi
  const [recoveredPw, setRecoveredPw] = useState('');

  const hint = getVaultHint();
  const pinLocked = Date.now() < pinLockedUntil;
  const pinLockRemain = pinLocked
    ? Math.ceil((pinLockedUntil - Date.now()) / 1000)
    : 0;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const doUnlock = useCallback(async (masterPw: string) => {
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

  // ── Master Password ────────────────────────────────────────────────────────

  const handleMasterSubmit = async (pw: string) => {
    await doUnlock(pw);
  };

  // ── PIN ────────────────────────────────────────────────────────────────────

  const handlePinSubmit = async () => {
    if (pinBuf.length < 4) return;
    setLoading(true);
    setError('');

    const ok = await verifyPin(pinBuf);
    setPinBuf('');

    if (ok) {
      // PIN benar → kita butuh masterPw untuk decrypt vault
      // Simpan flow: PIN hanya shortcut — user perlu juga input masterPw
      // Di sini kita redirect ke master (rare path: PIN tidak bisa standalone unlock)
      // Pada sesi berikutnya bisa disimpan encMasterByPin di storage
      setPanel('master');
      setError('PIN benar! Masukkan master password untuk membuka vault.');
      setLoading(false);
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);

      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        setPinLockedUntil(Date.now() + PIN_LOCKOUT_MS);
        setPinAttempts(0);
        setError('Terlalu banyak percobaan. PIN dikunci 5 menit.');
      } else {
        setError(`PIN salah. ${MAX_PIN_ATTEMPTS - newAttempts} percobaan tersisa.`);
      }
      setLoading(false);
    }
  };

  // ── Recovery ───────────────────────────────────────────────────────────────

  const handleRecoverySubmit = async (phrase: string) => {
    setLoading(true);
    setError('');
    try {
      const masterPw = await recoverMasterPw(phrase);
      setRecoveredPw(masterPw);
      // Langsung unlock
      const payload = await unlockVault(masterPw);
      onUnlocked(payload, masterPw);
    } catch (e) {
      setError((e as Error).message ?? 'Recovery gagal');
      setLoading(false);
    }
  };

  // ── Setup ──────────────────────────────────────────────────────────────────

  const handleSetupComplete = async (masterPw: string, hint: string, recovery: string) => {
    await setupVault({ masterPw, hint, recoveryPhrase: recovery });
    // Langsung unlock setelah setup
    const payload = await unlockVault(masterPw);
    onUnlocked(payload, masterPw);
  };

  // ─────────────────────────────────────────────────────────────────────────

  const panelTitle: Record<Panel, string> = {
    pin:       'Masukkan PIN',
    master:    'Buka Vault',
    recovery:  'Pulihkan Akses',
    setup:     'Buat Vault Baru',
    biometric: '',
  };

  const panelSubtitle: Record<Panel, string> = {
    pin:       'Gunakan PIN 4–6 digit kamu',
    master:    'Terenkripsi · Sepenuhnya offline',
    recovery:  'Gunakan recovery phrase kamu',
    setup:     'Setup sekali, aman selamanya',
    biometric: '',
  };

  return (
    <>
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 'var(--space-6)',
        position: 'relative',
      }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'fixed', top: 16, right: 16,
            width: 36, height: 36,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-s1)',
            color: 'var(--muted2)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            zIndex: 10,
          }}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark'
            ? <Sun size={15} />
            : <Moon size={15} />
          }
        </button>

        {/* Main card */}
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            animation: 'fadeScaleIn 0.4s cubic-bezier(0.34,1.2,0.64,1) both',
          }}
        >
          {/* Logo + Title */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 'var(--space-7)',
            gap: 'var(--space-4)',
          }}>
            {/* Icon */}
            <div style={{
              width: 72, height: 72,
              background: 'linear-gradient(135deg, var(--bg-s2), var(--bg-s3))',
              border: '1.5px solid var(--gold-border)',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px var(--gold-glow)',
              position: 'relative',
            }}>
              <VaultIcon size={42} />
              {/* Setup badge */}
              {panel === 'setup' && (
                <div style={{
                  position: 'absolute', bottom: -6, right: -6,
                  width: 20, height: 20,
                  background: 'var(--teal)',
                  borderRadius: '50%',
                  border: '2px solid var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, color: 'var(--bg)', fontWeight: 800 }}>+</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: 'var(--ls-tight)',
                lineHeight: 1.2,
              }}>
                {panel !== 'setup'
                  ? <>Vault<span style={{ color: 'var(--gold)' }}>.</span></>
                  : <>Selamat Datang</>
                }
              </h1>
              <p style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--muted2)',
                marginTop: 4,
              }}>
                {panelSubtitle[panel]}
              </p>
            </div>
          </div>

          {/* Panel card */}
          <div style={{
            background: 'var(--bg-s1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-7)',
            boxShadow: 'var(--shadow)',
          }}>
            {/* Panel header */}
            {panel !== 'setup' && (
              <div style={{ marginBottom: 'var(--space-5)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  {panelTitle[panel]}
                </div>

                {/* Panel switcher tabs (hanya untuk pin/master) */}
                {(panel === 'pin' || panel === 'master') && hasPinSetup() && hasVaultData() && (
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 'var(--space-3)',
                    background: 'var(--bg-s2)',
                    borderRadius: 'var(--radius-md)',
                    padding: 3,
                  }}>
                    {(['pin', 'master'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPanel(p); setError(''); setPinBuf(''); }}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: panel === p ? 'var(--bg-s3)' : 'transparent',
                          color: panel === p ? 'var(--text)' : 'var(--muted2)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: panel === p ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {p === 'pin' ? '🔢 PIN' : '🔑 Password'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Panel: PIN ── */}
            {panel === 'pin' && (
              <PINPad
                value={pinBuf}
                onDigit={(d) => { setError(''); setPinBuf((b) => b.length < 6 ? b + d : b); }}
                onDelete={() => setPinBuf((b) => b.slice(0, -1))}
                onSubmit={handlePinSubmit}
                disabled={loading}
                locked={pinLocked}
                error={error}
                sublabel={`${hasPinSetup() ? 'Masukkan PIN 4–6 digit' : ''}`}
                lockedLabel={`PIN dikunci ${pinLockRemain}s`}
              />
            )}

            {/* ── Panel: Master Password ── */}
            {panel === 'master' && (
              <MasterPwPanel
                hint={hint}
                loading={loading}
                error={error}
                onSubmit={handleMasterSubmit}
                onShowRecovery={() => { setPanel('recovery'); setError(''); }}
                onShowBiometric={() => setShowBiometric(true)}
              />
            )}

            {/* ── Panel: Recovery ── */}
            {panel === 'recovery' && (
              <RecoveryPanel
                loading={loading}
                error={error}
                onSubmit={handleRecoverySubmit}
                onBack={() => { setPanel('master'); setError(''); }}
              />
            )}

            {/* ── Panel: Setup ── */}
            {panel === 'setup' && (
              <SetupFlow onComplete={handleSetupComplete} />
            )}
          </div>

          {/* Footer: security badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 'var(--space-5)',
          }}>
            <Shield size={12} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              AES-256-GCM · PBKDF2 · 100% Offline
            </span>
          </div>
        </div>
      </div>

      {/* Biometric Modal */}
      {showBiometric && (
        <BiometricHintModal onClose={() => setShowBiometric(false)} />
      )}
    </>
  );
}
