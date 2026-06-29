'use client';

/**
 * Vault Next — PINPad
 * Micro-animations PIN dots — bounceIn on fill, shake on error,
 * success flash teal, key press smooth scale.
 *
 * v1.4.4: refactor inline style -> className CSS, tambah Framer Motion
 * untuk dot animation yang lebih smooth dan konsisten.
 */

import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { DUR, EASE } from '@/lib/animation';

interface PINPadProps {
  value:        string;
  maxLen?:      number;
  onDigit:      (d: string) => void;
  onDelete:     () => void;
  onSubmit?:    () => void;
  disabled?:    boolean;
  label?:       string;
  sublabel?:    string;
  error?:       string;
  locked?:      boolean;
  lockedLabel?: string;
  success?:     boolean;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function PINPad({
  value, maxLen = 6,
  onDigit, onDelete, onSubmit,
  disabled, label = 'Masukkan PIN', sublabel, error,
  locked, lockedLabel, success = false,
}: PINPadProps) {
  const prevLen       = useRef(0);
  const dotRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReduced = useReducedMotion();

  /* Keyboard support */
  useEffect(() => {
    if (disabled || locked) return;
    let lastKey = 0;
    const handler = (e: KeyboardEvent) => {
      const now = Date.now();
      if (e.key >= '0' && e.key <= '9') {
        if (now - lastKey > 60) { onDigit(e.key); lastKey = now; }
      } else if (e.key === 'Backspace') {
        onDelete();
      } else if (e.key === 'Enter' && value.length === maxLen) {
        onSubmit?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [disabled, locked, value, maxLen, onDigit, onDelete, onSubmit]);

  /* Auto-submit */
  useEffect(() => {
    if (value.length === maxLen && onSubmit) {
      const t = setTimeout(onSubmit, 80);
      return () => clearTimeout(t);
    }
  }, [value, maxLen, onSubmit]);

  /* Dot bounce animation saat digit ditambah */
  useEffect(() => {
    const newLen = value.length;
    if (!prefersReduced && newLen > prevLen.current && newLen > 0) {
      const dot = dotRefs.current[newLen - 1];
      if (dot) {
        dot.style.animation = 'none';
        void dot.offsetHeight; // force reflow
        dot.style.animation = 'pinDotBounce 0.25s var(--ease-spring) both';
      }
    }
    prevLen.current = newLen;
  }, [value, prefersReduced]);

  const dots = Array.from({ length: maxLen }, (_, i) => i);

  const getDotClass = (i: number): string => {
    const filled = i < value.length;
    if (success && filled) return 'pin-dot pin-dot--success';
    if (error   && filled) return 'pin-dot pin-dot--error';
    return filled ? 'pin-dot pin-dot--filled' : 'pin-dot';
  };

  return (
    <div className="pinpad">

      {/* Label + sublabel + error */}
      <div className="pinpad__label-wrap">
        <div className="pinpad__label">
          {locked ? (lockedLabel ?? 'PIN Terkunci') : label}
        </div>
        {sublabel && !error && (
          <div className="pinpad__sublabel">{sublabel}</div>
        )}
        {error && (
          <div className="pinpad__error">{error}</div>
        )}
      </div>

      {/* PIN Dots */}
      <div className={`pinpad__dots${error ? ' pinpad__dots--shake' : ''}`}>
        {dots.map((i) => (
          <div
            key={i}
            ref={(el) => { dotRefs.current[i] = el; }}
            className={getDotClass(i)}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className={`pinpad__grid${locked || disabled ? ' pinpad__grid--disabled' : ''}`}>
        {KEYS.map((k, idx) => {
          const isEmpty = k === '';
          const isDel   = k === '⌫';
          return (
            <motion.button
              key={idx}
              onClick={() => {
                if (isEmpty) return;
                if (isDel) onDelete();
                else if (value.length < maxLen) onDigit(k);
              }}
              disabled={isEmpty || !!locked || !!disabled}
              className={`pin-key${isEmpty ? ' pin-key--empty' : ''}${isDel ? ' pin-key--del' : ''}`}
              aria-label={isDel ? 'Hapus digit terakhir' : isEmpty ? undefined : `Digit ${k}`}
              whileTap={prefersReduced || isEmpty ? {} : { scale: 0.88 }}
              transition={{ duration: DUR.tap, ease: EASE.out }}
            >
              {isDel ? <Delete size={18} /> : k}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
