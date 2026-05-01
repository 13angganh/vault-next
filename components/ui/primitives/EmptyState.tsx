'use client';

/**
 * components/ui/primitives/EmptyState.tsx — Vault Next
 * Tampilan kosong: ikon + judul + deskripsi + optional action button.
 *
 * Sesi B — M-05
 */

import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      ReactNode;
  className?:   string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('empty-state', className)}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
