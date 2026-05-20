'use client';

/**
 * components/ui/primitives/Toast.tsx — Vault Next
 * Primitif Toast (refactor dari components/ui/Toast.tsx).
 * Auto-dismiss, slide-in animation, Lucide icons.
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Password disalin!');
 *   showToast('Gagal simpan', 'error');
 *
 * Sesi B — M-05
 */

import { useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ToastType } from '@/lib/design-tokens';

interface ToastItem {
  id:     number;
  message: string;
  type:   ToastType;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  info:    <Info size={15} />,
};

export function useToast(duration = 2200) {
  const [toasts,  setToasts]  = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [duration],
  );

  const ToastContainer = useCallback(() => (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">{ICONS[t.type]}</span>
          <span className="toast__msg">{t.message}</span>
        </div>
      ))}
    </div>
  ), [toasts]);

  return { showToast, ToastContainer };
}
