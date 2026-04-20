import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { hashPIN, hashMasterPW, generateSalt, generateSeedPhrase, validateSeedPhrase } from '@/lib/crypto';

export type AuthScreen =
  | 'loading'
  | 'setup-pin'
  | 'setup-master'
  | 'setup-seed'
  | 'lock'
  | 'unlocked';

export type AuthMethod = 'pin' | 'master-pw';

interface AuthState {
  // Status
  screen: AuthScreen;
  isUnlocked: boolean;
  setupComplete: boolean;

  // Sesi
  sessionExpiryMs: number; // durasi sesi dalam ms (default 5 menit)
  lastActivityAt: number;  // timestamp last activity

  // Error & loading
  error: string | null;
  isLoading: boolean;

  // Attempt tracking
  failedAttempts: number;
  maxAttempts: number;
  lockedUntil: number | null; // timestamp, null jika tidak terkunci

  // Setup flow
  setupSeedPhrase: string | null;

  // Actions
  initAuth: () => Promise<void>;
  unlockWithPIN: (pin: string) => Promise<boolean>;
  unlockWithMasterPW: (password: string) => Promise<boolean>;
  lock: () => void;
  setScreen: (screen: AuthScreen) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  recordActivity: () => void;
  checkSessionExpiry: () => void;

  // Setup
  setupVault: (pin: string, masterPW: string) => Promise<{ seedPhrase: string }>;
  confirmSetupSeed: () => void;

  // Recovery
  recoverWithSeedPhrase: (phrase: string, newPIN: string, newMasterPW: string) => Promise<boolean>;

  // Utils
  getSalt: () => string;
  isRateLimited: () => boolean;
  getRemainingLockSeconds: () => number;
}

const SESSION_DURATION = 5 * 60 * 1000; // 5 menit

export const useAuthStore = create<AuthState>((set, get) => ({
  // State awal
  screen: 'loading',
  isUnlocked: false,
  setupComplete: false,
  sessionExpiryMs: SESSION_DURATION,
  lastActivityAt: 0,
  error: null,
  isLoading: false,
  failedAttempts: 0,
  maxAttempts: 5,
  lockedUntil: null,
  setupSeedPhrase: null,

  // ─── Init ──────────────────────────────────────────────────────────────────
  initAuth: async () => {
    const setupComplete = storage.get(STORAGE_KEYS.SETUP_COMPLETE) === 'true';
    const pinHash = storage.get(STORAGE_KEYS.PIN_HASH);

    if (!setupComplete || !pinHash) {
      set({ screen: 'setup-pin', setupComplete: false });
    } else {
      set({ screen: 'lock', setupComplete: true });
    }
  },

  // ─── Unlock ────────────────────────────────────────────────────────────────
  unlockWithPIN: async (pin: string): Promise<boolean> => {
    const { isRateLimited, getSalt } = get();
    if (isRateLimited()) return false;

    set({ isLoading: true, error: null });

    try {
      const storedHash = storage.get(STORAGE_KEYS.PIN_HASH);
      if (!storedHash) {
        set({ error: 'Data tidak ditemukan. Silakan setup ulang.', isLoading: false });
        return false;
      }

      const salt = getSalt();
      const inputHash = await hashPIN(pin, salt);

      if (inputHash === storedHash) {
        set({
          isUnlocked: true,
          screen: 'unlocked',
          failedAttempts: 0,
          lockedUntil: null,
          lastActivityAt: Date.now(),
          error: null,
          isLoading: false,
        });
        return true;
      } else {
        const newAttempts = get().failedAttempts + 1;
        const { maxAttempts } = get();

        if (newAttempts >= maxAttempts) {
          const lockedUntil = Date.now() + 30_000; // 30 detik lockout
          set({
            failedAttempts: newAttempts,
            lockedUntil,
            error: `Terlalu banyak percobaan. Tunggu 30 detik.`,
            isLoading: false,
          });
        } else {
          set({
            failedAttempts: newAttempts,
            error: `PIN salah. ${maxAttempts - newAttempts} percobaan tersisa.`,
            isLoading: false,
          });
        }
        return false;
      }
    } catch {
      set({ error: 'Terjadi kesalahan. Coba lagi.', isLoading: false });
      return false;
    }
  },

  unlockWithMasterPW: async (password: string): Promise<boolean> => {
    const { isRateLimited, getSalt } = get();
    if (isRateLimited()) return false;

    set({ isLoading: true, error: null });

    try {
      const storedHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
      if (!storedHash) {
        set({ error: 'Data tidak ditemukan.', isLoading: false });
        return false;
      }

      const salt = getSalt();
      const inputHash = await hashMasterPW(password, salt);

      if (inputHash === storedHash) {
        set({
          isUnlocked: true,
          screen: 'unlocked',
          failedAttempts: 0,
          lockedUntil: null,
          lastActivityAt: Date.now(),
          error: null,
          isLoading: false,
        });
        return true;
      } else {
        const newAttempts = get().failedAttempts + 1;
        const { maxAttempts } = get();
        if (newAttempts >= maxAttempts) {
          set({
            failedAttempts: newAttempts,
            lockedUntil: Date.now() + 30_000,
            error: `Terlalu banyak percobaan. Tunggu 30 detik.`,
            isLoading: false,
          });
        } else {
          set({
            failedAttempts: newAttempts,
            error: `Kata sandi salah. ${maxAttempts - newAttempts} percobaan tersisa.`,
            isLoading: false,
          });
        }
        return false;
      }
    } catch {
      set({ error: 'Terjadi kesalahan. Coba lagi.', isLoading: false });
      return false;
    }
  },

  // ─── Lock ──────────────────────────────────────────────────────────────────
  lock: () => {
    set({ isUnlocked: false, screen: 'lock', error: null });
  },

  // ─── Session ───────────────────────────────────────────────────────────────
  recordActivity: () => {
    set({ lastActivityAt: Date.now() });
  },

  checkSessionExpiry: () => {
    const { isUnlocked, lastActivityAt, sessionExpiryMs, lock } = get();
    if (!isUnlocked) return;
    if (Date.now() - lastActivityAt > sessionExpiryMs) {
      lock();
    }
  },

  // ─── Setup ─────────────────────────────────────────────────────────────────
  setupVault: async (pin: string, masterPW: string): Promise<{ seedPhrase: string }> => {
    set({ isLoading: true, error: null });

    try {
      const salt = generateSalt();
      const pinHash = await hashPIN(pin, salt);
      const masterHash = await hashMasterPW(masterPW, salt);
      const seedPhrase = generateSeedPhrase();

      // Simpan ke localStorage
      storage.set(STORAGE_KEYS.SALT, salt);
      storage.set(STORAGE_KEYS.PIN_HASH, pinHash);
      storage.set(STORAGE_KEYS.MASTER_PW_HASH, masterHash);
      storage.set(STORAGE_KEYS.SEED_PHRASE, seedPhrase);
      storage.set(STORAGE_KEYS.SETUP_COMPLETE, 'true');

      set({
        setupComplete: true,
        setupSeedPhrase: seedPhrase,
        screen: 'setup-seed',
        isLoading: false,
      });

      return { seedPhrase };
    } catch {
      set({ error: 'Gagal menyiapkan vault. Coba lagi.', isLoading: false });
      throw new Error('Setup gagal');
    }
  },

  confirmSetupSeed: () => {
    set({
      setupSeedPhrase: null,
      screen: 'unlocked',
      isUnlocked: true,
      lastActivityAt: Date.now(),
    });
  },

  // ─── Recovery ──────────────────────────────────────────────────────────────
  recoverWithSeedPhrase: async (phrase: string, newPIN: string, newMasterPW: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      if (!validateSeedPhrase(phrase)) {
        set({ error: 'Format seed phrase tidak valid (harus 12 kata).', isLoading: false });
        return false;
      }

      const storedSeed = storage.get(STORAGE_KEYS.SEED_PHRASE);
      if (!storedSeed || phrase.trim().toLowerCase() !== storedSeed.trim().toLowerCase()) {
        set({ error: 'Seed phrase tidak cocok.', isLoading: false });
        return false;
      }

      // Reset PIN & master password
      const salt = get().getSalt();
      const newPinHash = await hashPIN(newPIN, salt);
      const newMasterHash = await hashMasterPW(newMasterPW, salt);

      storage.set(STORAGE_KEYS.PIN_HASH, newPinHash);
      storage.set(STORAGE_KEYS.MASTER_PW_HASH, newMasterHash);

      set({
        isUnlocked: true,
        screen: 'unlocked',
        failedAttempts: 0,
        lockedUntil: null,
        lastActivityAt: Date.now(),
        error: null,
        isLoading: false,
      });

      return true;
    } catch {
      set({ error: 'Pemulihan gagal. Coba lagi.', isLoading: false });
      return false;
    }
  },

  // ─── Helpers ───────────────────────────────────────────────────────────────
  setScreen: (screen) => set({ screen }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  getSalt: (): string => {
    const salt = storage.get(STORAGE_KEYS.SALT);
    if (!salt) throw new Error('Salt tidak ditemukan');
    return salt;
  },

  isRateLimited: (): boolean => {
    const { lockedUntil } = get();
    if (!lockedUntil) return false;
    if (Date.now() < lockedUntil) return true;
    // Lockout selesai
    set({ lockedUntil: null, failedAttempts: 0 });
    return false;
  },

  getRemainingLockSeconds: (): number => {
    const { lockedUntil } = get();
    if (!lockedUntil) return 0;
    return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  },
}));
