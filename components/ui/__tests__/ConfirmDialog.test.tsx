/**
 * components/ui/__tests__/ConfirmDialog.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * ConfirmDialog dipakai untuk semua tindakan yang tidak bisa dibatalkan / berisiko
 * (hapus registrasi biometrik, ganti kategori yang menghapus isian, hapus entri,
 * kunci vault). Test menjaga kontrak perilaku: a11y alertdialog, varian, tiga jalur
 * membatalkan (tombol Batal, ikon X, latar/Escape), status loading, dan kunci scroll.
 * Catatan: ada DUA kontrol bernama "Batal" (ikon X ber-aria-label + tombol footer).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ConfirmDialog, type ConfirmDialogProps } from '../primitives/ConfirmDialog';

function renderDialog(props: Partial<ConfirmDialogProps> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmDialog open title="Hapus entri?" message="Tindakan ini tidak bisa dibatalkan." onConfirm={onConfirm} onCancel={onCancel} {...props} />,
  );
  return { onConfirm, onCancel, ...utils };
}
const tombolBatal = () => within(screen.getByRole('alertdialog')).getByText('Batal'); // tombol footer (bukan ikon X)
const ikonX = () => {
  const x = screen.getAllByRole('button', { name: 'Batal' }).find((b) => b.getAttribute('aria-label') === 'Batal');
  if (!x) throw new Error('ikon X (aria-label "Batal") tidak ditemukan');
  return x;
};

afterEach(() => { document.body.style.overflow = ''; });

describe('ConfirmDialog — tampil & a11y', () => {
  it('open=false tidak merender apa pun', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('alertdialog modal yang namanya = judul (aria-labelledby), dirender lewat portal ke body', () => {
    const { container } = renderDialog();
    const dialog = screen.getByRole('alertdialog', { name: 'Hapus entri?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(container).toBeEmptyDOMElement();
    expect(document.body).toContainElement(dialog);
  });

  it('pesan ditampilkan bila ada; tanpa pesan tidak ada badan pesan', () => {
    const { unmount } = renderDialog();
    expect(screen.getByText('Tindakan ini tidak bisa dibatalkan.')).toBeInTheDocument();
    unmount();
    renderDialog({ message: undefined });
    expect(document.querySelector('.confirm-message')).toBeNull();
  });

  it('menutup (open → false) menghapus dialog dari DOM', async () => {
    const { rerender } = renderDialog();
    rerender(<ConfirmDialog open={false} title="Hapus entri?" onConfirm={() => {}} onCancel={() => {}} />);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });
});

describe('ConfirmDialog — varian', () => {
  it.each([
    ['danger', 'Hapus'],
    ['warning', 'Lanjutkan'],
    ['lock', 'Kunci'],
  ] as const)('varian %s: label konfirmasi bawaan "%s" dan kelas varian terpasang', (variant, label) => {
    renderDialog({ variant });
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: label })).toBeInTheDocument();
    expect(dialog.querySelector(`.confirm-card--${variant}`)).not.toBeNull();
  });

  it('tanpa varian = danger; confirmLabel menimpa label bawaan', () => {
    renderDialog({ confirmLabel: 'Hapus Registrasi' });
    expect(screen.getByRole('button', { name: 'Hapus Registrasi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
    expect(document.querySelector('.confirm-card--danger')).not.toBeNull();
  });
});

describe('ConfirmDialog — mengonfirmasi dan membatalkan', () => {
  it('tombol konfirmasi hanya memanggil onConfirm', () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('tombol footer "Batal" dan ikon X hanya memanggil onCancel', () => {
    const { onConfirm, onCancel } = renderDialog();
    fireEvent.click(tombolBatal());
    fireEvent.click(ikonX());
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('mengetuk latar gelap membatalkan; mengetuk isi kartu TIDAK membatalkan', () => {
    const { onCancel } = renderDialog();
    fireEvent.click(screen.getByText('Tindakan ini tidak bisa dibatalkan.'));
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('alertdialog'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape membatalkan (default dicegah) hanya saat terbuka', () => {
    const { onCancel, rerender } = renderDialog();
    const dilanjutkan = fireEvent.keyDown(window, { key: 'Escape' });
    expect(dilanjutkan).toBe(false); // preventDefault dipanggil
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(<ConfirmDialog open={false} title="x" onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('fokus awal diarahkan ke tombol konfirmasi', async () => {
    renderDialog();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hapus' })).toHaveFocus());
  });
});

describe('ConfirmDialog — loading & kunci scroll', () => {
  it('loading: tombol konfirmasi menampilkan spinner dan konfirmasi/Batal/X dinonaktifkan sehingga tidak bisa dipicu ganda', () => {
    // CATATAN: primitif Button mengganti isi tombol dengan spinner saat loading, jadi teks
    // "Memproses…" milik ConfirmDialog tidak pernah tampil (dilaporkan sebagai USULAN, bukan diubah).
    const { onConfirm, onCancel } = renderDialog({ loading: true });
    const [batal, konfirmasi] = Array.from(document.querySelectorAll<HTMLButtonElement>('.confirm-footer button'));
    expect(konfirmasi.querySelector('.btn__spinner')).not.toBeNull();
    expect(batal).toBeDisabled();
    expect(konfirmasi).toBeDisabled();
    expect(ikonX()).toBeDisabled();
    fireEvent.click(konfirmasi);
    fireEvent.click(ikonX());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('terbuka mengunci scroll halaman (body overflow hidden); ditutup/di-unmount memulihkannya', () => {
    const { unmount, rerender } = renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<ConfirmDialog open={false} title="x" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.body.style.overflow).toBe('');

    rerender(<ConfirmDialog open title="x" onConfirm={() => {}} onCancel={() => {}} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
