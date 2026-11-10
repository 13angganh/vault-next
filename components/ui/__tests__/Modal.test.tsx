/**
 * components/ui/__tests__/Modal.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga primitif Modal (dipakai BrandIconPicker, modal backup, dll):
 *  - tampil/sembunyi mengikuti `open`; role=dialog + aria-modal;
 *  - nama aksesibel: judul (aria-labelledby ke <h3>) atau "Dialog" bila tanpa judul;
 *  - header: judul + tombol Tutup; hideClose menyembunyikan Tutup; tanpa judul dan hideClose → tanpa header;
 *  - penutupan: tombol Tutup, Escape (window), klik latar; `persistent` mengabaikan Escape dan latar;
 *    klik di dalam panel tidak menutup; Escape hanya didengarkan saat open dan dilepas saat tutup/unmount;
 *  - ukuran sm (kelas modal--sm), className tambahan, anak di .modal__body;
 *  - kunci gulir body (overflow hidden) saat terbuka dan dilepas saat tutup/unmount.
 *
 * Tidak dikunci: fokus awal/perangkap fokus (useFocusTrap dijaga useFocusTrap.test.tsx; U13/U19),
 * dan scroll-lock yang direset ke '' oleh modal yang menutup walau modal lain masih terbuka.
 *
 * Konvensi: role/label/teks; pengecualian terdokumentasi: panel (.modal / anak pertama dialog) untuk
 * kelas ukuran, dan .modal__body. AnimatePresence → keluarnya dialog diperiksa dengan waitFor.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Modal } from '../primitives/Modal';

type P = Partial<React.ComponentProps<typeof Modal>>;
function renderModal(props: P = {}) {
  const onClose = vi.fn();
  const ui = (p: P) => (
    <Modal open onClose={onClose} title="Judul Uji" {...p}>
      <p>Isi modal</p>
    </Modal>
  );
  const utils = render(ui(props));
  return { onClose, rerenderWith: (p: P) => utils.rerender(ui({ ...props, ...p })), ...utils };
}
const dialog = () => screen.getByRole('dialog');
const panel = () => dialog().firstElementChild as HTMLElement;

beforeEach(() => { document.body.style.overflow = ''; });

describe('Modal — tampil/sembunyi dan semantik', () => {
  it('open=false: tidak ada dialog dan body tidak dikunci', () => {
    renderModal({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('open=true: dialog aria-modal berisi anak; panel bukan overlay', () => {
    renderModal();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(dialog()).toHaveClass('modal-overlay');
    expect(within(dialog()).getByText('Isi modal')).toBeInTheDocument();
    expect(panel()).toHaveClass('modal');
  });

  it('dengan judul: nama aksesibel = judul (aria-labelledby ke <h3>), tanpa aria-label', () => {
    renderModal({ title: 'Pengaturan Backup' });
    expect(dialog()).toHaveAccessibleName('Pengaturan Backup');
    expect(dialog()).not.toHaveAttribute('aria-label');
    const h = screen.getByRole('heading', { level: 3, name: 'Pengaturan Backup' });
    expect(dialog().getAttribute('aria-labelledby')).toBe(h.id);
  });

  it('tanpa judul: aria-label "Dialog" dan tanpa aria-labelledby', () => {
    renderModal({ title: undefined });
    expect(dialog()).toHaveAttribute('aria-label', 'Dialog');
    expect(dialog()).not.toHaveAttribute('aria-labelledby');
    expect(dialog()).toHaveAccessibleName('Dialog');
  });

  it('dua modal bersamaan punya id judul berbeda', () => {
    render(<><Modal open onClose={() => {}} title="A"><i /></Modal><Modal open onClose={() => {}} title="B"><i /></Modal></>);
    const ids = screen.getAllByRole('heading', { level: 3 }).map((h) => h.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('menutup (open → false): dialog keluar setelah animasi', async () => {
    const { rerenderWith } = renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerenderWith({ open: false });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Modal — header dan tombol Tutup', () => {
  it('judul + Tutup (bawaan)', () => {
    renderModal();
    expect(screen.getByRole('heading', { level: 3, name: 'Judul Uji' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeInTheDocument();
  });

  it('hideClose: judul tetap ada, Tutup hilang', () => {
    renderModal({ hideClose: true });
    expect(screen.getByRole('heading', { name: 'Judul Uji' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tutup' })).not.toBeInTheDocument();
  });

  it('tanpa judul: header hanya berisi Tutup', () => {
    renderModal({ title: undefined });
    expect(screen.getByRole('button', { name: 'Tutup' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('tanpa judul DAN hideClose: tanpa header sama sekali', () => {
    const { container } = renderModal({ title: undefined, hideClose: true });
    expect(screen.queryByRole('button', { name: 'Tutup' })).not.toBeInTheDocument();
    expect(container.querySelector('.modal__header')).toBeNull();
    expect(within(dialog()).getByText('Isi modal')).toBeInTheDocument();
  });

  it('tombol Tutup bertipe button (tidak mengirim form)', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Tutup' })).toHaveAttribute('type', 'button');
  });
});

describe('Modal — penutupan', () => {
  it('klik Tutup → onClose sekali', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape (di window) → onClose sekali; tombol lain tidak', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('klik latar (overlay) → onClose; klik di dalam panel/anak TIDAK menutup', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByText('Isi modal'));
    fireEvent.click(panel());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('persistent: Escape dan klik latar DIABAIKAN, tetapi tombol Tutup tetap menutup', () => {
    const { onClose } = renderModal({ persistent: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(dialog());
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape tidak didengarkan saat open=false', () => {
    const { onClose } = renderModal({ open: false });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('pendengar Escape dilepas saat unmount', () => {
    const { onClose, unmount } = renderModal();
    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('onClose baru memakai pendengar terbaru (yang lama tidak lagi dipanggil)', () => {
    const lama = vi.fn();
    const baru = vi.fn();
    const ui = (fn: () => void) => <Modal open onClose={fn} title="T"><i /></Modal>;
    const { rerender } = render(ui(lama));
    rerender(ui(baru));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(lama).not.toHaveBeenCalled();
    expect(baru).toHaveBeenCalledTimes(1);
  });
});

describe('Modal — ukuran, kelas, kunci gulir', () => {
  it('size="sm" → modal--sm; bawaan (md) → tidak; className tambahan ditambahkan', () => {
    const a = renderModal({ size: 'sm', className: 'ekstra' });
    expect(panel()).toHaveClass('modal', 'modal--sm', 'ekstra');
    a.unmount();
    renderModal();
    expect(panel()).toHaveClass('modal');
    expect(panel()).not.toHaveClass('modal--sm');
  });

  it('anak dirender di dalam .modal__body', () => {
    const { container } = renderModal();
    expect(container.querySelector('.modal__body')).toContainElement(screen.getByText('Isi modal'));
  });

  it('gulir body dikunci saat terbuka, dilepas saat ditutup', () => {
    const { rerenderWith } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    rerenderWith({ open: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('gulir body dilepas saat unmount ketika masih terbuka', () => {
    const { unmount } = renderModal();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('dibuka dari awal tertutup: body dikunci tepat saat open menjadi true', () => {
    const { rerenderWith } = renderModal({ open: false });
    expect(document.body.style.overflow).toBe('');
    rerenderWith({ open: true });
    expect(document.body.style.overflow).toBe('hidden');
  });
});
