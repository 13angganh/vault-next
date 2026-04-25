/**
 * Vault Next — App Store (Zustand)
 * Global state untuk seluruh aplikasi.
 * Semua akses state via hook ini — jangan buat state lokal di page.
 */

import { create } from 'zustand';
import type { VaultEntry, VaultMeta, CustomCategory } from '@/lib/types';
import {
  lsGet, lsSet, lsGetNum, lsSetNum, lsGetBool, lsSetBool, lsGetJson, lsSetJson,
  LS_AUTOLOCK, LS_AUTOSAVE, LS_BKPIVL, LS_CATS, LS_BIO_ENABLED, LS_BIO_CRED_ID,
} from '@/lib/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppView = 'lock' | 'app';
export type FilterType = 'all' | 'fav' | 'bin' | string; // string = cat id

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
  customCats:      CustomCategory[];

  // ── UI State ──
  currentFilter:   FilterType;
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

  // ── Actions: Categories ──
  setCustomCats:    (cats: CustomCategory[]) => void;
  addCustomCat:     (cat: CustomCategory) => void;
  removeCustomCat:  (id: string) => void;

  // ── Actions: UI ──
  setFilter:       (f: FilterType) => void;
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
  customCats:      lsGetJson<CustomCategory[]>(LS_CATS, []),

  currentFilter:   'all',
  searchQuery:     '',
  expandedIds:     [],
  selectedIds:     [],

  pwVisible:       {},
  seedVisible:     {},

  pinBuffer:       '',
  pinAttempts:     0,
  pinLocked:       false,
  pinLockedUntil:  0,

  backupIntervalHrs: lsGetNum(LS_BKPIVL, 24),
  autoSaveEnabled:   lsGetBool(LS_AUTOSAVE, true),
  biometricEnabled:  lsGetBool(LS_BIO_ENABLED, false),
  biometricCredId:   lsGet(LS_BIO_CRED_ID),

  // ── Actions: Auth ──────────────────────────────────────────────────────────

  unlock: (pw) => set({
    isUnlocked: true,
    masterPw: pw,
    lastActivityAt: Date.now(),
    pinBuffer: '',
    pinAttempts: 0,
  }),

  lock: () => set({
    isUnlocked: false,
    masterPw: '',
    vault: [],
    recycleBin: [],
    vaultMeta: null,
    lockedIds: [],
    expandedIds: [],
    selectedIds: [],
    pwVisible: {},
    seedVisible: {},
    pinBuffer: '',
    currentFilter: 'all',
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

  // ── Actions: Categories ────────────────────────────────────────────────────

  setCustomCats: (cats) => {
    lsSetJson(LS_CATS, cats);
    set({ customCats: cats });
  },

  addCustomCat: (cat) => {
    const next = [...get().customCats, cat];
    lsSetJson(LS_CATS, next);
    set({ customCats: next });
  },

  removeCustomCat: (id) => {
    const next = get().customCats.filter((c) => c.id !== id);
    lsSetJson(LS_CATS, next);
    set({ customCats: next });
  },

  // ── Actions: UI ────────────────────────────────────────────────────────────

  setFilter:      (f) => set({ currentFilter: f, searchQuery: '', expandedIds: [], selectedIds: [] }),
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
    if (curr.length < 6) set({ pinBuffer: curr + digit });
  },
  clearPin: () => set({ pinBuffer: '' }),

  incrementPinAttempts: () => {
    const n = get().pinAttempts + 1;
    set({ pinAttempts: n });
  },
  resetPinAttempts: () => set({ pinAttempts: 0, pinLocked: false, pinLockedUntil: 0 }),

  setPinLocked: (until) => set({ pinLocked: true, pinLockedUntil: until, pinBuffer: '' }),

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
    set({ biometricCredId: id });
  },
}));

// ─── Selector hooks (shortcut) ────────────────────────────────────────────────

export const useIsUnlocked    = () => useAppStore((s) => s.isUnlocked);
export const useVault         = () => useAppStore((s) => s.vault);
export const useCurrentFilter = () => useAppStore((s) => s.currentFilter);
export const useSearchQuery   = () => useAppStore((s) => s.searchQuery);
