/**
 * components/ui/__tests__/Toggle.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 * Toggle = baris saklar (boolean) di Pengaturan & generator password. Kontrak a11y:
 * role=switch + aria-checked + nama dari `label`; mengetuk selalu mengirim nilai kebalikan.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../primitives/Toggle';

describe('Toggle', () => {
  it('role=switch dengan aria-checked mengikuti `checked` dan nama dari `label`', () => {
    const { rerender } = render(<Toggle checked={false} onChange={() => {}} label="Simpan otomatis" />);
    const sw = screen.getByRole('switch', { name: 'Simpan otomatis' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).not.toHaveClass('settings-toggle--on');

    rerender(<Toggle checked onChange={() => {}} label="Simpan otomatis" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch')).toHaveClass('settings-toggle--on');
  });

  it('mengetuk mengirim nilai KEBALIKAN: mati → true, hidup → false', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Toggle checked={false} onChange={onChange} label="x" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<Toggle checked onChange={onChange} label="x" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('komponen terkendali: tanpa perubahan prop `checked`, tampilan tidak berubah sendiri', () => {
    render(<Toggle checked={false} onChange={() => {}} label="x" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('disabled diteruskan: tidak memanggil onChange', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="x" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('type="button": mengetuknya di dalam <form> TIDAK mengirim form', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(<form onSubmit={onSubmit}><Toggle checked={false} onChange={() => {}} label="x" /></form>);
    fireEvent.click(screen.getByRole('switch'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('className tambahan digabung dengan kelas dasar', () => {
    render(<Toggle checked onChange={() => {}} label="x" className="kustom" />);
    expect(screen.getByRole('switch')).toHaveClass('settings-toggle', 'settings-toggle--on', 'kustom');
  });
});
