'use client';

/**
 * components/ui/primitives/Modal.tsx — Vault Next
 * Modal overlay dasar: backdrop + panel dengan focus trap + Framer Motion animasi.
 * Komponen consumer (BackupModal, BiometricHintModal, dll) wrapping ini.
 *
 * Sesi B — M-05 | F3-03 — animasi via AnimatePresence + motion.div
 */

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

export interface ModalProps {
  open:         boolean;
  onClose:      () => void;
  title?:       string;
  /** sm = 360px, md = 480px (default) */
  size?:        'sm' | 'md';
  children:     ReactNode;
  /** Extra class untuk .modal panel */
  className?:   string;
  /** Sembunyikan tombol × di header */
  hideClose?:   boolean;
  /** Jangan dismiss saat klik backdrop */
  persistent?:  boolean;
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  className,
  hideClose    = false,
  persistent   = false,
}: ModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, persistent]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={persistent ? undefined : onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={trapRef}
            className={clsx(
              'modal',
              size === 'sm' && 'modal--sm',
              className,
            )}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
          >
            {(title || !hideClose) && (
              <div className="modal__header">
                {title && <h3 className="modal__title">{title}</h3>}
                {!hideClose && (
                  <button
                    className="ibtn modal__close"
                    onClick={onClose}
                    aria-label="Tutup"
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
            <div className="modal__body">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
