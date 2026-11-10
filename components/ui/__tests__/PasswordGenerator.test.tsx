/**
 * components/ui/__tests__/PasswordGenerator.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Generator password bawaan: slider panjang 8–64, tiga saklar (huruf besar, angka, simbol),
 * pratinjau + meter kekuatan, salin, buat ulang, "Pakai". Tahap 3 mengganti <button> mentah
 * dengan primitif Toggle (role=switch) — test ini menjaga bahwa saklar benar-benar mengatur
 * komposisi password. Karena keluarannya acak, properti diperiksa pada banyak pembangkitan
 * (klik "Buat ulang" berulang), bukan pada satu nilai.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordGenerator } from '../PasswordGenerator';

const pw = () => (document.querySelector('.pw-gen__pw') as HTMLElement).textContent ?? '';
const saklar = (label: string) => screen.getByRole('switch', { name: label });
const buatUlang = () => fireEvent.click(screen.getByRole('button', { name: 'Buat ulang' }));
const SIMBOL = /[!@#$%^&*()\-_=+[\]{}|;:,.<>?]/;

function pasangClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

afterEach(() => { vi.restoreAllMocks(); });

describe('PasswordGenerator — keadaan awal', () => {
  it('langsung menampilkan password 16 karakter; slider 8–64; ketiga saklar aktif', () => {
    render(<PasswordGenerator />);
    expect(pw()).toHaveLength(16);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '8');
    expect(slider).toHaveAttribute('max', '64');
    expect(slider).toHaveValue('16');
    for (const l of ['Huruf Besar (A–Z)', 'Angka (0–9)', 'Simbol (!@#…)']) {
      expect(saklar(l)).toHaveAttribute('aria-checked', 'true');
    }
  });

  it('meter kekuatan tampil: 16 karakter 4 tipe = "Luar Biasa"', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText('Luar Biasa')).toBeInTheDocument();
  });
});

describe('PasswordGenerator — panjang', () => {
  it('menggeser slider mengubah panjang password dan angka yang ditampilkan', () => {
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '24' } });
    expect(pw()).toHaveLength(24);
    expect(screen.getByText('24')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    expect(pw()).toHaveLength(8);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '64' } });
    expect(pw()).toHaveLength(64);
  });
});

describe('PasswordGenerator — saklar komposisi', () => {
  it('semua saklar aktif: SETIAP pembangkitan memuat huruf besar, angka, dan simbol (dijamin, bahkan pada panjang minimum 8)', () => {
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    for (let i = 0; i < 60; i++) {
      buatUlang();
      const p = pw();
      expect(p, `iterasi ${i}: ${p}`).toMatch(/[A-Z]/);
      expect(p, `iterasi ${i}: ${p}`).toMatch(/\d/);
      expect(p, `iterasi ${i}: ${p}`).toMatch(SIMBOL);
      // huruf kecil SENGAJA tidak dijamin: ia selalu ada di kolam karakter, hanya tiga kelas
      // yang bisa dimatikan pengguna yang diwajibkan muncul bila saklarnya aktif.
    }
  });

  it('semua saklar dimatikan: hanya huruf kecil a–z', () => {
    render(<PasswordGenerator />);
    fireEvent.click(saklar('Huruf Besar (A–Z)'));
    fireEvent.click(saklar('Angka (0–9)'));
    fireEvent.click(saklar('Simbol (!@#…)'));
    for (let i = 0; i < 30; i++) {
      expect(pw()).toMatch(/^[a-z]{16}$/);
      buatUlang();
    }
  });

  it('tiap saklar mengatur kelasnya sendiri: matikan satu kelas → kelas itu hilang, dua lainnya tetap ada', () => {
    const kelas: Array<[string, RegExp, RegExp[]]> = [
      ['Huruf Besar (A–Z)', /[A-Z]/, [/\d/, SIMBOL]],
      ['Angka (0–9)', /\d/, [/[A-Z]/, SIMBOL]],
      ['Simbol (!@#…)', SIMBOL, [/[A-Z]/, /\d/]],
    ];
    for (const [label, dimatikan, tetap] of kelas) {
      const { unmount } = render(<PasswordGenerator />);
      fireEvent.click(saklar(label));
      expect(saklar(label)).toHaveAttribute('aria-checked', 'false');
      for (let i = 0; i < 25; i++) {
        const p = pw();
        expect(p, label).not.toMatch(dimatikan);
        for (const t of tetap) expect(p, label).toMatch(t);
        buatUlang();
      }
      unmount();
    }
  });

  it('mengubah saklar langsung membangkitkan password baru dan memperbarui meter (hanya huruf kecil 8 → "Lemah")', () => {
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } });
    fireEvent.click(saklar('Huruf Besar (A–Z)'));
    fireEvent.click(saklar('Angka (0–9)'));
    fireEvent.click(saklar('Simbol (!@#…)'));
    expect(pw()).toMatch(/^[a-z]{8}$/);
    expect(screen.getByText('Lemah')).toBeInTheDocument();
  });
});

describe('PasswordGenerator — sumber acak', () => {
  it('karakter dipilih dari crypto.getRandomValues (nilai 0 → huruf pertama "a" di semua posisi)', () => {
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((arr: Uint32Array) => {
      arr.fill(0);
      return arr;
    }) as unknown as typeof crypto.getRandomValues);
    render(<PasswordGenerator />);
    fireEvent.click(saklar('Huruf Besar (A–Z)'));
    fireEvent.click(saklar('Angka (0–9)'));
    fireEvent.click(saklar('Simbol (!@#…)'));
    expect(pw()).toBe('a'.repeat(16));
  });

  it('"Buat ulang" menghasilkan password berbeda (peluang tabrakan ≈ 0)', () => {
    render(<PasswordGenerator />);
    const semua = new Set<string>([pw()]);
    for (let i = 0; i < 10; i++) { buatUlang(); semua.add(pw()); }
    expect(semua.size).toBe(11);
  });
});

describe('PasswordGenerator — salin', () => {
  it('menyalin password yang sedang tampil ke clipboard dan menandai "tersalin"', async () => {
    const writeText = pasangClipboard();
    render(<PasswordGenerator />);
    const tampil = pw();
    fireEvent.click(screen.getByRole('button', { name: 'Salin password' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(tampil));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salin password' })).toHaveClass('pw-gen__copy--copied'));
  });

  it('status tersalin hilang bila password dibuat ulang', async () => {
    pasangClipboard();
    render(<PasswordGenerator />);
    fireEvent.click(screen.getByRole('button', { name: 'Salin password' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salin password' })).toHaveClass('pw-gen__copy--copied'));

    buatUlang();
    expect(screen.getByRole('button', { name: 'Salin password' })).not.toHaveClass('pw-gen__copy--copied');
  });

  it('status tersalin kembali normal sendiri sekitar 2 detik kemudian', async () => {
    pasangClipboard();
    render(<PasswordGenerator />);
    fireEvent.click(screen.getByRole('button', { name: 'Salin password' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salin password' })).toHaveClass('pw-gen__copy--copied'));
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Salin password' })).not.toHaveClass('pw-gen__copy--copied'),
      { timeout: 3500 },
    );
  });
});

describe('PasswordGenerator — tombol opsional (onUse / onClose)', () => {
  it('tanpa onUse dan onClose: tidak ada tombol "Pakai Password Ini" maupun "Tutup"', () => {
    render(<PasswordGenerator />);
    expect(screen.queryByRole('button', { name: 'Pakai Password Ini' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tutup' })).not.toBeInTheDocument();
  });

  it('"Pakai Password Ini" memanggil onUse dengan password yang tampil, LALU onClose', () => {
    const urutan: string[] = [];
    render(
      <PasswordGenerator
        onUse={(p) => { urutan.push(`use:${p}`); }}
        onClose={() => { urutan.push('close'); }}
      />,
    );
    const tampil = pw();
    fireEvent.click(screen.getByRole('button', { name: 'Pakai Password Ini' }));
    expect(urutan).toEqual([`use:${tampil}`, 'close']);
  });

  it('tombol Tutup memanggil onClose saja (tanpa onUse)', () => {
    const onUse = vi.fn();
    const onClose = vi.fn();
    render(<PasswordGenerator onUse={onUse} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onUse).not.toHaveBeenCalled();
  });
});
