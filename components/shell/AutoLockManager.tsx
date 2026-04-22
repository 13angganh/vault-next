'use client';

/**
 * Vault Next — AutoLockManager
 * Invisible component: track aktivitas user, trigger lock saat idle.
 * Mount satu kali di dalam AppShell saat vault terbuka.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store/appStore';

export function AutoLockManager() {
  const autoLockMinutes = useAppStore((s) => s.autoLockMinutes);
  const lastActivityAt  = useAppStore((s) => s.lastActivityAt);
  const touchActivity   = useAppStore((s) => s.touchActivity);
  const lock            = useAppStore((s) => s.lock);
  const isUnlocked      = useAppStore((s) => s.isUnlocked);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isUnlocked || autoLockMinutes <= 0) return;

    timerRef.current = setTimeout(() => {
      lock();
    }, autoLockMinutes * 60 * 1000);
  }, [isUnlocked, autoLockMinutes, lock]);

  // Reset timer setiap ada aktivitas
  useEffect(() => {
    resetTimer();
  }, [lastActivityAt, resetTimer]);

  // Event listener untuk detect aktivitas
  useEffect(() => {
    if (!isUnlocked) return;

    const events = ['click', 'keydown', 'touchstart', 'mousemove', 'scroll'];
    const handler = () => touchActivity();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [isUnlocked, touchActivity]);

  // Cleanup timer saat unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Juga lock saat tab/window tidak aktif cukup lama
  useEffect(() => {
    if (!isUnlocked || autoLockMinutes <= 0) return;

    const handleVisibilityChange = () => {
      if (document.hidden) return; // user kembali ke tab
      const idleSec = (Date.now() - lastActivityAt) / 1000 / 60;
      if (idleSec >= autoLockMinutes) lock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isUnlocked, autoLockMinutes, lastActivityAt, lock]);

  return null; // invisible
}
