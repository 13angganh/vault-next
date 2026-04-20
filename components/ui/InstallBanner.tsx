'use client';

import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';

/**
 * InstallBanner — muncul di atas app sebagai header bar tipis.
 * Hilang otomatis jika app sudah terinstall sebagai PWA.
 * Tidak tampil di browser jika display-mode: standalone.
 */
export function InstallBanner() {
  const { isInstalled, isInstallable, triggerInstall } = useInstallPrompt();

  // Jika sudah terinstall atau browser tidak support, sembunyikan
  if (isInstalled || !isInstallable) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-4)',
        height: 40,
        background: 'linear-gradient(90deg, var(--gold-dim) 0%, color-mix(in srgb, var(--gold) 12%, transparent) 100%)',
        borderBottom: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)',
        flexShrink: 0,
        gap: 'var(--space-3)',
        animation: 'slideDown var(--transition-normal) ease both',
      }}
    >
      <span style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        <span style={{ fontSize: 14 }}>🔐</span>
        Pasang Vault untuk akses offline penuh
      </span>

      <button
        onClick={triggerInstall}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid color-mix(in srgb, var(--gold) 50%, transparent)',
          background: 'var(--gold)',
          color: 'var(--bg-root)',
          fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-outfit)',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          letterSpacing: '0.01em',
          transition: 'opacity var(--transition-fast)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
      >
        <Download size={11} />
        Pasang
      </button>
    </div>
  );
}
