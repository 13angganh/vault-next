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
  type SetupPayload,
  type UnlockPayload,
} from '../vaultService';
import { clearAllVaultData } from '../storage';

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
