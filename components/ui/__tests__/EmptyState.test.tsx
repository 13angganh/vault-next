/**
 * components/ui/__tests__/EmptyState.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 * EmptyState: layar kosong (Sampah kosong, tidak ada entri di chip cepat, dll.). Hanya
 * judul yang wajib; ikon/deskripsi/aksi opsional dan tidak meninggalkan elemen kosong.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../primitives/EmptyState';

describe('EmptyState', () => {
  it('hanya judul: tidak ada ikon, deskripsi, atau area aksi yang kosong', () => {
    const { container } = render(<EmptyState title="Sampah kosong" />);
    expect(screen.getByText('Sampah kosong')).toBeInTheDocument();
    expect(container.querySelector('.empty-state__icon')).toBeNull();
    expect(container.querySelector('.empty-state__desc')).toBeNull();
    expect(container.querySelector('.empty-state__action')).toBeNull();
  });

  it('ikon, deskripsi, dan aksi tampil bila diberikan; aksi tetap interaktif', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={<span data-testid="ikon" />}
        title="Belum ada entri"
        description="Ketuk + untuk menambah."
        action={<button onClick={onClick}>Tambah entri</button>}
      />,
    );
    expect(screen.getByTestId('ikon')).toBeInTheDocument();
    expect(screen.getByText('Ketuk + untuk menambah.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tambah entri' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('className tambahan ditambahkan tanpa menghilangkan kelas dasar', () => {
    const { container } = render(<EmptyState title="x" className="kustom" />);
    expect(container.firstElementChild).toHaveClass('empty-state', 'kustom');
  });
});
