/**
 * components/ui/__tests__/Toast.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 * useToast: umpan balik singkat (password disalin, gagal simpan, dll.). Menjaga tiga jenis,
 * wilayah aria-live, auto-hilang tepat sesuai durasi (bawaan 2200 ms), dan toast ganda.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useToast } from '../primitives/Toast';

function Harness({ duration }: { duration?: number }) {
  const { showToast, ToastContainer } = useToast(duration);
  return (
    <>
      <button onClick={() => showToast('Berhasil disimpan')}>sukses</button>
      <button onClick={() => showToast('Gagal simpan', 'error')}>galat</button>
      <button onClick={() => showToast('Info penting', 'info')}>info</button>
      <ToastContainer />
    </>
  );
}
const klik = (nama: string) => fireEvent.click(screen.getByRole('button', { name: nama }));

afterEach(() => { vi.useRealTimers(); });

describe('useToast', () => {
  it('wilayah toast berupa aria-live "polite" (dibacakan pembaca layar tanpa menyela)', () => {
    render(<Harness />);
    expect(document.querySelector('.toast-container')).toHaveAttribute('aria-live', 'polite');
  });

  it('jenis bawaan = success; error dan info memakai kelas jenisnya masing-masing', () => {
    render(<Harness />);
    klik('sukses'); klik('galat'); klik('info');
    expect(screen.getByText('Berhasil disimpan').closest('.toast')).toHaveClass('toast--success');
    expect(screen.getByText('Gagal simpan').closest('.toast')).toHaveClass('toast--error');
    expect(screen.getByText('Info penting').closest('.toast')).toHaveClass('toast--info');
  });

  it('toast hilang sendiri tepat setelah durasi bawaan 2200 ms', () => {
    vi.useFakeTimers();
    render(<Harness />);
    klik('sukses');
    expect(screen.getByText('Berhasil disimpan')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2199); });
    expect(screen.getByText('Berhasil disimpan')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText('Berhasil disimpan')).not.toBeInTheDocument();
  });

  it('durasi kustom dihormati', () => {
    vi.useFakeTimers();
    render(<Harness duration={500} />);
    klik('galat');
    act(() => { vi.advanceTimersByTime(499); });
    expect(screen.getByText('Gagal simpan')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByText('Gagal simpan')).not.toBeInTheDocument();
  });

  it('beberapa toast bertumpuk sesuai urutan, pesan sama tetap dua toast, dan hilang masing-masing menurut waktunya', () => {
    vi.useFakeTimers();
    render(<Harness duration={1000} />);
    klik('sukses');
    act(() => { vi.advanceTimersByTime(600); });
    klik('sukses'); // pesan yang sama, toast terpisah
    klik('galat');
    expect(screen.getAllByText('Berhasil disimpan')).toHaveLength(2);
    expect(Array.from(document.querySelectorAll('.toast__msg')).map((e) => e.textContent))
      .toEqual(['Berhasil disimpan', 'Berhasil disimpan', 'Gagal simpan']);

    act(() => { vi.advanceTimersByTime(400); }); // toast pertama (1000 ms) habis, dua lainnya belum
    expect(screen.getAllByText('Berhasil disimpan')).toHaveLength(1);
    expect(screen.getByText('Gagal simpan')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(600); });
    expect(document.querySelectorAll('.toast')).toHaveLength(0);
  });
});
