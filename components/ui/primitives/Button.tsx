'use client';

/**
 * components/ui/primitives/Button.tsx — Vault Next
 * Komponen button utama dengan semua varian, ukuran, dan ripple effect.
 *
 * Variant : gold | ghost | danger | teal | primary
 * Size    : xs | sm | md (default)
 *
 * Sesi B — M-05
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';
import type { ButtonVariant, ButtonSize } from '@/lib/design-tokens';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  full?:     boolean;
  loading?:  boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'ghost',
      size    = 'md',
      full    = false,
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const cls = clsx(
      'btn',
      'ripple-container',
      {
        'btn-gold':    variant === 'gold',
        'btn--primary': variant === 'primary',
        'btn-ghost':   variant === 'ghost',
        'btn--ghost':  variant === 'ghost',   // alias
        'btn-danger':  variant === 'danger',
        'btn--danger': variant === 'danger',   // alias
        'btn-teal':    variant === 'teal',
        'btn-sm':      size === 'sm',
        'btn-xs':      size === 'xs',
        'btn-full':    full,
      },
      className,
    );

    return (
      <button
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        {...rest}
      >
        {leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        {loading
          ? <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
          : children
        }
        {rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
