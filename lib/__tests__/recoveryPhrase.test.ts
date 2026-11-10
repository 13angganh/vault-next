/**
 * lib/__tests__/recoveryPhrase.test.ts — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Keputusan terkunci: recovery phrase vault BARU = 5 kata Inggris acak otomatis
 * (2048 kata, crypto.getRandomValues), tidak bisa diketik/dibuat sendiri.
 * Hash/enkripsi frasa TIDAK berubah dari v1.11.0 (dijaga dataCompat.test.ts);
 * test ini menjaga PEMBANGKITNYA: jumlah kata, sumber acak, kualitas daftar kata,
 * dan keseragaman pemetaan (tanpa bias modulo).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { generateRecoveryPhrase, RECOVERY_WORD_COUNT } from '@/lib/recoveryPhrase';
import { WORDLIST } from '@/lib/wordlist';

/** Isi getRandomValues dengan nilai deterministik (berulang bila buffer lebih panjang dari `values`). */
function mockRandom(values: number[]) {
  return vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((arr: Uint16Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = values[i % values.length];
    return arr;
  }) as unknown as typeof crypto.getRandomValues);
}

afterEach(() => { vi.restoreAllMocks(); });

describe('WORDLIST — daftar kata recovery', () => {
  it('tepat 2048 kata (11 bit per kata)', () => {
    expect(WORDLIST).toHaveLength(2048);
  });

  it('semua kata unik, huruf kecil a–z saja, panjang 3–8 (aman diketik ulang saat pemulihan)', () => {
    expect(new Set(WORDLIST).size).toBe(WORDLIST.length);
    for (const w of WORDLIST) expect(w).toMatch(/^[a-z]{3,8}$/);
  });
});

describe('generateRecoveryPhrase', () => {
  it('konstanta RECOVERY_WORD_COUNT = 5 (keputusan D4: 55 bit entropi)', () => {
    expect(RECOVERY_WORD_COUNT).toBe(5);
  });

  it('bawaan menghasilkan 5 kata dipisah SATU spasi; semua kata ada di WORDLIST', () => {
    const frasa = generateRecoveryPhrase();
    const kata = frasa.split(' ');
    expect(kata).toHaveLength(5);
    expect(frasa).not.toMatch(/\s{2,}|^\s|\s$/);
    for (const k of kata) expect(WORDLIST).toContain(k);
  });

  it('parameter jumlah dihormati', () => {
    expect(generateRecoveryPhrase(3).split(' ')).toHaveLength(3);
    expect(generateRecoveryPhrase(12).split(' ')).toHaveLength(12);
  });

  it('sudah dalam bentuk ternormalisasi (lowercase + trim) — sama dengan normalisasi RecoveryPanel saat pemulihan', () => {
    for (let i = 0; i < 20; i++) {
      const frasa = generateRecoveryPhrase();
      expect(frasa).toBe(frasa.toLowerCase().trim());
    }
  });

  it('memakai crypto.getRandomValues (bukan Math.random) dan memetakan nilai → indeks kata dengan modulo 2048', () => {
    const rnd = vi.spyOn(Math, 'random');
    const crypt = mockRandom([0, 2048, 2049, 65535, 1]);

    const frasa = generateRecoveryPhrase();

    expect(crypt).toHaveBeenCalledTimes(1);
    expect(rnd).not.toHaveBeenCalled();
    expect(frasa).toBe([WORDLIST[0], WORDLIST[0], WORDLIST[1], WORDLIST[2047], WORDLIST[1]].join(' '));
  });

  it('pemetaan SERAGAM: ke-65536 nilai 16-bit memilih tiap kata tepat 32 kali (tanpa bias modulo)', () => {
    mockRandom(Array.from({ length: 65536 }, (_, i) => i));

    const hitung = new Map<string, number>();
    for (const k of generateRecoveryPhrase(65536).split(' ')) hitung.set(k, (hitung.get(k) ?? 0) + 1);

    expect(hitung.size).toBe(2048);
    expect(new Set(hitung.values())).toEqual(new Set([32]));
  });

  it('200 frasa berturut-turut semuanya berbeda (sanity acak; peluang tabrakan ≈ 5e-13)', () => {
    const set = new Set(Array.from({ length: 200 }, () => generateRecoveryPhrase()));
    expect(set.size).toBe(200);
  });
});
