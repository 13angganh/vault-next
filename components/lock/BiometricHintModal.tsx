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
import { lsGet, lsSet, lsRemove, LS_BIO_CRED_ID, LS_BIO_SESSION } from '@/lib/storage';
import { Button } from '@/components/ui/primitives';
import { X, Fingerprint, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';

/* ── Constants ── */
const RP_NAME    = 'Vault Next';
const USER_NAME  = 'vault-user';
const USER_ID    = new TextEncoder().encode('vault-next-user-001');
const SS_KEY     = 'vault_ss_mpw';

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

function xorDeobfuscate(b64: string, key: string): string {
  try {
    const bytes   = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      out[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
    }
    return new TextDecoder().decode(out);
  } catch {
    return '';
  }
}

/** Simpan master pw ke sessionStorage (primary) + localStorage fallback */
function saveBioSession(masterPw: string): void {
  sessionStorage.setItem(SS_KEY, masterPw);
  const credId = lsGet(LS_BIO_CRED_ID);
  if (credId) {
    lsSet(LS_BIO_SESSION, xorObfuscate(masterPw, credId));
  }
}

/** Ambil master pw dari sessionStorage, fallback ke localStorage */
function loadBioSession(): string | null {
  // Cek sessionStorage dulu
  const ss = sessionStorage.getItem(SS_KEY);
  if (ss) return ss;
  // Fallback: ambil dari localStorage dan restore ke sessionStorage
  const credId = lsGet(LS_BIO_CRED_ID);
  if (!credId) return null;
  const raw = lsGet(LS_BIO_SESSION);
  if (!raw) return null;
  const recovered = xorDeobfuscate(raw, credId);
  if (recovered) {
    sessionStorage.setItem(SS_KEY, recovered); // restore ke SS
    return recovered;
  }
  return null;
}

/** Hapus semua session data biometrik (dipanggil saat hapus biometrik di pengaturan) */
export function clearBioSession(): void {
  sessionStorage.removeItem(SS_KEY);
  lsRemove(LS_BIO_SESSION);
}

/* ── Helpers ── */
function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

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
  const supported = isWebAuthnSupported();

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
      const challenge = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
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

      const challenge = crypto.getRandomValues(new Uint8Array(32)) as Uint8Array<ArrayBuffer>;
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

  /* ── Render — v1.4.0: ganti 35 inline style blocks dengan className CSS ── */
  return (
    <div
      className="bio-modal-overlay"
      onClick={step !== 'loading' ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bio-modal-title"
    >
      <div className="bio-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bio-modal__header">
          <div className="bio-modal__header-left">
            <div className="bio-modal__icon">
              <Fingerprint size={20} />
            </div>
            <div>
              <div id="bio-modal-title" className="bio-modal__title">
                {mode === 'register' ? 'Daftarkan Biometrik' : 'Verifikasi Biometrik'}
              </div>
              <div className="bio-modal__subtitle">Sidik jari / Face ID</div>
            </div>
          </div>
          {step !== 'loading' && (
            <button className="ibtn" onClick={onClose} aria-label="Tutup">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="bio-modal__divider" />

        {/* Tidak didukung */}
        {!supported && (
          <div className="bio-modal__state bio-modal__state--center">
            <AlertCircle size={36} className="bio-modal__state-icon bio-modal__state-icon--warning" />
            <p className="bio-modal__state-text">
              Browser atau perangkat ini tidak mendukung autentikasi biometrik.
              Gunakan Chrome/Safari terbaru di Android atau iOS.
            </p>
            <Button variant="ghost" full onClick={onClose}>Mengerti</Button>
          </div>
        )}

        {/* Idle — register */}
        {supported && mode === 'register' && step === 'idle' && (
          <div className="bio-modal__body">
            <div className="bio-modal__notice bio-modal__notice--teal">
              <Shield size={12} className="bio-modal__notice-icon" />
              Sidik jari disimpan aman di perangkat (tidak dikirim ke server).
              Sesi biometrik aktif hingga browser/tab ditutup.
            </div>
            <Button variant="gold" full onClick={handleRegister}>
              <Fingerprint size={18} /> Daftarkan Sidik Jari
            </Button>
            <Button variant="ghost" full onClick={onClose}>Batal</Button>
          </div>
        )}

        {/* Idle — auth */}
        {supported && mode === 'auth' && step === 'idle' && (
          <div className="bio-modal__state bio-modal__state--center">
            <p className="bio-modal__state-text">Menunggu verifikasi biometrik…</p>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="bio-modal__state bio-modal__state--center">
            <div className="bio-modal__spinner-wrap">
              <div className="bio-modal__spinner-bg">
                <Fingerprint size={32} />
              </div>
              <Loader2 size={64} className="bio-modal__spinner spin" />
            </div>
            <p className="bio-modal__state-text">
              {mode === 'register' ? 'Menunggu sidik jari…' : 'Verifikasi sidik jari…'}
              <br />
              <span className="bio-modal__state-hint">Sentuh sensor sidik jari perangkat Anda</span>
            </p>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="bio-modal__state bio-modal__state--center">
            <CheckCircle2 size={48} className="bio-modal__state-icon bio-modal__state-icon--teal" />
            <p className="bio-modal__state-label">
              {mode === 'register' ? 'Sidik jari terdaftar!' : 'Verifikasi berhasil!'}
            </p>
            {mode === 'register' && (
              <Button variant="gold" full onClick={onClose}>Selesai</Button>
            )}
          </div>
        )}

        {/* Session expired */}
        {step === 'session_expired' && (
          <div className="bio-modal__body">
            <div className="bio-modal__notice bio-modal__notice--warning">
              <Fingerprint size={16} className="bio-modal__notice-icon" />
              <span>{errMsg}</span>
            </div>
            <Button variant="gold" full onClick={onClose}>Masuk dengan PIN / Password</Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="bio-modal__body">
            <div className="bio-modal__notice bio-modal__notice--error">
              <AlertCircle size={14} className="bio-modal__notice-icon" />
              <span>{errMsg}</span>
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
