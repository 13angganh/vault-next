'use client';

import { useState } from 'react';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { LockScreen }    from '@/components/lock/LockScreen';
import { AppShell }      from '@/components/shell/AppShell';
import { useAppStore }   from '@/lib/store/appStore';
import type { UnlockPayload } from '@/lib/vaultService';

export default function Page() {
  const [appReady, setAppReady] = useState(false);
  const store      = useAppStore();
  const isUnlocked = useAppStore((s) => s.isUnlocked);

  const handleUnlocked = (payload: UnlockPayload, masterPw: string) => {
    store.unlock(masterPw);
    store.setVault(payload.vault);
    store.setRecycleBin(payload.recycleBin);
    store.setVaultMeta(payload.meta);
    store.setLockedIds(payload.lockedIds);
    store.setCustomCats(payload.customCats);
    // sessionStorage sudah diisi oleh LockScreen via saveBioSession()
    // sebelum memanggil onUnlocked — tidak perlu diisi lagi di sini
  };

  if (!appReady) {
    return <LoadingScreen onComplete={() => setAppReady(true)} />;
  }

  if (isUnlocked) {
    return <AppShell />;
  }

  return <LockScreen onUnlocked={handleUnlocked} />;
}
