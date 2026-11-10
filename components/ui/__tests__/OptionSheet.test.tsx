/**
 * components/ui/__tests__/OptionSheet.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * OptionSheet = sheet pilihan vertikal, pengganti dropdown/deretan geser (keputusan desain
 * terkunci: kategori TIDAK BOLEH berupa deretan yang digeser). Dipakai: pemilih kategori &
 * urutan di menu utama, kategori di form entri, Tema/Gaya navigasi/Kunci otomatis/Pengingat
 * backup di Pengaturan. Test menjaga PERILAKU (a11y role, pilih → tutup, cara menutup),
 * bukan bentuk DOM/CSS.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { OptionSheet, type SheetOption } from '../OptionSheet';

const OPSI: SheetOption[] = [
  { id: 'a', label: 'Alfa' },
  { id: 'b', label: 'Bravo', hint: 'petunjuk bravo' },
  { id: 'c', label: 'Charlie', meta: 7 },
];

function renderSheet(props: Partial<React.ComponentProps<typeof OptionSheet>> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <OptionSheet open title="Pilih huruf" options={OPSI} value="b" onSelect={onSelect} onClose={onClose} {...props} />,
  );
  return { onSelect, onClose, ...utils };
}

describe('OptionSheet — tampil/sembunyi', () => {
  it('open=false tidak merender apa pun', () => {
    renderSheet({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('open=true: dialog modal berlabel judul + listbox berisi semua opsi dengan urutan yang diberikan', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog', { name: 'Pilih huruf' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { name: 'Pilih huruf' })).toBeInTheDocument();
    const list = within(dialog).getByRole('listbox', { name: 'Pilih huruf' });
    expect(within(list).getAllByRole('option').map((o) => within(o).getByText(/\S/, { selector: 'b' }).textContent))
      .toEqual(['Alfa', 'Bravo', 'Charlie']);
  });

  it('dirender lewat portal ke document.body (bukan di dalam kontainer pemanggil, agar tidak terjebak transform/overflow induk)', () => {
    const { container } = renderSheet();
    expect(container).toBeEmptyDOMElement();
    expect(document.body).toContainElement(screen.getByRole('dialog'));
  });
});

describe('OptionSheet — isi opsi', () => {
  it('hanya opsi yang cocok dengan `value` bertanda aria-selected=true (dan hanya itu yang menampilkan centang)', () => {
    renderSheet({ value: 'b' });
    const opsi = screen.getAllByRole('option');
    expect(opsi.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(opsi.map((o) => o.querySelectorAll('svg').length)).toEqual([0, 1, 0]);
  });

  it('value yang tidak cocok dengan opsi mana pun → tidak ada yang terpilih', () => {
    renderSheet({ value: 'zzz' });
    for (const o of screen.getAllByRole('option')) expect(o).toHaveAttribute('aria-selected', 'false');
  });

  it('hint, meta, dan ikon opsi ditampilkan bila diberikan', () => {
    renderSheet({
      options: [
        { id: 'a', label: 'Alfa', icon: <span data-testid="ikon-alfa" /> },
        { id: 'b', label: 'Bravo', hint: 'petunjuk bravo' },
        { id: 'c', label: 'Charlie', meta: 0 }, // meta 0 harus tetap tampil (bukan dianggap kosong)
      ],
    });
    expect(screen.getByTestId('ikon-alfa')).toBeInTheDocument();
    expect(screen.getByText('petunjuk bravo')).toBeInTheDocument();
    // meta tampil sebagai elemen penanda tersendiri; "0" mentah (tanpa pembungkus) = kondisi `&&` yang keliru
    expect(screen.getByText('0').tagName).toBe('EM');
  });
});

describe('OptionSheet — memilih dan menutup', () => {
  it('mengetuk opsi memanggil onSelect(id) lalu onClose, masing-masing sekali, dengan urutan itu', () => {
    const urutan: string[] = [];
    renderSheet({
      onSelect: vi.fn((id: string) => { urutan.push(`select:${id}`); }),
      onClose: vi.fn(() => { urutan.push('close'); }),
    });
    fireEvent.click(screen.getByRole('option', { name: /Charlie/ }));
    expect(urutan).toEqual(['select:c', 'close']);
  });

  it('mengetuk opsi yang SUDAH terpilih tetap memanggil onSelect (pemanggil yang memutuskan no-op)', () => {
    const { onSelect, onClose } = renderSheet({ value: 'b' });
    fireEvent.click(screen.getByRole('option', { name: /Bravo/ }));
    expect(onSelect).toHaveBeenCalledWith('b');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tombol Tutup memanggil onClose tanpa memilih apa pun', () => {
    const { onSelect, onClose } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('mengetuk latar gelap (overlay) menutup, tetapi mengetuk isi sheet TIDAK menutup', () => {
    const { onClose } = renderSheet();
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('heading'));
    expect(onClose).not.toHaveBeenCalled();

    const overlay = dialog.parentElement;
    if (!overlay) throw new Error('overlay tidak ditemukan');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape menutup saat terbuka; setelah ditutup/di-unmount Escape tidak lagi memanggil onClose', () => {
    const { onClose, rerender, unmount } = renderSheet();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1); // tombol lain diabaikan

    rerender(<OptionSheet open={false} title="Pilih huruf" options={OPSI} value="b" onSelect={vi.fn()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1); // sheet tertutup → listener dilepas

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
