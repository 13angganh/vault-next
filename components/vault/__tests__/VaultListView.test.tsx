/**
 * components/vault/__tests__/VaultListView.test.tsx — Vault Next
 * Test integrasi untuk VaultListView.tsx.
 *
 * File test komponen React PERTAMA di proyek ini (audit Aug 2026 menemukan
 * 0 file .test.tsx meski README v1.6.2/v1.6.3 mengklaim fix masking
 * password "diverifikasi via test isolasi, DOM node identik" -- klaim itu
 * tidak berdasar, sudah dikoreksi di README).
 *
 * Fokus pertama: handleEmptyBin. README v1.6.0 mengklaim rollback+toast
 * error sudah ada untuk alur ini, tapi kode aktualnya `catch {}` kosong
 * total dan toast sukses selalu tampil apa pun hasilnya. Test ini
 * memverifikasi perilaku yang benar setelah fix v1.7.0.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VaultListView } from '../VaultListView';
import { useAppStore } from '@/lib/store/appStore';
import type { VaultEntry, VaultMeta } from '@/lib/types';

const dummyMeta: VaultMeta = {
  hint: '',
  recoveryHash: '',
  recovery: '',
  encMasterBySeed: '',
};

const dummyRecycleBin: VaultEntry[] = [
  {
    id: 'trashed-1',
    cat: 'lainnya',
    name: 'Entri Terhapus',
    ts: Date.now(),
  },
];

function setupStoreWithTrashedEntry() {
  useAppStore.setState({
    vault: [],
    recycleBin: dummyRecycleBin,
    customCats: [],
    lockedIds: [],
    masterPw: 'dummy-master-pw',
    vaultMeta: dummyMeta,
    autoSaveEnabled: true,
    currentFilter: 'bin', // tombol "Kosongkan semua sampah" hanya render di view Sampah
  });
}

beforeEach(() => {
  localStorage.clear();
  setupStoreWithTrashedEntry();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

async function emptyBinViaUI() {
  fireEvent.click(screen.getByLabelText('Kosongkan semua sampah'));
  fireEvent.click(await screen.findByText('Kosongkan Semua'));
}

describe('VaultListView — handleEmptyBin (v1.7.0 fix)', () => {
  it('mengosongkan recycleBin dan menampilkan toast sukses saat saveVault berhasil', async () => {
    render(<VaultListView />);

    await emptyBinViaUI();

    await waitFor(() => {
      expect(useAppStore.getState().recycleBin).toEqual([]);
    });
    expect(await screen.findByText('Sampah dikosongkan')).toBeInTheDocument();
  });

  it('rollback recycleBin dan tampilkan toast error saat saveVault gagal — bukan diam-diam sukses', async () => {
    // Picu kegagalan saveVault dengan cara yang sama seperti storage.test.ts:
    // mock localStorage.setItem agar throw, mensimulasikan kuota penuh.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    render(<VaultListView />);

    await emptyBinViaUI();

    // State harus ROLLBACK ke recycleBin semula, bukan tetap [] --
    // sebelum fix, state ini "berhasil" dikosongkan di memori meski
    // penyimpanan ke disk gagal total.
    await waitFor(() => {
      expect(useAppStore.getState().recycleBin).toEqual(dummyRecycleBin);
    });

    // Toast error harus tampil...
    expect(await screen.findByText('Gagal mengosongkan sampah, coba lagi')).toBeInTheDocument();
    // ...dan toast SUKSES tidak boleh muncul sama sekali. Sebelum fix,
    // 'Sampah dikosongkan' selalu tampil terlepas dari hasil saveVault.
    expect(screen.queryByText('Sampah dikosongkan')).not.toBeInTheDocument();
  });

  it('tidak mencoba saveVault sama sekali saat autoSaveEnabled false — tetap sukses lokal', async () => {
    useAppStore.setState({ autoSaveEnabled: false });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<VaultListView />);
    await emptyBinViaUI();

    await waitFor(() => {
      expect(useAppStore.getState().recycleBin).toEqual([]);
    });
    expect(await screen.findByText('Sampah dikosongkan')).toBeInTheDocument();
    // Tidak ada percobaan tulis ke localStorage dari saveVault jalur ini
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
