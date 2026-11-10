'use client';

import { useEffect, useId, useState } from 'react';
import { APP_VERSION } from '@/lib/constants';

// ─── VaultIcon SVG — kunci + perisai, aksen gold ──────────────────────────────
export function VaultIcon({ size = 56 }: { size?: number }) {
  const gid = `am${useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="15" y1="11" x2="41" y2="45">
          <stop stopColor="#F7D58B" />
          <stop offset="0.55" stopColor="#E8B04A" />
          <stop offset="1" stopColor="#CF9024" />
        </linearGradient>
      </defs>
      <path d="M15.3 42 L28 12.7 L40.7 42" stroke={`url(#${gid})`} strokeWidth="5.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="30.5" r="3.5" fill="#F7D58B" />
      <path d="M26.4 33.1 H29.6 L30.5 40.1 H25.5 Z" fill="#F7D58B" stroke="#F7D58B" strokeWidth="0.65" strokeLinejoin="round" />
    </svg>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 700 }: LoadingScreenProps) {
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
        zIndex: 'var(--z-top)',
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
          <VaultIcon size={90} />
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
        <span style={{ color: 'var(--gold)', fontWeight: 800 }}>Aurum</span><span style={{ fontWeight: 500 }}> Vault</span>
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
        fontSize: 'var(--text-sm)',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        animation: 'loadingFadeUp 0.6s ease 0.9s both',
      }}>
        v{APP_VERSION}
      </div>
    </div>
  );
}
