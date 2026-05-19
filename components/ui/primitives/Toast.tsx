'use client';

/**
 * components/ui/primitives/Toast.tsx — Vault Next
 * Toast system dengan dua mode:
 *
 * 1. GLOBAL (direkomendasikan): ToastProvider dipasang di AppShell,
 *    komponen manapun cukup import useGlobalToast() — tidak perlu ToastContainer lokal.
 *
 * 2. LOCAL (backward compat): useToast() seperti sebelumnya,
 *    harus render <ToastContainer /> di komponen yang sama.
 *
 * Sesi B — M-05 | v4 upgrade: global context
 */

import { useState, useCallback, useRef, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ToastType } from '@/lib/design-tokens';

interface ToastItem {
  id:      number;
  message: string;
  type:    ToastType;
}

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={15} />,
  error:   <XCircle size={15} />,
  info:    <Info size={15} />,
};

/* ── GLOBAL CONTEXT ─────────────────────────────────────────────────── */

type ShowToastFn = (message: string, type?: ToastType) => void;

const ToastContext = createContext<ShowToastFn | null>(null);

/**
 * Pasang sekali di AppShell. Semua komponen di bawahnya bisa pakai useGlobalToast().
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { showToast, ToastContainer } = useToast();
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Hook global — gunakan di komponen manapun di bawah ToastProvider.
 * Tidak perlu render <ToastContainer /> lokal.
 */
export function useGlobalToast(): ShowToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useGlobalToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}

/* ── LOCAL HOOK (backward compat) ──────────────────────────────────── */

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
