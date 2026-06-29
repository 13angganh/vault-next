'use client';

/**
 * components/ui/primitives/ConfirmDialog.tsx — Vault Next
 * Modal konfirmasi universal untuk semua aksi destruktif.
 *
 * Digunakan di:
 *  - EntryCard: hapus (ke sampah), hapus permanen, lock/unlock, fav toggle
 *  - CategoryManager: hapus kategori custom
 *  - SettingsView: hapus registrasi biometrik, kunci vault sekarang
 *  - PINSettingsPanel: hapus PIN
 *  - VaultListView: (future) kosongkan sampah
 *
 * v1.2.0 — fitur baru, tidak ada breaking change
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Trash2, Lock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';
import { EASE } from '@/lib/animation';

export type ConfirmVariant = 'danger' | 'warning' | 'lock';

export interface ConfirmDialogProps {
  /** Tampilkan atau sembunyikan dialog */
  open: boolean;
  /** Callback saat user klik tombol konfirmasi */
  onConfirm: () => void;
  /** Callback saat user batal / klik backdrop / Escape */
  onCancel: () => void;
  /** Judul dialog — muncul di header */
  title: string;
  /** Deskripsi — kalimat konfirmasi (bisa JSX) */
  message?: ReactNode;
  /** Label tombol konfirmasi — default sesuai variant */
  confirmLabel?: string;
  /** Varian visual: danger (merah), warning (kuning), lock (gold) */
  variant?: ConfirmVariant;
  /** Disable tombol konfirmasi saat proses async */
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger:  { icon: <Trash2  size={18} />, btnVariant: 'danger'  as const, defaultLabel: 'Hapus'   },
  warning: { icon: <AlertTriangle size={18} />, btnVariant: 'danger' as const, defaultLabel: 'Lanjutkan' },
  lock:    { icon: <Lock    size={18} />, btnVariant: 'gold'   as const, defaultLabel: 'Kunci'   },
} satisfies Record<ConfirmVariant, { icon: ReactNode; btnVariant: 'danger' | 'gold'; defaultLabel: string }>;

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const prefersReduced = useReducedMotion();
  const confirmRef     = useRef<HTMLButtonElement>(null);
  const cfg            = VARIANT_CONFIG[variant];

  /* Focus tombol konfirmasi saat dialog buka */
  useEffect(() => {
    if (open) {
      // Slight delay agar animasi sudah mulai sebelum fokus
      const t = setTimeout(() => confirmRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  /* Body scroll lock */
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="confirm-overlay"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.15 }}
        >
          <motion.div
            className={clsx('confirm-card', `confirm-card--${variant}`)}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.93, y: prefersReduced ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.93, y: prefersReduced ? 0 : 10 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: EASE.cubicOut }}
          >
            {/* Header */}
            <div className="confirm-header">
              <span className={`confirm-icon confirm-icon--${variant}`}>
                {cfg.icon}
              </span>
              <span id="confirm-title" className="confirm-title">{title}</span>
              <button
                className="confirm-close"
                onClick={onCancel}
                aria-label="Batal"
                type="button"
                disabled={loading}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            {message && (
              <div className="confirm-body">
                <p className="confirm-message">{message}</p>
              </div>
            )}

            {/* Footer */}
            <div className="confirm-footer">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                ref={confirmRef}
                variant={cfg.btnVariant}
                size="sm"
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Memproses…' : (confirmLabel ?? cfg.defaultLabel)}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
