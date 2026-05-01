'use client';

/**
 * components/ui/primitives/Input.tsx — Vault Next
 * Input text/password/email/number dengan label opsional dan error state.
 *
 * Sesi B — M-05
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?:   string;
  error?:   string;
  suffix?:  ReactNode;   // icon/button di kanan input
  prefix?:  ReactNode;   // icon di kiri input
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, suffix, prefix, wrapperClassName, className, id, ...rest }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={clsx('field', wrapperClassName)}>
        {label && (
          <label className="field__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className={clsx('field__wrap', { 'field__wrap--has-suffix': !!suffix, 'field__wrap--has-prefix': !!prefix })}>
          {prefix && <span className="field__prefix">{prefix}</span>}
          <input
            ref={ref}
            id={inputId}
            className={clsx({ 'field__input--error': !!error }, className)}
            {...rest}
          />
          {suffix && <span className="field__suffix">{suffix}</span>}
        </div>
        {error && <span className="field__error">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
