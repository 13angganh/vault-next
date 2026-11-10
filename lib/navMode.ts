import { create } from 'zustand';

/** Gaya navigasi utama — user memilih SALAH SATU di Pengaturan (tidak pernah dobel). */
export type NavMode = 'bottom' | 'sidebar';
const KEY = 'vault_nav_mode';
const read = (): NavMode => {
  try { return localStorage.getItem(KEY) === 'sidebar' ? 'sidebar' : 'bottom'; } catch { return 'bottom'; }
};
export const useNavMode = create<{ mode: NavMode; setMode: (m: NavMode) => void }>((set) => ({
  mode: read(),
  setMode: (m) => { try { localStorage.setItem(KEY, m); } catch { /* abaikan */ } set({ mode: m }); },
}));
