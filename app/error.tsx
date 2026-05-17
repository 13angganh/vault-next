'use client';
/* app/error.tsx — Vault Next — Sesi C final */
import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/primitives';
import { Button }     from '@/components/ui/primitives';
import { logger }     from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('App error:', error);
  }, [error]);

  return (
    <div className="app-error-root">
      <ErrorState
        title="Terjadi Kesalahan"
        message={error.message || 'Gagal memuat halaman. Silakan coba lagi.'}
        action={
          <Button variant="gold" onClick={reset}>
            Coba Lagi
          </Button>
        }
      />
    </div>
  );
}
