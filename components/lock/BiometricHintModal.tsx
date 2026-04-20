'use client';

import { X, Fingerprint, Smartphone } from 'lucide-react';

interface BiometricHintModalProps {
  onClose: () => void;
}

export function BiometricHintModal({ onClose }: BiometricHintModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 'var(--space-6)',
        animation: 'fadeScaleIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--border-subtle)',
          padding: 'var(--space-8)',
          maxWidth: '320px',
          width: '100%',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-5)',
          textAlign: 'center',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 'var(--space-4)',
            right: 'var(--space-4)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(240, 165, 0, 0.1)',
          border: '1px solid var(--gold-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Fingerprint size={28} color="var(--gold)" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-outfit)',
            margin: 0,
          }}>
            Biometrik
          </h3>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-outfit)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            Autentikasi sidik jari dan Face ID akan hadir di versi berikutnya.
          </p>
        </div>

        {/* Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}>
          <Smartphone size={12} color="var(--text-muted)" />
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-outfit)',
          }}>
            Segera Hadir
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            padding: 'var(--space-3) var(--space-8)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-outfit)',
            cursor: 'pointer',
          }}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
}
