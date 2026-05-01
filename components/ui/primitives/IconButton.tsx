'use client';

/**
 * components/ui/primitives/IconButton.tsx — Vault Next
 * Square icon button (32x32 default) dengan varian warna.
 *
 * Sesi B — M-05
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ikon Lucide atau ReactNode apapun */
  icon:      ReactNode;
  /** Warna hover: default (gold) | del (red) | lock (blue) */
  colorHover?: 'default' | 'del' | 'lock';
  /** 32px (default) | 28px (sm) */
  size?:     'sm' | 'md';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, colorHover = 'default', size = 'md', className, ...rest }, ref) => {
    const cls = clsx(
      'ibtn',
      'ripple-container',
      {
        'del':         colorHover === 'del',
        'lock-active': colorHover === 'lock',
      },
      size === 'sm' && 'ibtn--sm',
      className,
    );

    return (
      <button ref={ref} className={cls} {...rest}>
        {icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
