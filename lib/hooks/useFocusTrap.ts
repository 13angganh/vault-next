'use client';

/**
 * Vault Next — useFocusTrap
 * Trap keyboard focus di dalam elemen container (modal, drawer, dll).
 * Sesi 6: Aksesibilitas — focus tidak boleh keluar modal saat Tab/Shift+Tab.
 */

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * @param active  - aktifkan trap (false = bypass, cocok untuk modal yang belum terbuka)
 * @param onEscape - callback saat user tekan Escape
 * @returns ref yang harus dipasang ke container element
 */
export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onEscape?: () => void,
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;

    // Fokus ke elemen pertama yang bisa difokus saat modal buka
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: kalau di elemen pertama → wrap ke terakhir
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: kalau di elemen terakhir → wrap ke pertama
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, onEscape]);

  return containerRef;
}
