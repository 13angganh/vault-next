/**
 * components/shell/__tests__/AppShell.nav.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga KOMPOSISI navigasi di AppShell (keputusan terkunci: pengguna memilih SATU gaya,
 * tidak pernah tampil dobel) dan tombol/pintasan "tambah entri":
 *  - vault_nav_mode "bottom" → BottomNav + Header bermerek, TANPA Sidebar/hamburger; "sidebar" →
 *    Sidebar + hamburger, TANPA BottomNav; berganti saat mode diganti; atribut data-nav mengikuti;
 *  - pergantian layar vault ↔ Pengaturan lewat BottomNav, Sidebar, dan onClose Pengaturan;
 *  - handleAddEntry: kembali ke vault, filter "all", lalu openAddForm TEPAT 80 ms kemudian (79 ms
 *    belum); dari BottomNav, dari tombol + di Header (sidebar), dan pintasan Ctrl/Cmd+N;
 *  - pintasan: Ctrl/Cmd+N diabaikan saat mengetik di input; Ctrl/Cmd+K memfokuskan kotak cari;
 *    Ctrl/Cmd+/ membuka/menutup sidebar; Escape menutup sidebar; tombol tanpa modifier diabaikan;
 *  - Header menerima autoLockMinutes/lastActivityAt dari store; BackupModal dibuka lewat pengingat.
 *
 * Anak-anak berat di-stub (VaultListView, SettingsView, Sidebar, pengingat/modal backup,
 * AutoLockManager); Header dan BottomNav ASLI. Tidak diuji: bar pembaruan service worker (butuh
 * navigator.serviceWorker; cek manual di perangkat) — lihat daftar "tidak diverifikasi".
 *
 * Konvensi: fake timers terbatas pada setTimeout (framer-motion tetap normal); role/label/teks.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { useAppStore } from '@/lib/store/appStore';
import { useNavMode } from '@/lib/navMode';

const { openAddForm } = vi.hoisted(() => ({ openAddForm: vi.fn() }));

vi.mock('@/components/shell/AutoLockManager', () => ({ AutoLockManager: () => null }));
vi.mock('@/components/vault/VaultListView', async () => {
  const React = await import('react');
  return {
    VaultListView: React.forwardRef(function VaultListViewStub(_p: object, ref: React.Ref<{ openAddForm: () => void }>) {
      React.useImperativeHandle(ref, () => ({ openAddForm }));
      return <div>Daftar vault stub</div>;
    }),
  };
});
vi.mock('@/components/settings/SettingsView', () => ({
  SettingsView: (p: { onClose: () => void }) => (<div><p>Layar pengaturan stub</p><button onClick={p.onClose}>Tutup pengaturan stub</button></div>),
}));
vi.mock('@/components/shell/Sidebar', () => ({
  Sidebar: (p: { open: boolean; onClose: () => void; onSettingsClick: () => void; onNavVault: () => void }) => (
    <aside aria-label="Sidebar stub" data-open={String(p.open)}>
      <button onClick={p.onClose}>sb-tutup</button>
      <button onClick={p.onSettingsClick}>sb-pengaturan</button>
      <button onClick={p.onNavVault}>sb-vault</button>
    </aside>
  ),
}));
vi.mock('@/components/settings/BackupReminderModal', () => ({
  BackupReminderModal: (p: { onOpenBackup: () => void }) => <button onClick={p.onOpenBackup}>pengingat-buka-backup</button>,
}));
vi.mock('@/components/settings/BackupModal', () => ({
  BackupModal: (p: { onClose: () => void }) => (<div role="dialog" aria-label="Backup stub"><button onClick={p.onClose}>backup-tutup</button></div>),
}));

const setMode = (m: 'bottom' | 'sidebar') => act(() => { useNavMode.setState({ mode: m }); });
const bottomNav = () => screen.queryByRole('navigation', { name: 'Navigasi utama' });
const sidebar = () => screen.queryByLabelText('Sidebar stub');
const hamburger = () => screen.queryByRole('button', { name: 'Buka menu' });
const shell = (c: HTMLElement) => c.querySelector('.app-shell');

beforeEach(() => {
  localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'dark');
  useAppStore.setState(useAppStore.getInitialState(), true);
  useNavMode.setState({ mode: 'bottom' });
  openAddForm.mockReset();
});
afterEach(() => { vi.useRealTimers(); });

/* ───────────────────────── navigasi tunggal ───────────────────────── */
describe('AppShell — satu gaya navigasi', () => {
  it('mode "bottom": BottomNav ada; Sidebar dan hamburger TIDAK ada; data-nav="bottom"', () => {
    const { container } = render(<AppShell />);
    expect(bottomNav()).toBeInTheDocument();
    expect(sidebar()).not.toBeInTheDocument();
    expect(hamburger()).not.toBeInTheDocument();
    expect(shell(container)).toHaveAttribute('data-nav', 'bottom');
  });

  it('mode "sidebar": Sidebar dan hamburger ada; BottomNav TIDAK ada; data-nav="sidebar"', () => {
    setMode('sidebar');
    const { container } = render(<AppShell />);
    expect(sidebar()).toBeInTheDocument();
    expect(hamburger()).toBeInTheDocument();
    expect(bottomNav()).not.toBeInTheDocument();
    expect(shell(container)).toHaveAttribute('data-nav', 'sidebar');
  });

  it.each(['bottom', 'sidebar'] as const)('mode %s: tepat SATU dari {BottomNav, Sidebar} — tidak pernah dobel, di layar vault maupun Pengaturan', (mode) => {
    setMode(mode);
    render(<AppShell />);
    const hitung = () => [bottomNav(), sidebar()].filter(Boolean).length;
    expect(hitung()).toBe(1);
    fireEvent.click(mode === 'bottom' ? within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' }) : screen.getByRole('button', { name: 'sb-pengaturan' }));
    expect(screen.getByText('Layar pengaturan stub')).toBeInTheDocument();
    expect(hitung()).toBe(1);
  });

  it('mengganti mode saat berjalan menukar navigasi (tanpa sisa dari gaya sebelumnya)', () => {
    render(<AppShell />);
    expect(bottomNav()).toBeInTheDocument();
    setMode('sidebar');
    expect(bottomNav()).not.toBeInTheDocument();
    expect(sidebar()).toBeInTheDocument();
    setMode('bottom');
    expect(sidebar()).not.toBeInTheDocument();
    expect(bottomNav()).toBeInTheDocument();
  });
});

/* ───────────────────────── layar vault ↔ Pengaturan ───────────────────────── */
describe('AppShell — pergantian layar', () => {
  it('awal: layar vault (bukan Pengaturan)', () => {
    render(<AppShell />);
    expect(screen.getByText('Daftar vault stub')).toBeInTheDocument();
    expect(screen.queryByText('Layar pengaturan stub')).not.toBeInTheDocument();
  });

  it('BottomNav Pengaturan → layar Pengaturan (kotak cari header hilang); Brankas → kembali ke vault', () => {
    render(<AppShell />);
    expect(screen.getByRole('searchbox', { name: 'Cari entri' })).toBeInTheDocument();
    fireEvent.click(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' }));
    expect(screen.getByText('Layar pengaturan stub')).toBeInTheDocument();
    expect(screen.queryByText('Daftar vault stub')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox', { name: 'Cari entri' })).not.toBeInTheDocument();
    expect(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' })).toHaveAttribute('aria-current', 'page');
    expect(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Brankas' })).not.toHaveAttribute('aria-current');
    fireEvent.click(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Brankas' }));
    expect(screen.getByText('Daftar vault stub')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cari entri' })).toBeInTheDocument();
  });

  it('onClose Pengaturan → kembali ke vault', () => {
    render(<AppShell />);
    fireEvent.click(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutup pengaturan stub' }));
    expect(screen.getByText('Daftar vault stub')).toBeInTheDocument();
  });

  it('Sidebar: onSettingsClick → Pengaturan; onNavVault → vault; onClose → sidebar tertutup', () => {
    setMode('sidebar');
    render(<AppShell />);
    fireEvent.click(hamburger() as HTMLElement);
    expect(sidebar()).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'sb-tutup' }));
    expect(sidebar()).toHaveAttribute('data-open', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'sb-pengaturan' }));
    expect(screen.getByText('Layar pengaturan stub')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'sb-vault' }));
    expect(screen.getByText('Daftar vault stub')).toBeInTheDocument();
  });

  it('Header menerima judul layar: di Pengaturan hamburger tetap ada (sidebar) tetapi + hilang', () => {
    setMode('sidebar');
    render(<AppShell />);
    expect(screen.getByRole('button', { name: 'Tambah entri baru' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'sb-pengaturan' }));
    expect(screen.queryByRole('button', { name: 'Tambah entri baru' })).not.toBeInTheDocument();
  });
});

/* ───────────────────────── tambah entri ───────────────────────── */
describe('AppShell — tambah entri (handleAddEntry)', () => {
  const tekanTambah = () => fireEvent.click(screen.getByRole('button', { name: 'Tambah entri baru' }));

  it('BottomNav "+": openAddForm dipanggil TEPAT 80 ms kemudian (79 ms belum), sekali', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<AppShell />);
    tekanTambah();
    act(() => { vi.advanceTimersByTime(79); });
    expect(openAddForm).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(openAddForm).toHaveBeenCalledTimes(1);
  });

  it('dari Pengaturan: kembali ke layar vault, filter menjadi "all", lalu membuka form', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    useAppStore.setState({ currentFilter: 'bin' });
    render(<AppShell />);
    fireEvent.click(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' }));
    expect(screen.getByText('Layar pengaturan stub')).toBeInTheDocument();
    tekanTambah();
    expect(screen.getByText('Daftar vault stub')).toBeInTheDocument();
    expect(useAppStore.getState().currentFilter).toBe('all');
    act(() => { vi.advanceTimersByTime(80); });
    expect(openAddForm).toHaveBeenCalledTimes(1);
  });

  it('mode sidebar: tombol + di Header menjalankan alur yang sama', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    setMode('sidebar');
    render(<AppShell />);
    tekanTambah();
    act(() => { vi.advanceTimersByTime(80); });
    expect(openAddForm).toHaveBeenCalledTimes(1);
  });
});

/* ───────────────────────── pintasan keyboard ───────────────────────── */
describe('AppShell — pintasan keyboard', () => {
  const tombol = (init: KeyboardEventInit, target: Window | HTMLElement = window) => fireEvent.keyDown(target, init);

  it.each([['Ctrl', { ctrlKey: true }], ['Cmd', { metaKey: true }]])('%s+N membuka form tambah (80 ms) dan default-nya dibatalkan', (_n, mod) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<AppShell />);
    expect(tombol({ key: 'n', ...mod })).toBe(false);
    act(() => { vi.advanceTimersByTime(80); });
    expect(openAddForm).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+N saat mengetik di input DIABAIKAN (tidak membuka form, default tidak dibatalkan)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<AppShell />);
    const s = screen.getByRole('searchbox', { name: 'Cari entri' });
    expect(tombol({ key: 'n', ctrlKey: true }, s)).toBe(true);
    act(() => { vi.advanceTimersByTime(200); });
    expect(openAddForm).not.toHaveBeenCalled();
  });

  it.each(['textarea', 'select'] as const)('Ctrl+N saat fokus di <%s> juga DIABAIKAN', (tag) => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<AppShell />);
    const el = document.body.appendChild(document.createElement(tag));
    expect(tombol({ key: 'n', ctrlKey: true }, el)).toBe(true);
    act(() => { vi.advanceTimersByTime(200); });
    expect(openAddForm).not.toHaveBeenCalled();
    el.remove();
  });

  it('"n" tanpa modifier diabaikan', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    render(<AppShell />);
    expect(tombol({ key: 'n' })).toBe(true);
    act(() => { vi.advanceTimersByTime(200); });
    expect(openAddForm).not.toHaveBeenCalled();
  });

  it.each([['Ctrl', { ctrlKey: true }], ['Cmd', { metaKey: true }]])('%s+K memfokuskan kotak cari dan default dibatalkan', (_n, mod) => {
    render(<AppShell />);
    expect(document.activeElement).not.toBe(screen.getByRole('searchbox', { name: 'Cari entri' }));
    expect(tombol({ key: 'k', ...mod })).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Cari entri' }));
  });

  it('"k" tanpa modifier tidak memindahkan fokus', () => {
    render(<AppShell />);
    expect(tombol({ key: 'k' })).toBe(true);
    expect(document.activeElement).not.toBe(screen.getByRole('searchbox', { name: 'Cari entri' }));
  });

  it('Ctrl+K di layar Pengaturan (tanpa kotak cari) tidak menimbulkan galat', () => {
    render(<AppShell />);
    fireEvent.click(within(bottomNav() as HTMLElement).getByRole('button', { name: 'Pengaturan' }));
    // galat di dalam listener tidak dilempar ulang oleh jsdom: tangkap lewat event 'error' window
    const galat: unknown[] = [];
    const tangkap = (ev: ErrorEvent) => { galat.push(ev.error); ev.preventDefault(); };
    window.addEventListener('error', tangkap);
    tombol({ key: 'k', ctrlKey: true });
    window.removeEventListener('error', tangkap);
    expect(galat).toEqual([]);
  });

  it('Ctrl+/ membuka lalu menutup sidebar; Escape menutupnya; "/" tanpa modifier diabaikan', () => {
    setMode('sidebar');
    render(<AppShell />);
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    expect(tombol({ key: '/', ctrlKey: true })).toBe(false);
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    expect(tombol({ key: '/', metaKey: true })).toBe(false);
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    tombol({ key: '/', ctrlKey: true });
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
    tombol({ key: 'Escape' });
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    tombol({ key: '/' });
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
  });

  it('hamburger membuka sidebar; klik lagi menutup', () => {
    setMode('sidebar');
    render(<AppShell />);
    fireEvent.click(hamburger() as HTMLElement);
    expect(sidebar()).toHaveAttribute('data-open', 'true');
    fireEvent.click(hamburger() as HTMLElement);
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });

  it('pintasan dilepas saat AppShell di-unmount (Ctrl+K tak lagi ditangani: default tidak dibatalkan)', () => {
    const { unmount } = render(<AppShell />);
    expect(tombol({ key: 'k', ctrlKey: true })).toBe(false); // terpasang
    unmount();
    expect(tombol({ key: 'k', ctrlKey: true })).toBe(true); // sudah dilepas
  });
});

/* ───────────────────────── data ke Header, backup ───────────────────────── */
describe('AppShell — penyambungan lain', () => {
  it('Header menerima autoLockMinutes dan lastActivityAt dari store (hitung mundur tampil saat sisa <= 120 dtk)', () => {
    useAppStore.setState({ autoLockMinutes: 5, lastActivityAt: Date.now() - 200_000 });
    const { container } = render(<AppShell />);
    const cd = container.querySelector('.app-header__countdown');
    expect(cd).not.toBeNull();
    expect(cd?.getAttribute('title')).toMatch(/^Auto-lock dalam 1:\d\d$/);
  });

  it('autoLockMinutes 0 → tanpa hitung mundur', () => {
    useAppStore.setState({ autoLockMinutes: 0, lastActivityAt: Date.now() - 200_000 });
    const { container } = render(<AppShell />);
    expect(container.querySelector('.app-header__countdown')).toBeNull();
  });

  it('pengingat backup membuka BackupModal; onClose menutupnya', () => {
    render(<AppShell />);
    expect(screen.queryByRole('dialog', { name: 'Backup stub' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'pengingat-buka-backup' }));
    expect(screen.getByRole('dialog', { name: 'Backup stub' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'backup-tutup' }));
    expect(screen.queryByRole('dialog', { name: 'Backup stub' })).not.toBeInTheDocument();
  });
});
