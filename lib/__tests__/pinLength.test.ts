/**
 * lib/__tests__/pinLength.test.ts — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Kunci BARU vault_pin_len ("4" | "6"), opsional, tanpa migrasi (kontrak data):
 * ABSEN = PIN lama dengan panjang bebas 4–8 digit → layar login memakai papan
 * 8 digit + tombol Buka. Nilai selain "4"/"6" dianggap ABSEN (bukan salah satu panjang).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getPinLength, setPinLength, clearPinLength, DEFAULT_PIN_LENGTH } from '@/lib/pinLength';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); });

describe('pinLength', () => {
  it('PIN baru bawaan 6 digit (keputusan D5)', () => {
    expect(DEFAULT_PIN_LENGTH).toBe(6);
  });

  it('ABSEN → null (jalur PIN lama: papan 8 digit + tombol Buka)', () => {
    expect(getPinLength()).toBeNull();
  });

  it('setPinLength(4) dan (6) tersimpan di kunci vault_pin_len sebagai string dan terbaca kembali', () => {
    setPinLength(4);
    expect(localStorage.getItem('vault_pin_len')).toBe('4');
    expect(getPinLength()).toBe(4);

    setPinLength(6);
    expect(localStorage.getItem('vault_pin_len')).toBe('6');
    expect(getPinLength()).toBe(6);
  });

  it('nilai selain "4"/"6" diperlakukan seperti ABSEN (null), bukan ditebak', () => {
    for (const aneh of ['5', '8', '', 'abc', '04', ' 6', '6.0']) {
      localStorage.setItem('vault_pin_len', aneh);
      expect(getPinLength(), `nilai "${aneh}"`).toBeNull();
    }
  });

  it('clearPinLength menghapus kunci sehingga kembali ke jalur PIN lama', () => {
    setPinLength(4);
    clearPinLength();
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
    expect(getPinLength()).toBeNull();
  });

  it('localStorage rusak/ditolak (mode privat) tidak pernah melempar galat', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('ditolak'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('ditolak'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('ditolak'); });

    expect(getPinLength()).toBeNull();
    expect(() => setPinLength(6)).not.toThrow();
    expect(() => clearPinLength()).not.toThrow();
  });
});
