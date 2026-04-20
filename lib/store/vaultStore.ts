import { create } from 'zustand';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { encrypt, decrypt, deriveKey, type EncryptedPayload } from '@/lib/crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntryCategory =
  | 'password'
  | 'kartu'
  | 'catatan'
  | 'wifi'
  | 'email'
  | 'lainnya';

export interface VaultEntry {
  id: string;
  category: EntryCategory;
  title: string;
  username?: string;
  email?: string;
  password?: string;
  url?: string;
  notes?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCVV?: string;
  wifiSSID?: string;
  wifiPassword?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
}

export type SortField = 'title' | 'updatedAt' | 'createdAt' | 'category';
export type SortOrder = 'asc' | 'desc';

export type ActiveView = 'semua' | EntryCategory | 'favorit' | 'baru';

interface VaultState {
  // Data
  entries: VaultEntry[];
  isLoaded: boolean;
  encryptionKey: CryptoKey | null;

  // View state
  activeView: ActiveView;
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;

  // Selection & editing
  selectedId: string | null;
  editingId: string | null;
  isCreating: boolean;
  pendingCategory: EntryCategory | null;

  // Loading / error
  isLoading: boolean;
  error: string | null;

  // Actions — data
  loadVault: (masterKey: string, salt: string) => Promise<void>;
  saveVault: () => Promise<void>;
  clearVault: () => void;

  // Actions — CRUD
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, patch: Partial<VaultEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Actions — view
  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setSelectedId: (id: string | null) => void;
  startCreating: (category?: EntryCategory) => void;
  stopCreating: () => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;

  // Derived
  getFilteredEntries: () => VaultEntry[];
  getEntry: (id: string) => VaultEntry | undefined;
  getCategoryCount: (category: EntryCategory | 'semua' | 'favorit') => number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeSearch(str: string): string {
  return str.toLowerCase().trim();
}

function matchesSearch(entry: VaultEntry, query: string): boolean {
  if (!query) return true;
  const q = normalizeSearch(query);
  return (
    normalizeSearch(entry.title).includes(q) ||
    (entry.username ? normalizeSearch(entry.username).includes(q) : false) ||
    (entry.email ? normalizeSearch(entry.email).includes(q) : false) ||
    (entry.url ? normalizeSearch(entry.url).includes(q) : false) ||
    (entry.notes ? normalizeSearch(entry.notes).includes(q) : false) ||
    (entry.wifiSSID ? normalizeSearch(entry.wifiSSID).includes(q) : false)
  );
}

function sortEntries(entries: VaultEntry[], field: SortField, order: SortOrder): VaultEntry[] {
  return [...entries].sort((a, b) => {
    let cmp = 0;
    if (field === 'title') {
      cmp = a.title.localeCompare(b.title, 'id');
    } else if (field === 'category') {
      cmp = a.category.localeCompare(b.category);
    } else {
      cmp = a[field] - b[field];
    }
    return order === 'asc' ? cmp : -cmp;
  });
}

// ─── Dummy encryption key fallback (client-only) ──────────────────────────────
// Vault data encrypted with derivedKey from master password.
// For simplicity: use PIN hash as raw key material when no master key provided.

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVaultStore = create<VaultState>((set, get) => ({
  entries: [],
  isLoaded: false,
  encryptionKey: null,

  activeView: 'semua',
  searchQuery: '',
  sortField: 'updatedAt',
  sortOrder: 'desc',

  selectedId: null,
  editingId: null,
  isCreating: false,
  pendingCategory: null,

  isLoading: false,
  error: null,

  // ─── Load ─────────────────────────────────────────────────────────────────
  loadVault: async (masterKey: string, salt: string) => {
    set({ isLoading: true, error: null });
    try {
      const cryptoKey = await deriveKey(masterKey, salt);
      const raw = storage.getJSON<EncryptedPayload>(STORAGE_KEYS.VAULT_DATA);
      if (!raw) {
        set({ entries: [], isLoaded: true, isLoading: false, encryptionKey: cryptoKey });
        return;
      }
      const decrypted = await decrypt(raw, cryptoKey);
      const entries: VaultEntry[] = JSON.parse(decrypted);
      set({ entries, isLoaded: true, isLoading: false, encryptionKey: cryptoKey });
    } catch {
      set({ entries: [], isLoaded: true, isLoading: false, error: null });
    }
  },

  // ─── Save ─────────────────────────────────────────────────────────────────
  saveVault: async () => {
    const { entries, encryptionKey } = get();
    try {
      let key = encryptionKey;
      if (!key) {
        const salt = storage.get(STORAGE_KEYS.SALT);
        const masterHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
        if (!salt || !masterHash) return;
        key = await deriveKey(masterHash, salt);
        set({ encryptionKey: key });
      }
      const json = JSON.stringify(entries);
      const encrypted = await encrypt(json, key);
      storage.setJSON(STORAGE_KEYS.VAULT_DATA, encrypted);
    } catch (e) {
      console.warn('[Vault] Gagal menyimpan data:', e);
    }
  },

  clearVault: () => {
    set({
      entries: [],
      isLoaded: false,
      encryptionKey: null,
      selectedId: null,
      editingId: null,
      isCreating: false,
      searchQuery: '',
      activeView: 'semua',
    });
  },

  // ─── CRUD ──────────────────────────────────────────────────────────────────
  addEntry: async (entry) => {
    const now = Date.now();
    const newEntry: VaultEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      isFavorite: entry.isFavorite ?? false,
    };
    set((s) => ({ entries: [newEntry, ...s.entries], isCreating: false, selectedId: newEntry.id }));
    await get().saveVault();
  },

  updateEntry: async (id, patch) => {
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e
      ),
      editingId: null,
    }));
    await get().saveVault();
  },

  deleteEntry: async (id) => {
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      editingId: null,
    }));
    await get().saveVault();
  },

  toggleFavorite: async (id) => {
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, isFavorite: !e.isFavorite, updatedAt: Date.now() } : e
      ),
    }));
    await get().saveVault();
  },

  // ─── View ──────────────────────────────────────────────────────────────────
  setActiveView: (view) => set({ activeView: view, selectedId: null, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  toggleSortOrder: () => set((s) => ({ sortOrder: s.sortOrder === 'asc' ? 'desc' : 'asc' })),
  setSelectedId: (id) => set({ selectedId: id, editingId: null }),

  startCreating: (category) => set({ isCreating: true, pendingCategory: category ?? null, selectedId: null, editingId: null }),
  stopCreating: () => set({ isCreating: false, pendingCategory: null }),
  startEditing: (id) => set({ editingId: id, isCreating: false }),
  stopEditing: () => set({ editingId: null }),

  // ─── Derived ───────────────────────────────────────────────────────────────
  getFilteredEntries: () => {
    const { entries, activeView, searchQuery, sortField, sortOrder } = get();

    let filtered = entries;

    // Filter by view
    if (activeView === 'favorit') {
      filtered = filtered.filter((e) => e.isFavorite);
    } else if (activeView === 'baru') {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 hari
      filtered = filtered.filter((e) => e.createdAt >= cutoff);
    } else if (activeView !== 'semua') {
      filtered = filtered.filter((e) => e.category === activeView);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((e) => matchesSearch(e, searchQuery));
    }

    return sortEntries(filtered, sortField, sortOrder);
  },

  getEntry: (id) => get().entries.find((e) => e.id === id),

  getCategoryCount: (category) => {
    const { entries } = get();
    if (category === 'semua') return entries.length;
    if (category === 'favorit') return entries.filter((e) => e.isFavorite).length;
    return entries.filter((e) => e.category === category).length;
  },
}));
