/**
 * components/ui/__tests__/PanelSheet.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * PanelSheet = sheet panel generik (PIN, Kesehatan Password, dll. dibuka sebagai sheet,
 * bukan halaman/collapsible — keputusan Pengaturan v2). Test menjaga perilaku: dialog
 * modal berlabel, isi tetap interaktif, dan tiga cara menutup (tombol, Escape, latar).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PanelSheet } from '../PanelSheet';

function renderPanel(onClose = vi.fn()) {
  const utils = render(
    <PanelSheet title="Panel Uji" icon={<span data-testid="ikon-panel" />} onClose={onClose}>
      <button type="button">Isi tombol</button>
      <p>Isi paragraf</p>
    </PanelSheet>,
  );
  return { onClose, ...utils };
}

describe('PanelSheet', () => {
  it('dialog modal berlabel judul, memuat ikon dan children, dirender lewat portal ke body', () => {
    const { container } = renderPanel();
    const dialog = screen.getByRole('dialog', { name: 'Panel Uji' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByTestId('ikon-panel')).toBeInTheDocument();
    expect(within(dialog).getByText('Isi paragraf')).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
    expect(document.body).toContainElement(dialog);
  });

  it('tanpa prop icon tetap merender judul dan isi', () => {
    render(<PanelSheet title="Tanpa Ikon" onClose={() => {}}><p>isi</p></PanelSheet>);
    expect(screen.getByRole('dialog', { name: 'Tanpa Ikon' })).toBeInTheDocument();
    expect(screen.queryByTestId('ikon-panel')).not.toBeInTheDocument();
  });

  it('tombol Tutup memanggil onClose', () => {
    const { onClose } = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mengetuk latar gelap menutup; mengetuk isi panel (termasuk tombol di dalamnya) TIDAK menutup', () => {
    const { onClose } = renderPanel();
    const dialog = screen.getByRole('dialog');

    fireEvent.click(screen.getByText('Isi paragraf'));
    fireEvent.click(screen.getByRole('button', { name: 'Isi tombol' }));
    expect(onClose).not.toHaveBeenCalled();

    const overlay = dialog.parentElement;
    if (!overlay) throw new Error('overlay tidak ditemukan');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape menutup; tombol lain diabaikan; setelah unmount Escape tidak lagi memanggil onClose', () => {
    const { onClose, unmount } = renderPanel();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
