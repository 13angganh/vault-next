/**
 * Vault Next — useRipple
 * Pasang ripple effect ke semua elemen .btn dan .icon-btn via event delegation.
 * Dipanggil sekali di AppShell — tidak perlu dipasang per-komponen.
 */

import { useEffect } from 'react';

export function useRipple() {
  useEffect(() => {
    function createRipple(e: PointerEvent) {
      const target = (e.target as HTMLElement).closest<HTMLElement>('.btn, .icon-btn, .sidebar-item, .lock-bio-btn');
      if (!target) return;

      const rect = target.getBoundingClientRect();

      let clientX: number;
      let clientY: number;
      // Aman di desktop dan mobile — hindari instanceof TouchEvent
      const pe = e as PointerEvent;
      clientX = pe.clientX ?? rect.left + rect.width / 2;
      clientY = pe.clientY ?? rect.top  + rect.height / 2;

      const x    = clientX - rect.left;
      const y    = clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple       = document.createElement('span');
      ripple.className   = 'ripple-effect';
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x - size / 2}px;
        top: ${y - size / 2}px;
      `;

      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    document.addEventListener('pointerdown', createRipple, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', createRipple);
    };
  }, []);
}
