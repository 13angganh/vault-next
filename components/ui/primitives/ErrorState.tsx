'use client';

/**
 * components/ui/primitives/ErrorState.tsx — Vault Next
 * Tampilan error: ikon merah + pesan + optional retry button.
 *
 * Sesi B — M-05
 */

import { AlertCircle } from 'lucide-react';
import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface ErrorStateProps {
  title?:       string;
  message:      string;
  action?:      ReactNode;
  className?:   string;
}

export function ErrorState({
  title   = 'Terjadi Kesalahan',
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={clsx('error-state', className)} role="alert">
      <div className="error-state__icon">
        <AlertCircle size={32} />
      </div>
      <p className="error-state__title">{title}</p>
      <p className="error-state__msg">{message}</p>
      {action && <div className="error-state__action">{action}</div>}
    </div>
  );
}
