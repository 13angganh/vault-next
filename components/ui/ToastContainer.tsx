'use client';

import { useEffect, useState } from 'react';
import { useUIStore, type Toast, type ToastType } from '@/lib/store/uiStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Config per type ───────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  borderColor: string;
  iconColor: string;
  bg: string;
}> = {
  success: {
    icon: <CheckCircle size={16} />,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    iconColor: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.08)',
  },
  error: {
    icon: <XCircle size={16} />,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    iconColor: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    iconColor: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  info: {
    icon: <Info size={16} />,
    borderColor: 'rgba(96, 165, 250, 0.5)',
    iconColor: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.08)',
  },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useUIStore();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const config = TOAST_CONFIG[toast.type];

  useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleRemove() {
    setLeaving(true);
    setTimeout(() => removeToast(toast.id), 300);
  }

  return (
    <div
      onClick={handleRemove}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: `1px solid ${config.borderColor}`,
        backdropFilter: 'blur(8px)',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: 320,
        minWidth: 220,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',

        // Animation
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(120%)',
        transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Colored left bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: config.iconColor,
        borderRadius: '4px 0 0 4px',
      }} />

      {/* Icon */}
      <span style={{ color: config.iconColor, flexShrink: 0, marginTop: 1 }}>
        {config.icon}
      </span>

      {/* Message */}
      <span style={{
        flex: 1,
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-outfit)',
        color: 'var(--text-primary)',
        lineHeight: 1.4,
      }}>
        {toast.message}
      </span>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleRemove(); }}
        style={{
          color: 'var(--text-muted)',
          flexShrink: 0,
          marginTop: 1,
          display: 'flex',
          cursor: 'pointer',
          padding: 2,
          borderRadius: 'var(--radius-sm)',
          background: 'none',
          border: 'none',
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
