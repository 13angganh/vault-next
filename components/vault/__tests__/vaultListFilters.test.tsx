/**
 * components/vault/__tests__/vaultListFilters.test.tsx — Aurum Vault v2.0.0 (Tahap 3)
 *
 * Regresi temuan terbuka Tahap 1 (butir 6g), DIREPRODUKSI di Tahap 3 sebelum diperbaiki:
 *  - Filter "Terkunci": memo daftar membaca useAppStore.getState().lockedIds di dalam useMemo tanpa
 *    memasukkannya ke dependensi, sehingga daftar basi saat lockedIds berubah (mis. entri dibuka
 *    kuncinya lewat modal saat chip aktif). Sebelum perbaikan: lockedIds=[] tetap menampilkan entri
 *    lama dan lockedIds=['b'] tidak menampilkan "Beta".
 *  - Empty state saat chip cepat aktif dan hasilnya kosong menampilkan "Vault masih kosong".
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VaultListView } from '../VaultListView';
import { useAppStore } from '@/lib/store/appStore';
import type { VaultEntry, VaultMeta } from '@/lib/types';

const meta: VaultMeta = { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' };
const mk = (id: string, name: string, extra: Partial<VaultEntry> = {}): VaultEntry =>
  ({ id, cat: 'lainnya', name, ts: 1, pass: 'x', ...extra } as VaultEntry);

function setup(lockedIds: string[], vault: VaultEntry[]) {
  useAppStore.setState({
    vault, recycleBin: [], customCats: [], lockedIds, masterPw: 'pw', vaultMeta: meta,
    autoSaveEnabled: false, currentFilter: 'all', searchQuery: '',
  });
}
const visible = () => ['Entri Alpha', 'Entri Beta'].filter((n) => screen.queryByText(n));
const chip = (name: RegExp) => screen.getByRole('button', { name });

describe('VaultListView — filter Terkunci mengikuti lockedIds (6g)', () => {
  beforeEach(() => setup(['a'], [mk('a', 'Entri Alpha'), mk('b', 'Entri Beta')]));

  it('daftar ikut berubah saat lockedIds berubah dengan chip Terkunci aktif', () => {
    render(<VaultListView />);
    fireEvent.click(chip(/Terkunci/));
    expect(visible()).toEqual(['Entri Alpha']);
    act(() => { useAppStore.setState({ lockedIds: [] }); });
    expect(visible()).toEqual([]);
    act(() => { useAppStore.setState({ lockedIds: ['b'] }); });
    expect(visible()).toEqual(['Entri Beta']);
  });
});

describe('VaultListView — empty state mengikuti chip cepat yang aktif', () => {
  it('chip Terkunci tanpa entri terkunci: pesan khusus, bukan "Vault masih kosong"', () => {
    setup([], [mk('a', 'Entri Alpha')]);
    render(<VaultListView />);
    fireEvent.click(chip(/Terkunci/));
    expect(screen.getByText('Belum ada entri terkunci')).toBeInTheDocument();
    expect(screen.queryByText(/Vault masih kosong/)).not.toBeInTheDocument();
  });
  it('chip Favorit tanpa favorit', () => {
    setup([], [mk('a', 'Entri Alpha')]);
    render(<VaultListView />);
    fireEvent.click(chip(/Favorit/));
    expect(screen.getByText('Belum ada favorit')).toBeInTheDocument();
  });
  it('chip Tanpa Pass saat semua entri punya password', () => {
    setup([], [mk('a', 'Entri Alpha')]);
    render(<VaultListView />);
    fireEvent.click(chip(/Tanpa Pass/));
    expect(screen.getByText('Semua entri punya password')).toBeInTheDocument();
  });
});
