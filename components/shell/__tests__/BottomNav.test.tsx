/**
 * components/shell/__tests__/BottomNav.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga bar navigasi bawah (gaya navigasi bawaan):
 *  - landmark "Navigasi utama" dengan lima kontrol berurutan: Brankas, Favorit, + (Tambah entri
 *    baru), Sampah, Pengaturan;
 *  - hanya SATU item aktif (aria-current="page"): Brankas untuk filter apa pun selain fav/bin
 *    (termasuk filter kategori), Favorit, Sampah; di Pengaturan hanya Pengaturan yang aktif
 *    walau filter terakhir fav/bin;
 *  - klik Brankas/Favorit/Sampah: onVault dipanggil + filter diset (all/fav/bin); Pengaturan hanya
 *    onSettings (filter tetap); + hanya onAdd (tidak menyentuh filter atau onVault).
 *
 * Konvensi: elemen lewat role/nama. Pengecualian terdokumentasi: kelas penanda aktif bn-item--on
 * (dipakai CSS; dicocokkan dengan aria-current).
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BottomNav } from '../BottomNav';
import { useAppStore } from '@/lib/store/appStore';

function renderNav(shellView: 'vault' | 'settings' = 'vault', filter = 'all') {
  useAppStore.setState({ currentFilter: filter });
  const onVault = vi.fn();
  const onSettings = vi.fn();
  const onAdd = vi.fn();
  const utils = render(<BottomNav shellView={shellView} onVault={onVault} onSettings={onSettings} onAdd={onAdd} />);
  return { onVault, onSettings, onAdd, ...utils };
}
const nav = () => screen.getByRole('navigation', { name: 'Navigasi utama' });
const item = (name: string) => within(nav()).getByRole('button', { name });
const current = () => within(nav()).queryAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.textContent);

beforeEach(() => { useAppStore.setState(useAppStore.getInitialState(), true); });

describe('BottomNav — struktur', () => {
  it('landmark "Navigasi utama" memuat lima kontrol berurutan', () => {
    renderNav();
    const names = within(nav()).getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent);
    expect(names).toEqual(['Brankas', 'Favorit', 'Tambah entri baru', 'Sampah', 'Pengaturan']);
  });

  it('item punya label teks tampil; tombol + hanya berlabel aksesibel', () => {
    renderNav();
    for (const t of ['Brankas', 'Favorit', 'Sampah', 'Pengaturan']) expect(item(t)).toHaveTextContent(t);
    expect(within(nav()).getByRole('button', { name: 'Tambah entri baru' }).textContent).toBe('');
  });
});

describe('BottomNav — item aktif (aria-current)', () => {
  it.each([
    ['vault', 'all', 'Brankas'],
    ['vault', 'fav', 'Favorit'],
    ['vault', 'bin', 'Sampah'],
    ['vault', 'bank', 'Brankas'],
    ['vault', 'sosmed', 'Brankas'],
    ['settings', 'all', 'Pengaturan'],
    ['settings', 'fav', 'Pengaturan'],
    ['settings', 'bin', 'Pengaturan'],
  ] as const)('shellView=%s filter=%s → hanya "%s" aktif', (view, filter, aktif) => {
    renderNav(view, filter);
    expect(current()).toEqual([aktif]);
  });

  it('kelas bn-item--on mengikuti aria-current (tepat satu)', () => {
    const { container } = renderNav('vault', 'fav');
    expect(container.querySelectorAll('.bn-item--on')).toHaveLength(1);
    expect(item('Favorit')).toHaveClass('bn-item--on');
    expect(item('Brankas')).not.toHaveClass('bn-item--on');
  });

  it('tombol + tidak pernah aktif', () => {
    renderNav('vault', 'all');
    expect(within(nav()).getByRole('button', { name: 'Tambah entri baru' })).not.toHaveAttribute('aria-current');
  });
});

describe('BottomNav — klik', () => {
  it.each([
    ['Brankas', 'all'],
    ['Favorit', 'fav'],
    ['Sampah', 'bin'],
  ])('%s → onVault dipanggil sekali dan filter menjadi "%s"', (label, filter) => {
    const { onVault, onSettings, onAdd } = renderNav('vault', 'bank');
    fireEvent.click(item(label));
    expect(onVault).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().currentFilter).toBe(filter);
    expect(onSettings).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('dari Pengaturan, klik Brankas kembali ke vault (onVault) dan filter "all"', () => {
    const { onVault } = renderNav('settings', 'fav');
    fireEvent.click(item('Brankas'));
    expect(onVault).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().currentFilter).toBe('all');
  });

  it('Pengaturan → hanya onSettings; filter TIDAK berubah; onVault tidak dipanggil', () => {
    const { onVault, onSettings, onAdd } = renderNav('vault', 'fav');
    fireEvent.click(item('Pengaturan'));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(onVault).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
    expect(useAppStore.getState().currentFilter).toBe('fav');
  });

  it('+ → hanya onAdd; filter TIDAK berubah; onVault dan onSettings tidak dipanggil', () => {
    const { onVault, onSettings, onAdd } = renderNav('vault', 'bin');
    fireEvent.click(screen.getByRole('button', { name: 'Tambah entri baru' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onVault).not.toHaveBeenCalled();
    expect(onSettings).not.toHaveBeenCalled();
    expect(useAppStore.getState().currentFilter).toBe('bin');
  });
});
