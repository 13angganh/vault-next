/**
 * components/lock/__tests__/RecoveryPanel.test.tsx — Aurum Vault v2.0.0 (Tahap 3)
 *
 * Regresi butir 6(f): RecoveryPanel memanggil scrollIntoView({behavior:'smooth'}) tanpa menghormati
 * prefers-reduced-motion. Plus: tanpa gaya inline berwarna literal, tanpa tombol "Kembali ke login" ganda.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RecoveryPanel } from '../RecoveryPanel';

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

function focusAndFlush(reduce: boolean | undefined) {
  vi.useFakeTimers();
  const scroll = vi.fn();
  Element.prototype.scrollIntoView = scroll as unknown as Element['scrollIntoView'];
  if (reduce === undefined) {
    (window as unknown as { matchMedia?: unknown }).matchMedia = undefined;
  } else {
    window.matchMedia = ((q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
  }
  render(<RecoveryPanel onSubmit={() => {}} />);
  fireEvent.focus(screen.getByLabelText(/Recovery phrase/));
  act(() => { vi.advanceTimersByTime(350); });
  return scroll;
}

describe('RecoveryPanel — scroll menghormati prefers-reduced-motion (6f)', () => {
  it('reduced-motion aktif: behavior "auto" (tanpa animasi)', () => {
    const scroll = focusAndFlush(true);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
  });
  it('reduced-motion tidak aktif: behavior "smooth"', () => {
    const scroll = focusAndFlush(false);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
  });
  it('tanpa window.matchMedia (lingkungan lama): tidak crash, memakai "smooth"', () => {
    const scroll = focusAndFlush(undefined);
    expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
  });
});

describe('RecoveryPanel — markup', () => {
  it('tidak memuat gaya inline berwarna dan tidak menduplikasi "Kembali ke login"', () => {
    const { container } = render(<RecoveryPanel onSubmit={() => {}} />);
    expect(container.innerHTML).not.toMatch(/style="[^"]*(rgba?\(|#[0-9a-f]{3,6})/i);
    expect(screen.queryByText(/Kembali ke login/)).not.toBeInTheDocument();
  });
  it('tombol Pulihkan Akses nonaktif saat kosong dan memanggil onSubmit dengan frasa ter-trim', () => {
    const onSubmit = vi.fn();
    render(<RecoveryPanel onSubmit={onSubmit} />);
    const btn = screen.getByRole('button', { name: /Pulihkan Akses/ });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Recovery phrase/), { target: { value: '  alpha beta  ' } });
    fireEvent.click(btn);
    expect(onSubmit).toHaveBeenCalledWith('alpha beta');
  });
});
