'use client';

import { useState, useEffect } from 'react';

/**
 * Hook sederhana untuk deteksi layar mobile (≤768px).
 * Menggunakan matchMedia agar konsisten dengan CSS breakpoint.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
