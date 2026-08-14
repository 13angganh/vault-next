/**
 * Vault Next — App Store (Zustand)
 * Global state untuk seluruh aplikasi.
 * Semua akses state via hook ini — jangan buat state lokal di page.
 */

import { create } from 'zustand';
import type { VaultEntry, VaultMeta, CustomCategory, CategoryFieldDef } from '@/lib/types';
import {
  lsGet, lsSet, lsRemove, lsGetNum, lsSetNum, lsGetBool, lsSetBool, lsGetJson, lsSetJson,
  LS_AUTOLOCK, LS_AUTOSAVE, LS_BKPIVL, LS_CATS, LS_BIO_ENABLED, LS_BIO_CRED_ID,
  LS_PIN_ATTEMPTS, LS_PIN_LOCKED_UNTIL,
} from '@/lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppView = 'lock' | 'app';
export type FilterType = 'all' | 'fav' | 'bin' | string;
export type SortType    = 'default'|'name_asc'|'name_desc'|'newest'|'oldest'|'fav_first'|'cat_group';

interface AppState {
  // ── Auth & Lock ──
  isUnlocked:      boolean;
  masterPw:        string;         // disimpan in-memory saat unlocked, cleared saat lock
  autoLockMinutes: number;
  lastActivityAt:  number;

  // ── Vault Data ──
  vault:           VaultEntry[];
  recycleBin:      VaultEntry[];
  vaultMeta:       VaultMeta | null;
  lockedIds:       string[];       // entry ID yang di-lock individual
  // v1.10.0: kategori (default maupun custom) yang dikunci dari
  // hapus/ubah tidak sengaja — paralel dengan lockedIds di atas, tapi
  // untuk kategori bukan entri.
  lockedCatIds:    string[];
  // v1.10.0: override daftar field form untuk kategori DEFAULT
  // (kategori custom punya mekanisme sendiri lewat CustomCategory.fields,
  // lihat lib/types.ts untuk penjelasan lengkap kenapa dua tempat berbeda).
  defaultCatFieldOverrides: Record<string, CategoryFieldDef[]>;
  customCats:      CustomCategory[];

  // ── UI State ──
  currentFilter:   FilterType;
  sortBy:          SortType;
  searchQuery:     string;
  expandedIds:     string[];       // entry yang sedang expanded di list
  selectedIds:     string[];       // multi-select (batch action)

  // ── Field Visibility ──
  pwVisible:       Record<string, boolean>;  // { [entryId]: true }
  seedVisible:     Record<string, boolean>;

  // ── PIN ──
  pinBuffer:       string;         // digit PIN yang sedang diketik
  pinAttempts:     number;
  pinLocked:       boolean;
  pinLockedUntil:  number;

  // ── Settings ──
  backupIntervalHrs: number;
  autoSaveEnabled:   boolean;

  // ── Biometrik ──
  biometricEnabled:  boolean;
  biometricCredId:   string | null;

  // ── Actions: Auth ──
  unlock: (pw: string) => void;
  lock:   () => void;
  setMasterPw: (pw: string) => void;
  touchActivity: () => void;

  // ── Actions: Vault ──
  setVault:      (entries: VaultEntry[]) => void;
  setRecycleBin: (entries: VaultEntry[]) => void;
  setVaultMeta:  (meta: VaultMeta) => void;
  setLockedIds:  (ids: string[]) => void;
  toggleLockedId:(id: string) => void;
  // v1.10.0: paralel dengan setLockedIds/toggleLockedId di atas, untuk kategori.
  setLockedCatIds:   (ids: string[]) => void;
  toggleLockedCatId: (catId: string) => void;
  // v1.10.0: kelola override field form untuk kategori DEFAULT.
  setDefaultCatFieldOverrides:   (catId: string, fields: CategoryFieldDef[]) => void;
  resetDefaultCatFieldOverrides: (catId: string) => void;
  loadDefaultCatFieldOverrides:  (all: Record<string, CategoryFieldDef[]>) => void;

  // ── Actions: Categories ──
  setCustomCats:    (cats: CustomCategory[]) => void;
  addCustomCat:     (cat: CustomCategory) => void;
  removeCustomCat:  (id: string) => void;

  // ── Actions: UI ──
  setFilter:       (f: FilterType) => void;
  setSortBy:       (s: SortType)   => void;
  setSearchQuery:  (q: string) => void;
  toggleExpanded:  (id: string) => void;
  clearExpanded:   () => void;
  toggleSelected:  (id: string) => void;
  clearSelected:   () => void;

  // ── Actions: Visibility ──
  togglePwVisible:   (id: string) => void;
  toggleSeedVisible: (id: string) => void;
  clearAllVisible:   () => void;

  // ── Actions: PIN ──
  appendPin:   (digit: string) => void;
  clearPin:    () => void;
  incrementPinAttempts: () => void;
  resetPinAttempts:     () => void;
  setPinLocked:(until: number) => void;

  // ── Actions: Settings ──
  setAutoLockMinutes:   (m: number) => void;
  setBackupIntervalHrs: (h: number) => void;
  setAutoSaveEnabled:   (v: boolean) => void;

  // ── Actions: Biometrik ──
  setBiometricEnabled: (v: boolean) => void;
  setBiometricCredId:  (id: string | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Initial State ──────────────────────────────────────────────────────────

  isUnlocked:      false,
  masterPw:        '',
  autoLockMinutes: lsGetNum(LS_AUTOLOCK, 5),
  lastActivityAt:  Date.now(),

  vault:           [],
  recycleBin:      [],
  vaultMeta:       null,
  lockedIds:       [],
  lockedCatIds:    [],
  defaultCatFieldOverrides: {},
  customCats:      lsGetJson<CustomCategory[]>(LS_CATS, []),

  currentFilter:   'all',
  sortBy:          'default',
  searchQuery:     '',
  expandedIds:     [],
  selectedIds:     [],

  pwVisible:       {},
  seedVisible:     {},

  pinBuffer:       '',
  // v1.7.0: dulu literal 0 — lockout hilang begitu halaman reload/PWA di-kill
  // OS, membuat rate-limiting 5x-percobaan/5-menit bisa dilewati semata-mata
  // dengan refresh. Dibaca dari localStorage sama seperti autoLockMinutes dkk.
  pinAttempts:     lsGetNum(LS_PIN_ATTEMPTS, 0),
  pinLocked:       false, // dihitung ulang dari pinLockedUntil vs Date.now() di LockScreen — lihat init di bawah
  pinLockedUntil:  lsGetNum(LS_PIN_LOCKED_UNTIL, 0),

  backupIntervalHrs: lsGetNum(LS_BKPIVL, 24),
  autoSaveEnabled:   lsGetBool(LS_AUTOSAVE, true),
  biometricEnabled:  lsGetBool(LS_BIO_ENABLED, false),
  biometricCredId:   lsGet(LS_BIO_CRED_ID),

  // ── Actions: Auth ──────────────────────────────────────────────────────────

  unlock: (pw) => {
    // v1.7.0: bersihkan sisa counter/lockout persisten juga — sebelumnya
    // hanya di-reset di memori, localStorage tetap menyimpan angka lama
    lsSetNum(LS_PIN_ATTEMPTS, 0);
    lsSetNum(LS_PIN_LOCKED_UNTIL, 0);
    set({
      isUnlocked: true,
      masterPw: pw,
      lastActivityAt: Date.now(),
      pinBuffer: '',
      pinAttempts: 0,
      pinLocked: false,
      pinLockedUntil: 0,
    });
  },

  lock: () => set({
    isUnlocked: false,
    masterPw: '',
    vault: [],
    recycleBin: [],
    vaultMeta: null,
    lockedIds: [],
    lockedCatIds: [],
    defaultCatFieldOverrides: {},
    expandedIds: [],
    selectedIds: [],
    pwVisible: {},
    seedVisible: {},
    pinBuffer: '',
    currentFilter: 'all',
    sortBy: 'default',
    searchQuery: '',
  }),

  setMasterPw: (pw) => set({ masterPw: pw }),

  touchActivity: () => set({ lastActivityAt: Date.now() }),

  // ── Actions: Vault ─────────────────────────────────────────────────────────

  setVault:      (entries) => set({ vault: entries }),
  setRecycleBin: (entries) => set({ recycleBin: entries }),
  setVaultMeta:  (meta)    => set({ vaultMeta: meta }),
  setLockedIds:  (ids)     => set({ lockedIds: ids }),

  toggleLockedId: (id) => {
    const curr = get().lockedIds;
    const next = curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
    set({ lockedIds: next });
  },

  // v1.10.0: paralel persis dengan setLockedIds/toggleLockedId di atas,
  // untuk kategori bukan entri.
  setLockedCatIds: (ids) => set({ lockedCatIds: ids }),

  toggleLockedCatId: (catId) => {
    const curr = get().lockedCatIds;
    const next = curr.includes(catId) ? curr.filter((x) => x !== catId) : [...curr, catId];
    set({ lockedCatIds: next });
  },

  // v1.10.0: kelola override field form untuk kategori default. Immutable
  // update pada objek Record — spread + override key, bukan mutasi
  // langsung, konsisten dengan pola array immutable di atas.
  setDefaultCatFieldOverrides: (catId, fields) => {
    const curr = get().defaultCatFieldOverrides;
    set({ defaultCatFieldOverrides: { ...curr, [catId]: fields } });
  },

  resetDefaultCatFieldOverrides: (catId) => {
    const curr = get().defaultCatFieldOverrides;
    const { [catId]: _removed, ...rest } = curr;
    set({ defaultCatFieldOverrides: rest });
  },

  loadDefaultCatFieldOverrides: (all) => set({ defaultCatFieldOverrides: all }),

  // ── Actions: Categories ────────────────────────────────────────────────────
  // v1.7.0: ketiga action ini melempar lewat ke pemanggil kalau localStorage
  // gagal (mis. kuota penuh) -- itu memang perilaku yang benar (lsSetJson
  // throw sejak v1.6.0, CategoryManager.tsx sudah menangkapnya sendiri untuk
  // rollback+toast). Yang diperbaiki di sini murni robustness: state memori
  // sebenarnya SUDAH aman tanpa perubahan (set() hanya tercapai setelah
  // lsSetJson sukses, urutan yang sudah benar sejak awal) -- tapi kalau
  // action ini dipanggil dari tempat lain di masa depan tanpa try/catch
  // pembungkus seperti di CategoryManager, exception akan tetap uncaught
  // dan berpotensi crash UI. try/catch di sini sekadar logging diagnostik
  // sebelum re-throw -- perilaku pemanggil tidak berubah, hanya jejaknya.

  setCustomCats: (cats) => {
    try {
      lsSetJson(LS_CATS, cats);
      set({ customCats: cats });
    } catch (err) {
      console.error('[Vault] setCustomCats gagal simpan ke localStorage:', err);
      throw err;
    }
  },

  addCustomCat: (cat) => {
    const next = [...get().customCats, cat];
    try {
      lsSetJson(LS_CATS, next);
      set({ customCats: next });
    } catch (err) {
      console.error('[Vault] addCustomCat gagal simpan ke localStorage:', err);
      throw err;
    }
  },

  removeCustomCat: (id) => {
    const next = get().customCats.filter((c) => c.id !== id);
    try {
      lsSetJson(LS_CATS, next);
      set({ customCats: next });
    } catch (err) {
      console.error('[Vault] removeCustomCat gagal simpan ke localStorage:', err);
      throw err;
    }
  },

  // ── Actions: UI ────────────────────────────────────────────────────────────

  setFilter:      (f) => set({ currentFilter: f, searchQuery: '', expandedIds: [], selectedIds: [] }),
  setSortBy:      (s) => set({ sortBy: s }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleExpanded: (id) => {
    const curr = get().expandedIds;
    set({ expandedIds: curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id] });
  },
  clearExpanded: () => set({ expandedIds: [] }),

  toggleSelected: (id) => {
    const curr = get().selectedIds;
    set({ selectedIds: curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id] });
  },
  clearSelected: () => set({ selectedIds: [] }),

  // ── Actions: Visibility ────────────────────────────────────────────────────

  togglePwVisible: (id) => {
    const curr = get().pwVisible;
    set({ pwVisible: { ...curr, [id]: !curr[id] } });
  },
  toggleSeedVisible: (id) => {
    const curr = get().seedVisible;
    set({ seedVisible: { ...curr, [id]: !curr[id] } });
  },
  clearAllVisible: () => set({ pwVisible: {}, seedVisible: {} }),

  // ── Actions: PIN ───────────────────────────────────────────────────────────

  appendPin: (digit) => {
    const curr = get().pinBuffer;
    if (curr.length < 8) set({ pinBuffer: curr + digit }); // maxLen=8 sesuai PINPad
  },
  clearPin: () => set({ pinBuffer: '' }),

  // v1.7.0: persist ke localStorage — lihat catatan di initial state di atas
  incrementPinAttempts: () => {
    const n = get().pinAttempts + 1;
    lsSetNum(LS_PIN_ATTEMPTS, n);
    set({ pinAttempts: n });
  },
  resetPinAttempts: () => {
    lsSetNum(LS_PIN_ATTEMPTS, 0);
    lsSetNum(LS_PIN_LOCKED_UNTIL, 0);
    set({ pinAttempts: 0, pinLocked: false, pinLockedUntil: 0 });
  },

  setPinLocked: (until) => {
    lsSetNum(LS_PIN_LOCKED_UNTIL, until);
    set({ pinLocked: true, pinLockedUntil: until, pinBuffer: '' });
  },

  // ── Actions: Settings ──────────────────────────────────────────────────────

  setAutoLockMinutes: (m) => {
    lsSetNum(LS_AUTOLOCK, m);
    set({ autoLockMinutes: m });
  },
  setBackupIntervalHrs: (h) => {
    lsSetNum(LS_BKPIVL, h);
    set({ backupIntervalHrs: h });
  },
  setAutoSaveEnabled: (v) => {
    lsSetBool(LS_AUTOSAVE, v);
    set({ autoSaveEnabled: v });
  },

  // ── Actions: Biometrik ──────────────────────────────────────────────────────

  setBiometricEnabled: (v) => {
    lsSetBool(LS_BIO_ENABLED, v);
    set({ biometricEnabled: v });
  },
  setBiometricCredId: (id) => {
    if (id) lsSet(LS_BIO_CRED_ID, id);
    else lsRemove(LS_BIO_CRED_ID);
    set({ biometricCredId: id });
  },
}));

// ─── Selector hooks (shortcut) ────────────────────────────────────────────────

export const useIsUnlocked    = () => useAppStore((s) => s.isUnlocked);
export const useVault         = () => useAppStore((s) => s.vault);
export const useCurrentFilter = () => useAppStore((s) => s.currentFilter);
export const useSearchQuery   = () => useAppStore((s) => s.searchQuery);
