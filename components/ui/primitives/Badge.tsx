'use client';

/**
 * components/ui/primitives/Badge.tsx — Vault Next
 * Pill badge kecil untuk label kategori, favorit, dsb.
 *
 * Variant: gold | teal | red | muted | blue
 *
 * Sesi B — M-05
 */

import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { BadgeVariant } from '@/lib/design-tokens';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?:    ReactNode;
}

export function Badge({ variant = 'muted', icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx('badge', `badge--${variant}`, className)}
      {...rest}
    >
      {icon && <span className="badge__icon">{icon}</span>}
      {children}
    </span>
  );
}
