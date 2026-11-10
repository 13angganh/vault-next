/**
 * lib/__tests__/vaultService.test.ts — Vault Next
 * Unit test untuk vaultService (operasi vault inti).
 * F3-06
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setupVault,
  unlockVault,
  saveVault,
  setupPin,
  verifyPinAndGetMaster,
  verifyPin,
  hasPinSetup,
  removePin,
  exportBackup,
  importBackup,
  type SetupPayload,
  type UnlockPayload,
} from '../vaultService';
import { clearAllVaultData } from '../storage';
import type { VaultEntry, VaultMeta } from '../types';

// Clear semua data sebelum setiap test
beforeEach(() => {
  localStorage.clear();
  clearAllVaultData();
});

// Helper payload setup dasar
const baseSetup: SetupPayload = {
  masterPw:       'MasterPassword!123',
  hint:           'hint test',
  recoveryPhrase: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24',
};

describe('setupVault + unlockVault roundtrip', () => {
  it('vault yang di-setup bisa di-unlock dengan password yang sama', async () => {
    await setupVault(baseSetup);
    const payload: UnlockPayload = await unlockVault(baseSetup.masterPw);
    expect(payload).toBeDefined();
    expect(payload.vault).toEqual([]);
  });

  it('unlockVault dengan password salah harus throw', async () => {
    await setupVault(baseSetup);
    await expect(unlockVault('password-salah')).rejects.toThrow();
  });
});

describe('saveVault + unlockVault', () => {
  it('data yang di-save bisa dibaca kembali setelah unlock', async () => {
    await setupVault(baseSetup);

    const entries = [
      {
        id:       'test-1',
        cat:      'lainnya',
        name:     'Test Entry',
        username: 'user@test.com',
        password: 'secret123',
        url:      '',
        note:     '',
        fav:      false,
        ts:       Date.now(),
        updatedAt: Date.now(),
        fields:   {},
      },
    ];

    const meta = {
      hint:              'hint',
      recoveryHash:      '',
      recovery:          '',
      encMasterBySeed:   '',
      createdAt:         Date.now(),
      updatedAt:         Date.now(),
      version:           1,
    };

    await saveVault(baseSetup.masterPw, entries, [], meta, [], []);

    const unlocked = await unlockVault(baseSetup.masterPw);
    expect(unlocked.vault).toHaveLength(1);
    expect(unlocked.vault[0].name).toBe('Test Entry');
  });
});

describe('setupPin + verifyPinAndGetMaster', () => {
  it('PIN yang di-setup bisa digunakan untuk mendapatkan master password', async () => {
    await setupVault(baseSetup);
    await setupPin('1234', baseSetup.masterPw);

    expect(hasPinSetup()).toBe(true);

    const masterPw = await verifyPinAndGetMaster('1234');
    expect(masterPw).toBe(baseSetup.masterPw);
  });

  it('verifyPinAndGetMaster dengan PIN salah harus throw', async () => {
    await setupVault(baseSetup);
    await setupPin('1234', baseSetup.masterPw);
    await expect(verifyPinAndGetMaster('9999')).rejects.toThrow();
  });

  it('verifyPin mengembalikan true untuk PIN benar', async () => {
    await setupVault(baseSetup);
    await setupPin('5678', baseSetup.masterPw);
    expect(await verifyPin('5678')).toBe(true);
  });

  it('verifyPin mengembalikan false untuk PIN salah', async () => {
    await setupVault(baseSetup);
    await setupPin('5678', baseSetup.masterPw);
    expect(await verifyPin('1111')).toBe(false);
  });

  it('hasPinSetup false setelah removePin', async () => {
    await setupVault(baseSetup);
    await setupPin('0000', baseSetup.masterPw);
    expect(hasPinSetup()).toBe(true);
    removePin();
    expect(hasPinSetup()).toBe(false);
  });
});

// v1.11.0 (Tahap 6 QA final): verifikasi field brandIconSlug (redesain
// visual, penambahan additive di VaultEntry) aman melewati siklus
// export->import, DAN backup lama (tanpa field ini sama sekali) tetap
// bisa di-import tanpa crash — memvalidasi klaim yang sebelumnya hanya
// dari pembacaan kode (importBackup meneruskan data.vault apa adanya,
// tanpa whitelist field), sekarang dibuktikan lewat eksekusi nyata.
describe('exportBackup + importBackup — kompatibilitas brandIconSlug (v1.11.0)', () => {
  const minimalMeta: VaultMeta = {
    hint: 'hint test',
    recoveryHash: 'dummy-hash-utk-test',
    recovery: 'dummy-recovery-utk-test',
    encMasterBySeed: 'dummy-enc-utk-test',
  };

  it('entry dengan brandIconSlug SELAMAT UTUH setelah export lalu import kembali', async () => {
    const entryWithBrand: VaultEntry = {
      id: 'e1', cat: 'crypto', name: 'Binance', brandIconSlug: 'binance',
    };
    const backup = await exportBackup(
      baseSetup.masterPw, [entryWithBrand], [], minimalMeta, [], [],
    );
    const restored = await importBackup(JSON.stringify(backup), baseSetup.masterPw);
    expect(restored.vault).toHaveLength(1);
    expect(restored.vault[0].brandIconSlug).toBe('binance');
  });

  it('backup LAMA (JSON manual, entry TANPA field brandIconSlug sama sekali) di-import TANPA CRASH, brandIconSlug jadi undefined', async () => {
    // Simulasi backup dari versi app SEBELUM v1.11.0 — dibuat manual
    // (bukan via exportBackup versi baru) agar benar2 tidak menyertakan
    // brandIconSlug sama sekali, bukan cuma diset undefined.
    const oldStyleEntry = { id: 'e2', cat: 'email', name: 'Gmail Lama' };
    const oldBackup = await exportBackup(
      baseSetup.masterPw,
      [oldStyleEntry as VaultEntry],
      [], minimalMeta, [], [],
    );
    const restored = await importBackup(JSON.stringify(oldBackup), baseSetup.masterPw);
    expect(restored.vault).toHaveLength(1);
    expect(restored.vault[0].brandIconSlug).toBeUndefined();
    expect(restored.vault[0].name).toBe('Gmail Lama'); // field lain tetap utuh
  });

  it('campuran entry lama (tanpa brandIconSlug) DAN baru (dengan brandIconSlug) dalam satu backup, keduanya utuh setelah import', async () => {
    const mixedVault = [
      { id: 'e3', cat: 'email', name: 'Entry Lama' } as VaultEntry,
      { id: 'e4', cat: 'crypto', name: 'Entry Baru', brandIconSlug: 'gmail' } as VaultEntry,
    ];
    const backup = await exportBackup(
      baseSetup.masterPw, mixedVault, [], minimalMeta, [], [],
    );
    const restored = await importBackup(JSON.stringify(backup), baseSetup.masterPw);
    expect(restored.vault).toHaveLength(2);
    expect(restored.vault.find((e) => e.id === 'e3')?.brandIconSlug).toBeUndefined();
    expect(restored.vault.find((e) => e.id === 'e4')?.brandIconSlug).toBe('gmail');
  });
});
