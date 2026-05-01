'use client';

/**
 * components/ui/primitives/Toggle.tsx — Vault Next
 * Toggle switch (on/off) — menggantikan semua `.settings-toggle` raw button.
 *
 * Sesi B — M-05
 */

import { type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked:  boolean;
  onChange: (next: boolean) => void;
  label?:   string;
}

export function Toggle({ checked, onChange, label, className, ...rest }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx(
        'settings-toggle',
        { 'settings-toggle--on': checked },
        className,
      )}
      onClick={() => onChange(!checked)}
      type="button"
      {...rest}
    >
      <span className="settings-toggle__knob" />
    </button>
  );
}
