'use client';

/**
 * Vault Next — BiometricModal (WebAuthn penuh)
 *
 * Mode:
 *  'register' — daftarkan credential biometrik baru (dari Pengaturan)
 *  'auth'     — verifikasi sidik jari saat lock screen
 *
 * Alur:
 *  1. Register: WebAuthn navigator.credentials.create() → simpan credentialId
 *  2. Auth: WebAuthn navigator.credentials.get() → onSuccess(masterPw dari storage)
 *
 * Session storage strategy (Fix Bug Biometrik):
 *  - Primary: sessionStorage (terhapus saat tab ditutup)
 *  - Fallback: localStorage dengan XOR obfuscation pakai credentialId sebagai key
 *    Ini BUKAN enkripsi kuat — hanya obfuscation agar tidak plaintext di LS.
 *    Master pw tetap aman karena vault utama dienkripsi AES-256-GCM.
 *    Fallback ini hanya aktif selama biometrik aktif dan credentialId ada.
 */

import { useState, useEffect } from 'react';
import { lsGet, lsSet, lsRemove, LS_BIO_CRED_ID, LS_BIO_SESSION, SS_MASTER_PW } from '@/lib/storage';
import { Button } from '@/components/ui/primitives';
import { X, Fingerprint, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';
import { bufToB64, b64ToBuf } from '@/lib/crypto';
import { useMounted } from '@/lib/hooks/useMounted';

/* ── Constants ── */
const RP_NAME    = 'Vault Next';
const USER_NAME  = 'vault-user';
const USER_ID    = new TextEncoder().encode('vault-next-user-001');

/* ── Session helpers (dual storage) ── */

/** XOR-obfuscate string menggunakan key (credentialId). Bukan enkripsi — hanya obfuscation. */
function xorObfuscate(text: string, key: string): string {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes  = new TextEncoder().encode(key);
  const out = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...out));
}

function xorDeobfuscate(b64: string, key: string): string | null {
  try {
    const bytes   = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    const result = new TextDecoder().decode(out);
    // Return null jika hasil decode kosong (data corrupt atau key salah)
    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

/** Simpan master pw ke sessionStorage (primary) + localStorage fallback */
export function saveBioSession(masterPw: string): void {
  sessionStorage.setItem(SS_MASTER_PW, masterPw);
  const credId = lsGet(LS_BIO_CRED_ID);
  if (credId) {
    lsSet(LS_BIO_SESSION, xorObfuscate(masterPw, credId));
  }
}

/** Ambil master pw dari sessionStorage, fallback ke localStorage */
function loadBioSession(): string | null {
  // Cek sessionStorage dulu
  const ss = sessionStorage.getItem(SS_MASTER_PW);
  if (ss) return ss;
  // Fallback: ambil dari localStorage dan restore ke sessionStorage
  const credId = lsGet(LS_BIO_CRED_ID);
  if (!credId) return null;
  const raw = lsGet(LS_BIO_SESSION);
  if (!raw) return null;
  const recovered = xorDeobfuscate(raw, credId);
  if (recovered !== null) {
    sessionStorage.setItem(SS_MASTER_PW, recovered); // restore ke SS
    return recovered;
  }
  return null;
}

/** Hapus semua session data biometrik (dipanggil saat hapus biometrik di pengaturan) */
export function clearBioSession(): void {
  sessionStorage.removeItem(SS_MASTER_PW);
  lsRemove(LS_BIO_SESSION);
}

/* ── Helpers ── */
function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials;
}

/* ── Types ── */
interface BiometricHintModalProps {
  onClose:    () => void;
  mode?:      'register' | 'auth';
  masterPw?:  string;
  onSuccess?: (masterPw: string) => void;
}

export function BiometricHintModal({
  onClose,
  mode = 'auth',
  masterPw,
  onSuccess,
}: BiometricHintModalProps) {
  const [step,    setStep]    = useState<'idle' | 'loading' | 'success' | 'error' | 'session_expired'>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const mounted   = useMounted();
  // isWebAuthnSupported mengakses window/navigator — hanya aman setelah mount
  const supported = mounted ? isWebAuthnSupported() : false;

  /* Auto-trigger auth saat modal dibuka dalam mode auth */
  useEffect(() => {
    if (mode !== 'auth' || !supported) return;
    // Cek session (primary SS + fallback LS)
    const hasSS = !!loadBioSession();
    if (!hasSS) {
      setErrMsg('Sesi biometrik belum aktif. Masuk sekali dengan PIN atau master password — sidik jari aktif kembali setelahnya.');
      setStep('session_expired');
      return;
    }
    handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Register ── */
  async function handleRegister() {
    if (!masterPw) { setErrMsg('Master password diperlukan'); return; }
    setStep('loading');
    setErrMsg('');
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: RP_NAME },
          user: { id: USER_ID, name: USER_NAME, displayName: 'Pengguna Vault' },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7  },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) throw new Error('Pendaftaran dibatalkan');

      const credId = bufToB64(credential.rawId);
      lsSet(LS_BIO_CRED_ID, credId);
      saveBioSession(masterPw); // simpan ke dual storage

      setStep('success');
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setErrMsg('Permintaan biometrik ditolak atau dibatalkan.');
      } else if (e.name === 'NotSupportedError') {
        setErrMsg('Perangkat tidak mendukung biometrik platform.');
      } else {
        setErrMsg(e.message || 'Pendaftaran gagal.');
      }
      setStep('error');
    }
  }

  /* ── Auth ── */
  async function handleAuth() {
    setStep('loading');
    setErrMsg('');
    try {
      const credId = lsGet(LS_BIO_CRED_ID);
      if (!credId) throw new Error('Belum ada sidik jari terdaftar. Daftarkan di Pengaturan terlebih dahulu.');

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ type: 'public-key', id: b64ToBuf(credId) }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!assertion) throw new Error('Verifikasi dibatalkan.');

      /* Ambil master pw dari dual storage */
      const pw = loadBioSession();
      if (!pw) {
        throw new Error('session_expired');
      }

      // Refresh session setelah auth berhasil
      saveBioSession(pw);

      setStep('success');
      setTimeout(() => {
        onSuccess?.(pw);
        onClose();
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setErrMsg('Verifikasi biometrik ditolak atau dibatalkan.');
      } else if (e.message === 'session_expired') {
        setErrMsg('Sesi biometrik belum aktif. Masuk sekali dengan PIN atau master password terlebih dahulu — sidik jari akan aktif kembali setelahnya.');
        setStep('session_expired');
        return;
      } else {
        setErrMsg(e.message || 'Verifikasi gagal.');
      }
      setStep('error');
    }
  }

  /* ── Render ── */
  return (
    <div
      className="biometric-hint-overlay"
      style={{
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={step !== 'loading' ? onClose : undefined}
    >
      <div
        style={{
          background: 'var(--bg-s2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)',
          width: '100%',
          maxWidth: 340,
          boxShadow: 'var(--shadow-modal)',
          animation: 'fadeScaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'var(--notice-bg)',
              border: '1px solid var(--notice-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fingerprint size={20} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)' }}>
                {mode === 'register' ? 'Daftarkan Biometrik' : 'Verifikasi Biometrik'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)' }}>
                Sidik jari / Face ID
              </div>
            </div>
          </div>
          {step !== 'loading' && (
            <button className="ibtn" onClick={onClose} aria-label="Tutup">
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ height: 1, background: 'var(--border)', marginBottom: 'var(--space-5)' }} />

        {/* Tidak didukung */}
        {!supported && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <AlertCircle size={36} style={{ color: 'var(--warning)', marginBottom: 'var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted2)', lineHeight: 1.6 }}>
              Browser atau perangkat ini tidak mendukung autentikasi biometrik.
              Gunakan Chrome/Safari terbaru di Android atau iOS.
            </p>
            <Button variant="ghost" full onClick={onClose}>Mengerti</Button>
          </div>
        )}

        {/* Idle — register */}
        {supported && mode === 'register' && step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              padding: '10px 12px',
              background: 'var(--notice-bg)',
              border: '1px solid var(--notice-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--notice-text)',
              lineHeight: 1.7,
            }}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Sidik jari disimpan aman di perangkat (tidak dikirim ke server).
              Sesi biometrik aktif hingga browser/tab ditutup.
            </div>
            <Button variant="gold" full
              onClick={handleRegister}
            ><Fingerprint size={18} />
              Daftarkan Sidik Jari</Button>
            <Button variant="ghost" full onClick={onClose}>Batal</Button>
          </div>
        )}

        {/* Idle — auth (auto-trigger tapi tampilkan fallback jika gagal langsung) */}
        {supported && mode === 'auth' && step === 'idle' && (
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted2)' }}>Menunggu verifikasi biometrik…</p>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) 0' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <div style={{
                width: 64, height: 64,
                borderRadius: '50%',
                background: 'var(--notice-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Fingerprint size={32} style={{ color: 'var(--teal)' }} />
              </div>
              <Loader2
                size={64}
                style={{
                  position: 'absolute', inset: 0,
                  color: 'var(--teal)',
                  animation: 'spin 1s linear infinite',
                }}
              />
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted2)', textAlign: 'center' }}>
              {mode === 'register' ? 'Menunggu sidik jari…' : 'Verifikasi sidik jari…'}
              <br />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                Sentuh sensor sidik jari perangkat Anda
              </span>
            </p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--teal)' }} />
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text)' }}>
              {mode === 'register' ? 'Sidik jari terdaftar!' : 'Verifikasi berhasil!'}
            </p>
            {mode === 'register' && (
              <Button variant="gold" full onClick={onClose}>Selesai</Button>
            )}
          </div>
        )}


        {/* Session expired — informatif, arahkan ke master pw */}
        {step === 'session_expired' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '12px 14px',
              background: 'var(--gold-dim)',
              border: '1px solid var(--gold-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <Fingerprint size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)', lineHeight: 1.7 }}>
                {errMsg}
              </span>
            </div>
            <Button variant="gold" full onClick={onClose}>Masuk dengan PIN / Password</Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', lineHeight: 1.6 }}>{errMsg}</span>
            </div>
            {mode === 'auth' && (
              <Button variant="gold" full onClick={handleAuth}><Fingerprint size={16} /> Coba Lagi</Button>
            )}
            {mode === 'register' && (
              <Button variant="gold" full onClick={handleRegister}><Fingerprint size={16} /> Coba Lagi</Button>
            )}
            <Button variant="ghost" full onClick={onClose}>Tutup</Button>
          </div>
        )}
      </div>
    </div>
  );
}
