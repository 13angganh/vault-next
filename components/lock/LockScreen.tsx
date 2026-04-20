'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useTheme } from '@/components/providers/ThemeProvider';
import { PINPad } from './PINPad';
import { MasterPwPanel } from './MasterPwPanel';
import { RecoveryPanel } from './RecoveryPanel';
import { BiometricHintModal } from './BiometricHintModal';

type LockView = 'pin' | 'master-pw' | 'recovery';

// ─── VaultIcon (reusable dari LoadingScreen) ──────────────────────────────────
function VaultIconSmall() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGradLock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0A500" />
          <stop offset="100%" stopColor="#C8860A" />
        </linearGradient>
      </defs>
      <path
        d="M20 2L4 10V20C4 29.3 11 38.1 20 40C29 38.1 36 29.3 36 20V10L20 2Z"
        fill="url(#goldGradLock)"
        opacity="0.15"
        stroke="url(#goldGradLock)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="13" y="19" width="14" height="10" rx="2" fill="url(#goldGradLock)" opacity="0.9" />
      <path
        d="M15 19V15C15 12.8 16.8 11 19 11H21C23.2 11 25 12.8 25 15V19"
        stroke="url(#goldGradLock)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="24" r="1.5" fill="var(--bg-root)" />
    </svg>
  );
}

export function LockScreen() {
  const [view, setView] = useState<LockView>('pin');
  const [showBioModal, setShowBioModal] = useState(false);
  const [rateLockSeconds, setRateLockSeconds] = useState(0);

  const {
    unlockWithPIN,
    unlockWithMasterPW,
    recoverWithSeedPhrase,
    isLoading,
    error,
    clearError,
    isRateLimited,
    getRemainingLockSeconds,
  } = useAuthStore();

  const { theme, toggleTheme } = useTheme();

  // Countdown timer untuk rate limit
  useEffect(() => {
    if (!isRateLimited()) return;
    setRateLockSeconds(getRemainingLockSeconds());
    const interval = setInterval(() => {
      const remaining = getRemainingLockSeconds();
      setRateLockSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRateLimited, getRemainingLockSeconds]);

  const handleViewChange = (newView: LockView) => {
    clearError();
    setView(newView);
  };

  const handlePINComplete = useCallback(async (pin: string) => {
    await unlockWithPIN(pin);
  }, [unlockWithPIN]);

  const handleMasterPW = async (pw: string) => {
    await unlockWithMasterPW(pw);
  };

  const handleRecovery = async (phrase: string, newPIN: string, newMasterPW: string) => {
    await recoverWithSeedPhrase(phrase, newPIN, newMasterPW);
  };

  const isLocked = isRateLimited() && rateLockSeconds > 0;

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-root)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8)',
      position: 'relative',
    }}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute',
          top: 'var(--space-6)',
          right: 'var(--space-6)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all var(--transition-fast)',
        }}
        aria-label="Toggle tema"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Logo + App Name */}
      <div
        className="animate-fade-scale-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-12)',
        }}
      >
        <VaultIconSmall />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-outfit)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Vault
          </h1>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-jetbrains)',
            margin: 0,
            letterSpacing: '0.1em',
          }}>
            PRIVATE VAULT
          </p>
        </div>
      </div>

      {/* Rate limit banner */}
      {isLocked && (
        <div style={{
          padding: 'var(--space-3) var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          color: 'var(--status-danger)',
          fontFamily: 'var(--font-outfit)',
          textAlign: 'center',
        }}>
          Terkunci selama {rateLockSeconds} detik
        </div>
      )}

      {/* Main Content Area */}
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '280px' }}>
        {view === 'pin' && (
          <PINPad
            onComplete={handlePINComplete}
            onBiometric={() => setShowBioModal(true)}
            isLoading={isLoading}
            error={error}
            disabled={isLocked}
            label="Masukkan PIN"
          />
        )}

        {view === 'master-pw' && (
          <MasterPwPanel
            onSubmit={handleMasterPW}
            onBack={() => handleViewChange('pin')}
            isLoading={isLoading}
            error={error}
          />
        )}

        {view === 'recovery' && (
          <RecoveryPanel
            onSubmit={handleRecovery}
            onBack={() => handleViewChange('master-pw')}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>

      {/* Alt Actions */}
      {view === 'pin' && (
        <div style={{
          marginTop: 'var(--space-10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <button
            onClick={() => handleViewChange('master-pw')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-outfit)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'transparent',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Gunakan kata sandi utama
          </button>
          <button
            onClick={() => handleViewChange('recovery')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-outfit)',
              cursor: 'pointer',
              opacity: 0.6,
            }}
          >
            Lupa semua? Pulihkan dengan seed phrase
          </button>
        </div>
      )}

      {/* Version */}
      <p style={{
        position: 'absolute',
        bottom: 'var(--space-6)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-jetbrains)',
        opacity: 0.4,
        letterSpacing: '0.05em',
      }}>
        v1.0
      </p>

      {/* Biometric Modal */}
      {showBioModal && <BiometricHintModal onClose={() => setShowBioModal(false)} />}
    </div>
  );
}
