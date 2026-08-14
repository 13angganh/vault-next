/**
 * components/settings/__tests__/HealthCheckPanel.test.tsx — Vault Next
 *
 * v1.8.0: tombol "+N masalah lainnya" sebelumnya sebuah <p> statis tanpa
 * onClick atau state apa pun -- mengklik teks itu tidak melakukan apa-apa
 * sama sekali. Test ini memverifikasi tombol sekarang benar-benar
 * membuka daftar lengkap, dan bisa ditutup kembali (toggle dua arah).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HealthCheckPanel } from '../HealthCheckPanel';
import { useAppStore } from '@/lib/store/appStore';
import type { VaultEntry, VaultMeta } from '@/lib/types';

const dummyMeta: VaultMeta = {
  hint: '',
  recoveryHash: '',
  recovery: '',
  encMasterBySeed: '',
};

// 8 entri dengan password lemah (<8 karakter) namun SALING BERBEDA satu
// sama lain -- setiap entri jadi tepat 1 masalah "weak", tidak ada yang
// ter-flag "duplicate" juga, sehingga totalnya deterministik: 8 masalah,
// 2 lebih banyak dari VISIBLE_ISSUES_LIMIT (6) di HealthCheckPanel.
function buildWeakPasswordVault(count: number): VaultEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    cat: 'sosmed',
    name: `Akun ${i}`,
    pass: `pw${i}x`, // 4 karakter, unik per entri, bukan digit-semua
  }));
}

function setupStoreWithVault(vault: VaultEntry[]) {
  useAppStore.setState({
    vault,
    recycleBin: [],
    customCats: [],
    lockedIds: [],
    masterPw: 'dummy-master-pw',
    vaultMeta: dummyMeta,
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('HealthCheckPanel — tombol "+N masalah lainnya" (v1.8.0 fix)', () => {
  it('menampilkan maksimal 6 masalah dan tombol "+2 masalah lainnya" saat ada 8 masalah', () => {
    setupStoreWithVault(buildWeakPasswordVault(8));
    render(<HealthCheckPanel />);

    expect(screen.getAllByText(/^Hanya 4 karakter$/)).toHaveLength(6);
    expect(screen.getByText('+2 masalah lainnya')).toBeInTheDocument();
  });

  it('mengklik tombol menampilkan semua 8 masalah dan mengganti label jadi "Tampilkan lebih sedikit"', () => {
    setupStoreWithVault(buildWeakPasswordVault(8));
    render(<HealthCheckPanel />);

    fireEvent.click(screen.getByText('+2 masalah lainnya'));

    expect(screen.getAllByText(/^Hanya 4 karakter$/)).toHaveLength(8);
    expect(screen.getByText('Tampilkan lebih sedikit')).toBeInTheDocument();
    expect(screen.queryByText('+2 masalah lainnya')).not.toBeInTheDocument();
  });

  it('mengklik tombol dua kali (buka lalu tutup) mengembalikan ke tampilan 6 item semula', () => {
    setupStoreWithVault(buildWeakPasswordVault(8));
    render(<HealthCheckPanel />);

    fireEvent.click(screen.getByText('+2 masalah lainnya'));
    fireEvent.click(screen.getByText('Tampilkan lebih sedikit'));

    expect(screen.getAllByText(/^Hanya 4 karakter$/)).toHaveLength(6);
    expect(screen.getByText('+2 masalah lainnya')).toBeInTheDocument();
  });

  it('tombol "lainnya" TIDAK muncul saat masalah berjumlah 6 atau kurang', () => {
    setupStoreWithVault(buildWeakPasswordVault(6));
    render(<HealthCheckPanel />);

    expect(screen.getAllByText(/^Hanya 4 karakter$/)).toHaveLength(6);
    expect(screen.queryByText(/masalah lainnya/)).not.toBeInTheDocument();
  });

  it('aria-expanded pada tombol mencerminkan state buka/tutup', () => {
    setupStoreWithVault(buildWeakPasswordVault(8));
    render(<HealthCheckPanel />);

    const btn = screen.getByText('+2 masalah lainnya').closest('button');
    expect(btn).not.toBeNull();
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(btn as HTMLButtonElement);
    expect(screen.getByText('Tampilkan lebih sedikit').closest('button'))
      .toHaveAttribute('aria-expanded', 'true');
  });
});
