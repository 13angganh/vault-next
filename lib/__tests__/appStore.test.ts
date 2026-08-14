/**
 * lib/__tests__/appStore.test.ts — Vault Next
 * Unit test untuk lib/store/appStore.ts.
 *
 * v1.7.0: fokus pertama pada persistence lockout PIN. Sebelumnya
 * pinAttempts/pinLockedUntil hanya di Zustand (in-memory) -- reload
 * halaman atau PWA tab di-kill OS menghapus keduanya tanpa jejak,
 * sehingga rate-limiting 5x-percobaan/5-menit bisa dilewati semata-mata
 * dengan refresh. Test di sini memverifikasi keduanya sekarang bertahan
 * lewat siklus reload (disimulasikan via re-import modul store).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LS_PIN_ATTEMPTS, LS_PIN_LOCKED_UNTIL } from '../storage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('appStore — persistence lockout PIN', () => {
  it('setPinLocked menulis pinLockedUntil ke localStorage, bukan hanya state in-memory', async () => {
    const { useAppStore } = await import('../store/appStore');
    const until = Date.now() + 5 * 60 * 1000;

    useAppStore.getState().setPinLocked(until);

    expect(useAppStore.getState().pinLockedUntil).toBe(until);
    expect(Number(localStorage.getItem(LS_PIN_LOCKED_UNTIL))).toBe(until);
  });

  it('incrementPinAttempts menulis counter ke localStorage di setiap panggilan', async () => {
    const { useAppStore } = await import('../store/appStore');

    useAppStore.getState().incrementPinAttempts();
    expect(Number(localStorage.getItem(LS_PIN_ATTEMPTS))).toBe(1);

    useAppStore.getState().incrementPinAttempts();
    expect(Number(localStorage.getItem(LS_PIN_ATTEMPTS))).toBe(2);
  });

  it('lockout bertahan lewat simulasi reload (re-evaluasi modul store dari localStorage)', async () => {
    localStorage.clear(); // pastikan bersih dari sisa counter test lain di file ini

    // Sesi 1: user salah 5x, kena lockout. Modul store ini mungkin sudah
    // di-cache dari test lain di file yang sama (Vitest meng-cache modul
    // per path), jadi state in-memorinya bisa membawa sisa dari test
    // sebelumnya -- reset dulu secara eksplisit sebelum mensimulasikan
    // 5 percobaan baru, supaya test ini murni menguji apa yang tertulis
    // ke localStorage, bukan tercampur riwayat test lain.
    const { useAppStore: storeSesi1 } = await import('../store/appStore');
    storeSesi1.getState().resetPinAttempts();

    const until = Date.now() + 5 * 60 * 1000;
    storeSesi1.getState().incrementPinAttempts();
    storeSesi1.getState().incrementPinAttempts();
    storeSesi1.getState().incrementPinAttempts();
    storeSesi1.getState().incrementPinAttempts();
    storeSesi1.getState().incrementPinAttempts();
    storeSesi1.getState().setPinLocked(until);

    expect(Number(localStorage.getItem(LS_PIN_ATTEMPTS))).toBe(5);
    expect(Number(localStorage.getItem(LS_PIN_LOCKED_UNTIL))).toBe(until);

    // Sesi 2: simulasi reload dengan re-import modul via query cache-bust --
    // ini menjalankan ulang seluruh top-level `create<AppState>((set, get) => ({...}))`
    // block, persis seperti yang terjadi saat browser me-load ulang app.
    // localStorage TIDAK di-clear di antara "sesi" ini -- itulah intinya:
    // browser sungguhan tidak menghapus localStorage saat reload.
    const { useAppStore: storeSesi2 } = await import(
      /* @vite-ignore */ `../store/appStore?t=${Date.now()}`
    );

    // Lockout dan counter harus terbaca dari localStorage saat modul
    // dievaluasi ulang -- bukan reset ke 0, seperti sebelum fix.
    expect(storeSesi2.getState().pinAttempts).toBe(5);
    expect(storeSesi2.getState().pinLockedUntil).toBe(until);
    expect(Date.now() < storeSesi2.getState().pinLockedUntil).toBe(true);
  });

  it('unlock membersihkan pinAttempts/pinLockedUntil di localStorage, bukan hanya di memori', async () => {
    const { useAppStore } = await import('../store/appStore');
    useAppStore.getState().setPinLocked(Date.now() + 5 * 60 * 1000);
    useAppStore.getState().incrementPinAttempts();

    useAppStore.getState().unlock('master-pw-benar');

    expect(useAppStore.getState().pinAttempts).toBe(0);
    expect(useAppStore.getState().pinLockedUntil).toBe(0);
    expect(Number(localStorage.getItem(LS_PIN_ATTEMPTS))).toBe(0);
    expect(Number(localStorage.getItem(LS_PIN_LOCKED_UNTIL))).toBe(0);
  });

  it('resetPinAttempts membersihkan localStorage juga', async () => {
    const { useAppStore } = await import('../store/appStore');
    useAppStore.getState().incrementPinAttempts();
    useAppStore.getState().setPinLocked(Date.now() + 1000);

    useAppStore.getState().resetPinAttempts();

    expect(Number(localStorage.getItem(LS_PIN_ATTEMPTS))).toBe(0);
    expect(Number(localStorage.getItem(LS_PIN_LOCKED_UNTIL))).toBe(0);
  });
});

describe('appStore — addCustomCat/setCustomCats/removeCustomCat saat localStorage gagal', () => {
  // v1.7.0: sebelumnya ketiga action ini bisa melempar exception yang tidak
  // pernah diverifikasi ada test-nya sama sekali. Test ini memverifikasi:
  // (1) exception tetap dilempar ke pemanggil (bukan ditelan diam-diam —
  // pemanggil seperti CategoryManager.tsx butuh ini untuk rollback+toast),
  // dan (2) state Zustand TIDAK berubah saat localStorage gagal, karena
  // urutan kode (lsSetJson dulu, baru set()) sudah sejak awal memastikan
  // itu — bukan sesuatu yang baru ditambahkan, tapi layak dijamin permanen.
  it('addCustomCat melempar dan tidak mengubah state saat localStorage penuh', async () => {
    const { useAppStore } = await import('../store/appStore');
    useAppStore.setState({ customCats: [] });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const newCat = { id: 'cat_1', label: 'Test', emoji: 'folder', iconKey: 'folder' };
    expect(() => useAppStore.getState().addCustomCat(newCat)).toThrow();
    expect(useAppStore.getState().customCats).toEqual([]); // tidak berubah

    setItemSpy.mockRestore();
  });

  it('removeCustomCat melempar dan tidak mengubah state saat localStorage penuh', async () => {
    const { useAppStore } = await import('../store/appStore');
    const existing = [{ id: 'cat_1', label: 'Test', emoji: 'folder', iconKey: 'folder' }];
    useAppStore.setState({ customCats: existing });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    expect(() => useAppStore.getState().removeCustomCat('cat_1')).toThrow();
    expect(useAppStore.getState().customCats).toEqual(existing); // tidak berubah

    setItemSpy.mockRestore();
  });

  it('setCustomCats melempar dan tidak mengubah state saat localStorage penuh', async () => {
    const { useAppStore } = await import('../store/appStore');
    const existing = [{ id: 'cat_1', label: 'Lama', emoji: 'folder', iconKey: 'folder' }];
    useAppStore.setState({ customCats: existing });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const attemptedNew = [{ id: 'cat_2', label: 'Baru', emoji: 'folder', iconKey: 'folder' }];
    expect(() => useAppStore.getState().setCustomCats(attemptedNew)).toThrow();
    expect(useAppStore.getState().customCats).toEqual(existing); // tidak berubah ke attemptedNew

    setItemSpy.mockRestore();
  });
});
