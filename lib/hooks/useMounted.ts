/**
 * Vault Next — lib/hooks/useMounted.ts
 * Guard untuk komponen yang bergantung pada client-only data
 * (theme, localStorage, biometric availability, dll).
 * Mencegah hydration mismatch di Next.js.
 */

import { useState, useEffect } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
