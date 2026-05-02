/**
 * lib/__tests__/crypto.test.ts — Vault Next
 * Unit test untuk crypto engine (AES-256-GCM + PBKDF2).
 * F3-05
 */

import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateSalt, sha256 } from '../crypto';

describe('generateSalt', () => {
  it('menghasilkan 16 bytes', () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.byteLength).toBe(16);
  });

  it('setiap panggilan menghasilkan nilai acak (tidak sama)', () => {
    const a = generateSalt();
    const b = generateSalt();
    // Kemungkinan sama sangat kecil (1 / 2^128)
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('sha256', () => {
  it('menghasilkan hash hex 64 karakter', async () => {
    const hash = await sha256('hello world');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('hash konsisten untuk input yang sama', async () => {
    const h1 = await sha256('vault-next');
    const h2 = await sha256('vault-next');
    expect(h1).toBe(h2);
  });

  it('hash berbeda untuk input berbeda', async () => {
    const h1 = await sha256('abc');
    const h2 = await sha256('abd');
    expect(h1).not.toBe(h2);
  });
});

describe('encrypt + decrypt roundtrip', () => {
  it('plaintext bisa di-encrypt lalu di-decrypt kembali', async () => {
    const plaintext = 'password-rahasia-123!@#';
    const password  = 'master-password-kuat';

    const ciphertext = await encrypt(plaintext, password);
    const result     = await decrypt(ciphertext, password);

    expect(result).toBe(plaintext);
  });

  it('encrypt dengan plaintext kosong tetap berhasil', async () => {
    const ciphertext = await encrypt('', 'password');
    const result     = await decrypt(ciphertext, 'password');
    expect(result).toBe('');
  });

  it('encrypt menghasilkan string base64', async () => {
    const ct = await encrypt('test', 'pass');
    // Base64 hanya berisi karakter valid
    expect(() => atob(ct)).not.toThrow();
  });

  it('encrypt dua kali dengan plaintext sama menghasilkan ciphertext berbeda (IV acak)', async () => {
    const ct1 = await encrypt('sama', 'password');
    const ct2 = await encrypt('sama', 'password');
    expect(ct1).not.toBe(ct2);
  });
});

describe('decrypt dengan password salah', () => {
  it('throw error jika password salah', async () => {
    const ct = await encrypt('secret', 'password-benar');
    await expect(decrypt(ct, 'password-salah')).rejects.toThrow();
  });

  it('throw error jika ciphertext korup', async () => {
    await expect(decrypt('ini-bukan-ciphertext-valid', 'password')).rejects.toThrow();
  });
});
