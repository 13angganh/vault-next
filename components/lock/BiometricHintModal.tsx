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
 *  2. Auth: WebAuthn navigator.credentials.get() → onSuccess(masterPw dari sessionStorage)
 *
 * Master password disimpan di sessionStorage (bukan localStorage) —
 * otomatis terhapus saat tab/browser ditutup. Behavior standar banking mobile.
 */

import { useState, useEffect } from 'react';
import { X, Fingerprint, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';

/* ── Constants ── */
const RP_NAME    = 'Vault Next';
const USER_NAME  = 'vault-user';
const USER_ID    = new TextEncoder().encode('vault-next-user-001');
const SS_KEY     = 'vault_ss_mpw';
const LS_CRED    = 'vault_bio_cred';

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
  masterPw?:  string;                 // diperlukan saat mode='register'
  onSuccess?: (masterPw: string) => void; // dipanggil saat auth berhasil
}

export function BiometricHintModal({
  onClose,
  mode = 'auth',
  masterPw,
  onSuccess,
}: BiometricHintModalProps) {
  const [step,    setStep]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const supported = isWebAuthnSupported();

  /* Auto-trigger auth saat modal dibuka dalam mode auth */
  useEffect(() => {
    if (mode === 'auth' && supported) {
      handleAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Register: daftarkan credential baru ── */
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
            { type: 'public-key', alg: -7  },  // ES256
            { type: 'public-key', alg: -257 }, // RS256
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

      /* Simpan credentialId di localStorage */
      const credId = bufToB64(credential.rawId);
      localStorage.setItem(LS_CRED, credId);

      /* Simpan master password di sessionStorage untuk sesi ini */
      sessionStorage.setItem(SS_KEY, masterPw);

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

  /* ── Auth: verifikasi sidik jari ── */
  async function handleAuth() {
    setStep('loading');
    setErrMsg('');
    try {
      const credId = localStorage.getItem(LS_CRED);
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

      /* Ambil master password dari sessionStorage */
      const pw = sessionStorage.getItem(SS_KEY);
      if (!pw) throw new Error('Sesi berakhir. Masuk dengan PIN atau master password sekali lagi untuk mengaktifkan biometrik.');

      setStep('success');
      setTimeout(() => {
        onSuccess?.(pw);
        onClose();
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setErrMsg('Verifikasi biometrik ditolak atau dibatalkan.');
      } else {
        setErrMsg(e.message || 'Verifikasi gagal.');
      }
      setStep('error');
    }
  }

  /* ── Render ── */
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--space-5)',
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
              background: 'rgba(0,212,170,0.1)',
              border: '1px solid rgba(0,212,170,0.2)',
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
            <button className="btn btn-ghost" style={{ marginTop: 'var(--space-4)', width: '100%' }} onClick={onClose}>
              Mengerti
            </button>
          </div>
        )}

        {/* Idle — register */}
        {supported && mode === 'register' && step === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              padding: '10px 12px',
              background: 'rgba(0,212,170,0.06)',
              border: '1px solid rgba(0,212,170,0.18)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--notice-text)',
              lineHeight: 1.7,
            }}>
              <Shield size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Sidik jari disimpan aman di perangkat (tidak dikirim ke server).
              Sesi biometrik aktif hingga browser/tab ditutup.
            </div>
            <button
              className="btn btn-gold"
              style={{ width: '100%', gap: 8, fontSize: 'var(--text-base)', padding: '13px 18px' }}
              onClick={handleRegister}
            >
              <Fingerprint size={18} />
              Daftarkan Sidik Jari
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>
              Batal
            </button>
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
                background: 'rgba(0,212,170,0.08)',
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
              <button className="btn btn-gold" style={{ marginTop: 'var(--space-2)', width: '100%' }} onClick={onClose}>
                Selesai
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px',
              background: 'rgba(255,77,109,0.07)',
              border: '1px solid rgba(255,77,109,0.3)',
              borderRadius: 'var(--radius-md)',
            }}>
              <AlertCircle size={14} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', lineHeight: 1.6 }}>{errMsg}</span>
            </div>
            {mode === 'auth' && (
              <button className="btn btn-gold" style={{ width: '100%', gap: 8 }} onClick={handleAuth}>
                <Fingerprint size={16} /> Coba Lagi
              </button>
            )}
            {mode === 'register' && (
              <button className="btn btn-gold" style={{ width: '100%', gap: 8 }} onClick={handleRegister}>
                <Fingerprint size={16} /> Coba Lagi
              </button>
            )}
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
