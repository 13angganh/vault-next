'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
  /** Durasi total loading screen dalam ms (default: 2200) */
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2200 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'loading' | 'exit'>('enter');

  useEffect(() => {
    // Phase enter
    const enterTimer = setTimeout(() => setPhase('loading'), 200);

    // Simulasi progress
    const steps = [
      { target: 30, delay: 300 },
      { target: 60, delay: 700 },
      { target: 80, delay: 1100 },
      { target: 95, delay: 1600 },
      { target: 100, delay: duration - 400 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [enterTimer];

    steps.forEach(({ target, delay }) => {
      timers.push(
        setTimeout(() => setProgress(target), delay)
      );
    });

    // Phase exit
    timers.push(
      setTimeout(() => {
        setPhase('exit');
        setTimeout(() => onComplete?.(), 400);
      }, duration)
    );

    return () => timers.forEach(clearTimeout);
  }, [duration, onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-root)',
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        gap: 'var(--space-8)',
      }}
    >
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />

      {/* Glow halo di belakang icon */}
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)',
          animation: phase === 'loading' ? 'pulseGold 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Icon + Nama */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-5)',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)',
          transition: 'all 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* SVG Icon — kunci + perisai */}
        <div
          style={{
            animation: phase === 'loading' ? 'floatIcon 3s ease-in-out infinite' : 'none',
          }}
        >
          <VaultIcon size={72} />
        </div>

        {/* App name */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-outfit, Outfit, sans-serif)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--fw-display)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Vault
            <span style={{ color: 'var(--gold)' }}> Next</span>
          </h1>
          <p
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-label)',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            v1.0
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '200px',
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1) 200ms',
        }}
      >
        {/* Track */}
        <div
          style={{
            width: '100%',
            height: '2px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          {/* Fill */}
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(90deg, var(--gold) 0%, #FFD166 100%)',
              boxShadow: '0 0 8px var(--gold-glow)',
              transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Progress text */}
        <p
          style={{
            marginTop: 'var(--space-3)',
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-label)',
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-jetbrains, JetBrains Mono, monospace)',
          }}
        >
          {progress < 100 ? 'Memuat...' : 'Siap'}
        </p>
      </div>
    </div>
  );
}

/* === SVG Icon: kunci di dalam perisai === */
function VaultIcon({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vault Next icon"
    >
      {/* Perisai */}
      <path
        d="M32 4L8 14V34C8 47 18.5 58.5 32 62C45.5 58.5 56 47 56 34V14L32 4Z"
        fill="url(#shieldGrad)"
        stroke="url(#shieldBorder)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Perisai inner rim */}
      <path
        d="M32 10L13 18.5V34C13 44.5 21.5 54 32 57.5C42.5 54 51 44.5 51 34V18.5L32 10Z"
        fill="url(#shieldInner)"
        opacity="0.5"
      />
      {/* Kunci — body */}
      <rect
        x="22"
        y="32"
        width="20"
        height="14"
        rx="3"
        fill="url(#keyBodyGrad)"
        stroke="rgba(240,165,0,0.4)"
        strokeWidth="0.75"
      />
      {/* Kunci — lubang kunci */}
      <circle cx="32" cy="38" r="3" fill="rgba(6,7,14,0.7)" />
      <rect x="30.5" y="38" width="3" height="4" rx="1" fill="rgba(6,7,14,0.7)" />
      {/* Kunci — pegangan */}
      <path
        d="M26 32V27C26 22.6 29.1 19 32 19C34.9 19 38 22.6 38 27V32"
        stroke="url(#keyHandleGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      <defs>
        <linearGradient id="shieldGrad" x1="32" y1="4" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A1F2E" />
          <stop offset="100%" stopColor="#0D0F1A" />
        </linearGradient>
        <linearGradient id="shieldBorder" x1="8" y1="4" x2="56" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(240,165,0,0.6)" />
          <stop offset="50%" stopColor="rgba(240,165,0,0.2)" />
          <stop offset="100%" stopColor="rgba(240,165,0,0.5)" />
        </linearGradient>
        <linearGradient id="shieldInner" x1="32" y1="10" x2="32" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(240,165,0,0.15)" />
          <stop offset="100%" stopColor="rgba(240,165,0,0.02)" />
        </linearGradient>
        <linearGradient id="keyBodyGrad" x1="22" y1="32" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0A500" />
          <stop offset="100%" stopColor="#C8860A" />
        </linearGradient>
        <linearGradient id="keyHandleGrad" x1="26" y1="19" x2="38" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F0A500" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export { VaultIcon };
