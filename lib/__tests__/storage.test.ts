/**
 * lib/__tests__/storage.test.ts — Vault Next
 * Unit test untuk storage wrappers (localStorage).
 * F3-05
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  lsGet, lsSet, lsRemove,
  lsGetJson, lsSetJson,
  lsGetBool, lsGetNum,
  clearAllVaultData,
  LS_KEY, LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA,
  LS_BKPIVL, LS_BKPDISM, LS_AUTOLOCK, LS_AUTOSAVE,
  LS_CATS, LS_PIN_SKIPPED, LS_BIO_ENABLED, LS_BIO_CRED_ID,
} from '../storage';

// jsdom provides localStorage
beforeEach(() => {
  localStorage.clear();
});

describe('lsGet / lsSet / lsRemove', () => {
  it('set lalu get mengembalikan nilai yang sama', () => {
    lsSet('test_key', 'hello');
    expect(lsGet('test_key')).toBe('hello');
  });

  it('get key yang belum di-set mengembalikan null', () => {
    expect(lsGet('key_tidak_ada')).toBeNull();
  });

  it('remove menghapus key', () => {
    lsSet('hapus_ini', 'nilai');
    lsRemove('hapus_ini');
    expect(lsGet('hapus_ini')).toBeNull();
  });

  it('remove key yang tidak ada tidak throw', () => {
    expect(() => lsRemove('tidak_ada')).not.toThrow();
  });
});

describe('lsGetJson / lsSetJson', () => {
  it('object disimpan dan dibaca kembali dengan benar', () => {
    const obj = { nama: 'Vault', versi: 2, aktif: true };
    lsSetJson('test_json', obj);
    expect(lsGetJson('test_json', null)).toEqual(obj);
  });

  it('array disimpan dan dibaca kembali dengan benar', () => {
    const arr = [1, 'dua', { tiga: 3 }];
    lsSetJson('test_arr', arr);
    expect(lsGetJson('test_arr', [])).toEqual(arr);
  });

  it('key tidak ada mengembalikan fallback', () => {
    expect(lsGetJson('tidak_ada', { default: true })).toEqual({ default: true });
  });

  it('JSON tidak valid mengembalikan fallback', () => {
    localStorage.setItem('rusak', 'bukan-json{');
    expect(lsGetJson('rusak', 42)).toBe(42);
  });
});

describe('lsGetBool', () => {
  it('"true" mengembalikan true', () => {
    lsSet('bool_key', 'true');
    expect(lsGetBool('bool_key')).toBe(true);
  });

  it('"false" mengembalikan false', () => {
    lsSet('bool_key', 'false');
    expect(lsGetBool('bool_key')).toBe(false);
  });

  it('key tidak ada mengembalikan fallback', () => {
    expect(lsGetBool('tidak_ada', true)).toBe(true);
    expect(lsGetBool('tidak_ada', false)).toBe(false);
  });

  it('fallback default adalah false', () => {
    expect(lsGetBool('tidak_ada')).toBe(false);
  });
});

describe('lsGetNum', () => {
  it('angka tersimpan dibaca dengan benar', () => {
    lsSet('num_key', '42');
    expect(lsGetNum('num_key', 0)).toBe(42);
  });

  it('angka desimal dibaca dengan benar', () => {
    lsSet('float_key', '3.14');
    expect(lsGetNum('float_key', 0)).toBeCloseTo(3.14);
  });

  it('key tidak ada mengembalikan fallback', () => {
    expect(lsGetNum('tidak_ada', 99)).toBe(99);
  });

  it('nilai bukan angka mengembalikan fallback', () => {
    lsSet('bukan_num', 'abc');
    expect(lsGetNum('bukan_num', 5)).toBe(5);
  });
});

describe('clearAllVaultData', () => {
  it('menghapus semua vault keys termasuk biometric keys', () => {
    // Setup semua keys
    const allKeys = [
      LS_KEY, LS_META, LS_PIN, LS_BACKUP, LS_BKPDATA,
      LS_BKPIVL, LS_BKPDISM, LS_AUTOLOCK, LS_AUTOSAVE,
      LS_CATS, LS_PIN_SKIPPED, LS_BIO_ENABLED, LS_BIO_CRED_ID,
    ];
    allKeys.forEach((k) => lsSet(k, 'test-value'));

    // Verify semua ada
    allKeys.forEach((k) => expect(lsGet(k)).not.toBeNull());

    // Clear
    clearAllVaultData();

    // Verify semua terhapus
    allKeys.forEach((k) => expect(lsGet(k)).toBeNull());
  });

  it('tidak menghapus key non-vault', () => {
    lsSet('vault_data', 'data');
    lsSet('app_setting', 'jangan_hapus');
    clearAllVaultData();
    expect(lsGet('app_setting')).toBe('jangan_hapus');
  });

  it('LS_BIO_ENABLED dan LS_BIO_CRED_ID ikut terhapus (F1-04 fix)', () => {
    lsSet(LS_BIO_ENABLED, 'true');
    lsSet(LS_BIO_CRED_ID, 'some-cred-id');
    clearAllVaultData();
    expect(lsGet(LS_BIO_ENABLED)).toBeNull();
    expect(lsGet(LS_BIO_CRED_ID)).toBeNull();
  });
});
