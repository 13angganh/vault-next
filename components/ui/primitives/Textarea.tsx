'use client';

/**
 * components/ui/primitives/Textarea.tsx — Vault Next
 * Textarea dengan label dan error state.
 *
 * Sesi B — M-05
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:            string;
  error?:            string;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, wrapperClassName, className, id, ...rest }, ref) => {
    const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={clsx('field', wrapperClassName)}>
        {label && (
          <label className="field__label" htmlFor={textareaId}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx({ 'field__input--error': !!error }, className)}
          {...rest}
        />
        {error && <span className="field__error">{error}</span>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
