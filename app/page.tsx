'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { LockScreen }    from '@/components/lock/LockScreen';
import { AppShell }      from '@/components/shell/AppShell';
import { useAppStore }   from '@/lib/store/appStore';
import { DUR, EASE }     from '@/lib/animation';
import type { UnlockPayload } from '@/lib/vaultService';

const SPLASH_SHOWN_KEY = 'vault_splash_shown';

export default function Page() {
  const [hydrated,    setHydrated]    = useState(false);
  const [splashDone,  setSplashDone]  = useState(false);
  const [skipSplash,  setSkipSplash]  = useState(false);

  const store      = useAppStore();
  const isUnlocked = useAppStore((s) => s.isUnlocked);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem(SPLASH_SHOWN_KEY);
      if (shown) {
        setSkipSplash(true);
        setSplashDone(true);
      } else {
        sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
        setSkipSplash(false);
      }
    } catch {
      setSkipSplash(true);
      setSplashDone(true);
    } finally {
      setHydrated(true);
    }
  }, []);

  const handleUnlocked = (payload: UnlockPayload, masterPw: string) => {
    store.unlock(masterPw);
    store.setVault(payload.vault);
    store.setRecycleBin(payload.recycleBin);
    store.setVaultMeta(payload.meta);
    store.setLockedIds(payload.lockedIds);
    store.setLockedCatIds(payload.lockedCatIds);
    store.setCustomCats(payload.customCats);
    // v1.10.0: muat override field kategori default — tanpa ini, data
    // tersimpan tapi tidak pernah kembali ke UI setelah reload/unlock
    // ulang (persis kesalahan yang sempat terjadi & diperbaiki untuk
    // lockedCatIds di sesi sebelumnya).
    store.loadDefaultCatFieldOverrides(payload.defaultCatFieldOverrides);
    try { sessionStorage.setItem('vault_ss_mpw', masterPw); } catch {}
  };

  // Sebelum hydration: render div kosong transparan untuk cegah flash konten
  // (lebih baik dari null karena tidak ada layout shift yang terlihat)
  if (!hydrated) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--bg)',
          zIndex: 9998,
        }}
        aria-hidden="true"
      />
    );
  }

  // Splash aktif
  if (!skipSplash && !splashDone) {
    return <LoadingScreen onComplete={() => setSplashDone(true)} />;
  }

  if (isUnlocked) return <AppShell />;

  // LockScreen dengan fade-in halus
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="lockscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.normal, ease: EASE.out }}
        style={{ minHeight: '100dvh' }}
      >
        <LockScreen onUnlocked={handleUnlocked} />
      </motion.div>
    </AnimatePresence>
  );
}
