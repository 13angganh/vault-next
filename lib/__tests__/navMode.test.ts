/**
 * lib/__tests__/navMode.test.ts — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Kunci BARU vault_nav_mode ("bottom" | "sidebar"), bawaan "bottom" bila ABSEN atau
 * tidak dikenal (tanpa migrasi). Keputusan terkunci: pengguna memilih SATU gaya,
 * tidak pernah tampil dobel — maka mode hanya boleh salah satu dari dua nilai itu.
 * Store membaca localStorage SAAT MODUL DIMUAT, jadi pembacaan awal diuji lewat
 * vi.resetModules() + import dinamis.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function muatModul() {
  vi.resetModules();
  return (await import('@/lib/navMode')).useNavMode;
}

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('useNavMode — pembacaan awal', () => {
  it('ABSEN → "bottom" (bar bawah adalah bawaan)', async () => {
    expect((await muatModul()).getState().mode).toBe('bottom');
  });

  it('vault_nav_mode="sidebar" → "sidebar"', async () => {
    localStorage.setItem('vault_nav_mode', 'sidebar');
    expect((await muatModul()).getState().mode).toBe('sidebar');
  });

  it('vault_nav_mode="bottom" → "bottom"', async () => {
    localStorage.setItem('vault_nav_mode', 'bottom');
    expect((await muatModul()).getState().mode).toBe('bottom');
  });

  it('nilai tak dikenal (mis. "both", "", "Sidebar") → "bottom" — tidak pernah mode ketiga/dobel', async () => {
    for (const aneh of ['both', '', 'Sidebar', 'SIDEBAR', 'left']) {
      localStorage.setItem('vault_nav_mode', aneh);
      expect((await muatModul()).getState().mode, `nilai "${aneh}"`).toBe('bottom');
    }
  });

  it('localStorage melempar galat saat dibaca → "bottom", tanpa crash', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('ditolak'); });
    expect((await muatModul()).getState().mode).toBe('bottom');
  });
});

describe('useNavMode.setMode', () => {
  it('memperbarui state DAN menyimpan ke vault_nav_mode', async () => {
    const store = await muatModul();
    store.getState().setMode('sidebar');
    expect(store.getState().mode).toBe('sidebar');
    expect(localStorage.getItem('vault_nav_mode')).toBe('sidebar');

    store.getState().setMode('bottom');
    expect(store.getState().mode).toBe('bottom');
    expect(localStorage.getItem('vault_nav_mode')).toBe('bottom');
  });

  it('pilihan bertahan lintas muat ulang (modul dimuat ulang membaca nilai tersimpan)', async () => {
    (await muatModul()).getState().setMode('sidebar');
    expect((await muatModul()).getState().mode).toBe('sidebar');
  });

  it('penyimpanan gagal (mode privat) tetap mengubah state sesi ini tanpa melempar galat', async () => {
    const store = await muatModul();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('ditolak'); });
    expect(() => store.getState().setMode('sidebar')).not.toThrow();
    expect(store.getState().mode).toBe('sidebar');
  });
});
