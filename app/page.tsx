'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';
import { LockScreen } from '@/components/lock/LockScreen';
import { SetupFlow } from '@/components/lock/SetupFlow';
import { AppShell } from '@/components/shell/AppShell';

export default function Home() {
  const { screen, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (screen === 'loading') {
    return <LoadingScreen duration={1400} onComplete={() => {}} />;
  }

  if (screen === 'setup-pin' || screen === 'setup-master' || screen === 'setup-seed') {
    return <SetupFlow />;
  }

  if (screen === 'lock') {
    return <LockScreen />;
  }

  if (screen === 'unlocked') {
    return <AppShell />;
  }

  return null;
}
