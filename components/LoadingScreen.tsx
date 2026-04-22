'use client';

import { useEffect, useState } from 'react';

// ─── VaultIcon SVG — kunci + perisai, aksen gold ──────────────────────────────
export function VaultIcon({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Perisai */}
      <path
        d="M28 4L8 12V28C8 39.5 16.8 48.6 28 52C39.2 48.6 48 39.5 48 28V12L28 4Z"
        fill="url(#shieldGrad)"
        opacity="0.18"
      />
      <path
        d="M28 4L8 12V28C8 39.5 16.8 48.6 28 52C39.2 48.6 48 39.5 48 28V12L28 4Z"
        stroke="url(#strokeGrad)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Badan kunci */}
      <rect
        x="19"
        y="26"
        width="18"
        height="14"
        rx="3"
        fill="url(#lockGrad)"
      />
      {/* Busur kunci */}
      <path
        d="M22 26V21C22 17.686 25 15 28 15C31 15 34 17.686 34 21V26"
        stroke="url(#strokeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lubang kunci */}
      <circle cx="28" cy="32" r="2.5" fill="#07080f" opacity="0.7" />
      <rect x="27" y="33" width="2" height="3" rx="1" fill="#07080f" opacity="0.7" />

      <defs>
        <linearGradient id="shieldGrad" x1="8" y1="4" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0a500" />
          <stop offset="1" stopColor="#ffcc44" />
        </linearGradient>
        <linearGradient id="strokeGrad" x1="8" y1="4" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0a500" />
          <stop offset="1" stopColor="#ffcc44" />
        </linearGradient>
        <linearGradient id="lockGrad" x1="19" y1="26" x2="37" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0a500" />
          <stop offset="1" stopColor="#ffcc44" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2200 }: LoadingScreenProps) {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setHiding(true);
    }, duration - 400);

    const t2 = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hiding ? 0 : 1,
        visibility: hiding ? 'hidden' : 'visible',
        transition: 'opacity 400ms ease, visibility 400ms ease',
      }}
    >
      {/* Logo icon */}
      <div
        style={{
          position: 'relative',
          marginBottom: 32,
          animation: 'loadingLogoPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        }}
      >
        {/* Ring animasi 1 */}
        <div style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          border: '2px solid var(--gold)',
          animation: 'loadingRing 2s ease-in-out 0.5s infinite',
          opacity: 0,
        }} />
        {/* Ring animasi 2 */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          border: '1.5px solid var(--gold)',
          animation: 'loadingRing 2s ease-in-out 0.8s infinite',
          opacity: 0,
        }} />

        {/* Icon container */}
        <div style={{
          width: 96, height: 96,
          background: 'linear-gradient(135deg, var(--bg-s2), var(--bg-s3))',
          borderRadius: 28,
          border: '1.5px solid var(--gold-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--logo-shadow)',
        }}>
          <VaultIcon size={56} />
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 800,
        color: 'var(--text)',
        letterSpacing: 'var(--ls-tight)',
        animation: 'loadingFadeUp 0.6s ease 0.3s both',
      }}>
        Vault<span style={{ color: 'var(--gold)' }}>.</span>
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--muted2)',
        marginTop: 6,
        animation: 'loadingFadeUp 0.6s ease 0.45s both',
      }}>
        Terenkripsi · Sepenuhnya offline
      </div>

      {/* Progress bar */}
      <div style={{
        width: 160, height: 2,
        background: 'var(--border)',
        borderRadius: 2,
        marginTop: 40,
        overflow: 'hidden',
        animation: 'loadingFadeUp 0.6s ease 0.6s both',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, var(--gold), var(--gold2))',
          borderRadius: 2,
          animation: 'loadingProgress 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both',
        }} />
      </div>

      {/* Version */}
      <div style={{
        position: 'absolute', bottom: 28,
        fontSize: 'var(--text-xs)',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        animation: 'loadingFadeUp 0.6s ease 0.9s both',
      }}>
        v1.0
      </div>
    </div>
  );
}
