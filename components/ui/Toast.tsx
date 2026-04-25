'use client';

/**
 * Vault Next — Toast
 * Notifikasi ringan dengan slide-in animation dan Lucide icons.
 * Auto-dismiss setelah `duration` ms (default 2200).
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Password disalin!');
 *   showToast('Gagal menyimpan', 'error');
 */

import { useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface ToastItem {
  id:      number;
  message: string;
  type?:   'success' | 'error' | 'info';
}

const ICONS = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  info:    <Info size={15} />,
};

export function useToast(duration = 2200) {
  const [toasts,  setToasts]  = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastItem['type'] = 'success') => {
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
        <div key={t.id} className={`toast toast--${t.type ?? 'success'}`}>
          <span className="toast__icon">
            {ICONS[t.type ?? 'success']}
          </span>
          <span className="toast__msg">{t.message}</span>
        </div>
      ))}
    </div>
  ), [toasts]);

  return { showToast, ToastContainer };
}
