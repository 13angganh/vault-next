/**
 * lib/hooks/__tests__/useFocusTrap.test.tsx — Vault Next
 * Unit test untuk lib/hooks/useFocusTrap.ts.
 *
 * v1.7.0: sebelumnya `onEscape` ada di dependency array effect utama.
 * Kalau pemanggil (BackupModal dkk) meneruskan closure baru tiap render
 * -- yang bisa terjadi tanpa disadari lewat AutoLockManager yang update
 * lastActivityAt di Zustand di setiap keystroke, memicu re-render parent
 * -- efek utama re-run tiap render itu juga, termasuk firstFocusable?.focus(),
 * yang merebut fokus dari textarea/input yang sedang aktif. Fix: onEscape
 * dipindah ke ref, efek utama hanya bergantung pada `active`.
 */

import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { useState } from 'react';
import { useFocusTrap } from '../useFocusTrap';

function TrapContainer({ onEscape }: { onEscape: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>(true, onEscape);
  return (
    <div ref={ref}>
      <button>first focusable</button>
      <input data-testid="target" />
    </div>
  );
}

describe('useFocusTrap', () => {
  it('does not steal focus when onEscape identity changes but active stays true', () => {
    function Harness() {
      const [, forceRerender] = useState(0);
      // Pola yang sama dengan bug asli: closure baru tiap render Harness,
      // seperti onClose inline `() => setShowBackup(false)` sebelum fix.
      return (
        <>
          <TrapContainer onEscape={() => {}} />
          <button
            data-testid="trigger-parent-rerender"
            onClick={() => forceRerender((n) => n + 1)}
          >
            simulate unrelated parent re-render
          </button>
        </>
      );
    }

    const { getByTestId } = render(<Harness />);

    // User secara manual fokus ke input di dalam modal (mis. textarea sync)
    const target = getByTestId('target') as HTMLInputElement;
    target.focus();
    expect(document.activeElement).toBe(target);

    // Simulasikan parent re-render tanpa terkait (mis. AppShell re-render
    // dari lastActivityAt berubah lewat listener keydown AutoLockManager)
    act(() => {
      getByTestId('trigger-parent-rerender').click();
    });

    // Fokus TIDAK boleh direbut kembali ke elemen pertama
    expect(document.activeElement).toBe(target);
  });

  it('still traps focus to the first focusable element on initial mount', () => {
    const { getByText } = render(<TrapContainer onEscape={() => {}} />);
    expect(document.activeElement).toBe(getByText('first focusable'));
  });

  it('still calls onEscape (latest version) when Escape is pressed', () => {
    let escapeCallCount = 0;

    function Harness() {
      const [, forceRerender] = useState(0);
      const handleEscape = () => { escapeCallCount += 1; };
      return (
        <>
          <TrapContainer onEscape={handleEscape} />
          <button
            data-testid="trigger-parent-rerender"
            onClick={() => forceRerender((n) => n + 1)}
          >
            rerender
          </button>
        </>
      );
    }

    render(<Harness />);

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    expect(escapeCallCount).toBe(1);
  });
});
