'use client';

import { X, Fingerprint, Smartphone, Info } from 'lucide-react';

interface BiometricHintModalProps {
  onClose: () => void;
}

export function BiometricHintModal({ onClose }: BiometricHintModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg-overlay)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--space-5)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-s2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-7)',
          width: '100%',
          maxWidth: 360,
          boxShadow: 'var(--shadow-modal)',
          animation: 'fadeScaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,212,170,0.1)',
              border: '1px solid rgba(0,212,170,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fingerprint size={18} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                Login Biometrik
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted2)' }}>
                Sidik jari / Wajah
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ibtn"
            style={{ color: 'var(--muted2)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 'var(--space-5)' }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Info banner */}
          <div style={{
            padding: '10px 12px',
            background: 'var(--notice-bg)',
            border: '1px solid var(--notice-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <Info size={13} style={{ color: 'var(--notice-text)', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--notice-text)', lineHeight: 1.6 }}>
              Vault Next menyimpan semua data secara <strong>lokal di perangkat</strong>.
              Login biometrik native membutuhkan dukungan dari browser/OS.
            </span>
          </div>

          {/* Steps */}
          {[
            {
              icon: <Smartphone size={15} />,
              title: 'Di perangkat mobile (Android/iOS)',
              desc: 'Gunakan browser yang mendukung WebAuthn. Setelah setup, tekan tombol biometrik untuk login dengan sidik jari atau wajah.',
            },
            {
              icon: <Fingerprint size={15} />,
              title: 'Status fitur',
              desc: 'Biometrik login via WebAuthn dijadwalkan pada Sesi 5. Untuk sekarang, gunakan master password atau PIN sebagai autentikasi.',
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{
                width: 32, height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-s3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--muted2)',
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text2)', marginBottom: 3 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer button */}
        <button
          onClick={onClose}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-5)' }}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
