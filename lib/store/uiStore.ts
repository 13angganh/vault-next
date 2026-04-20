import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 3000
}

export type ActiveMainView = 'vault' | 'export-import' | 'settings';

interface UIState {
  // Toast
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Shorthand helpers
  toast: {
    success: (msg: string, duration?: number) => void;
    error: (msg: string, duration?: number) => void;
    warning: (msg: string, duration?: number) => void;
    info: (msg: string, duration?: number) => void;
  };

  // Main view navigation (sidebar)
  activeMainView: ActiveMainView;
  setActiveMainView: (view: ActiveMainView) => void;

  // Mobile sidebar drawer
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

function generateToastId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  activeMainView: 'vault',
  isSidebarOpen: false,

  // ─── Toast ─────────────────────────────────────────────────────────────────
  addToast: (message, type = 'info', duration = 3000) => {
    const id = generateToastId();
    const toast: Toast = { id, type, message, duration };
    set((s) => ({ toasts: [...s.toasts, toast] }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => set({ toasts: [] }),

  // Shorthand helpers (computed, not stored)
  toast: {
    success: (msg, duration) => get().addToast(msg, 'success', duration),
    error: (msg, duration) => get().addToast(msg, 'error', duration),
    warning: (msg, duration) => get().addToast(msg, 'warning', duration),
    info: (msg, duration) => get().addToast(msg, 'info', duration),
  },

  // ─── Main view ─────────────────────────────────────────────────────────────
  setActiveMainView: (view) => set({ activeMainView: view, isSidebarOpen: false }),

  // ─── Sidebar drawer ────────────────────────────────────────────────────────
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
