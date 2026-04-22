'use client';

/**
 * Vault Next — Toast
 * Notifikasi ringan untuk clipboard feedback dll.
 * Auto-dismiss setelah `duration` ms (default 2000).
 *
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast('Password disalin!');
 *   return <ToastContainer />;
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface ToastItem {
  id:      number;
  message: string;
  type?:   'success' | 'error' | 'info';
}

export function useToast(duration = 2000) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
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
            {t.type === 'error' ? '✕' : t.type === 'info' ? 'ℹ' : '✓'}
          </span>
          <span className="toast__msg">{t.message}</span>
        </div>
      ))}
    </div>
  ), [toasts]);

  return { showToast, ToastContainer };
}
