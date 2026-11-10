/**
 * components/shell/__tests__/Header.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga header aplikasi yang tampil di semua layar vault:
 *  - gaya navigasi TUNGGAL: mode "bottom" → hanya tanda merek (tanpa hamburger dan tanpa tombol +,
 *    karena + sudah ada di bar bawah); mode "sidebar" → hamburger (aria-expanded ikut sidebarOpen)
 *    dan tombol + (hanya di luar Pengaturan); tidak pernah keduanya sekaligus;
 *  - pencarian: debounce 280 ms (batas persis), hanya nilai terakhir yang diteruskan, tombol hapus
 *    muncul hanya bila ada isi, nilai dari store disinkronkan ke input; atribut pintasan keyboard
 *    (aria-keyshortcuts, data-search-input dipakai AppShell untuk Ctrl/Cmd+K); tidak ada di Pengaturan;
 *  - hitung mundur auto-lock: tampil HANYA bila sisa <= 120 dtk dan > 0 (m:ss, pembatas dua digit),
 *    mati bila autoLockMinutes <= 0, berdetak tiap 1 dtk;
 *  - tombol tema (label mengikuti tema, klik membalik data-theme) dan kunci (memanggil store.lock).
 *
 * Tidak dikunci: pembersihan timer debounce saat unmount (diamati tidak dibersihkan; kecil).
 * Konvensi: jsdom tanpa matchMedia → data-theme di-set di beforeEach; fake timers → act + advance
 * (tanpa findBy/waitFor); uji BATAS persis (N-1 dan N ms).
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Header } from '../Header';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useAppStore } from '@/lib/store/appStore';
import type { NavMode } from '@/lib/navMode';

const NOW = 1_700_000_000_000;
type P = Partial<React.ComponentProps<typeof Header>>;
function renderHeader(props: P = {}) {
  const onAddEntry = vi.fn();
  const onToggleSidebar = vi.fn();
  const base = { onAddEntry, onToggleSidebar, sidebarOpen: false, activeView: 'Aurum Vault', autoLockMinutes: 0, lastActivityAt: NOW, navMode: 'bottom' as NavMode };
  const ui = (p: P) => <ThemeProvider><Header {...base} {...p} /></ThemeProvider>;
  const utils = render(ui(props));
  return { onAddEntry, onToggleSidebar, rerenderWith: (p: P) => utils.rerender(ui({ ...props, ...p })), ...utils };
}
const hamburger = () => screen.queryByRole('button', { name: 'Buka menu' });
const plus = () => screen.queryByRole('button', { name: 'Tambah entri baru' });
const search = () => screen.queryByRole('searchbox', { name: 'Cari entri' }) as HTMLInputElement | null;
const mark = (c: HTMLElement) => c.querySelector('.app-header__mark');
const countdown = (c: HTMLElement) => c.querySelector('.app-header__countdown');

beforeEach(() => {
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.clear();
  useAppStore.setState(useAppStore.getInitialState(), true); // juga memulihkan aksi yang di-spy
});
afterEach(() => { vi.useRealTimers(); });

/* ───────────────────────── navigasi tunggal ───────────────────────── */
describe('Header — gaya navigasi tunggal', () => {
  it('mode "bottom": tanda merek ada; TANPA hamburger dan TANPA tombol + (bar bawah yang memilikinya)', () => {
    const { container } = renderHeader({ navMode: 'bottom' });
    expect(mark(container)).not.toBeNull();
    expect(mark(container)).toHaveAttribute('aria-hidden', 'true');
    expect(hamburger()).not.toBeInTheDocument();
    expect(plus()).not.toBeInTheDocument();
  });

  it('mode "sidebar": hamburger dan tombol + ada; TANPA tanda merek', () => {
    const { container } = renderHeader({ navMode: 'sidebar' });
    expect(hamburger()).toBeInTheDocument();
    expect(plus()).toBeInTheDocument();
    expect(mark(container)).toBeNull();
  });

  it.each([
    ['bottom', 'Aurum Vault'], ['bottom', 'Pengaturan'], ['sidebar', 'Aurum Vault'], ['sidebar', 'Pengaturan'],
  ] as const)('mode %s di layar "%s": tepat satu dari {hamburger, tanda merek} — tidak pernah dobel', (navMode, activeView) => {
    const { container } = renderHeader({ navMode, activeView });
    const adaHamburger = hamburger() !== null;
    const adaMerek = mark(container) !== null;
    expect(adaHamburger !== adaMerek).toBe(true);
    expect(adaHamburger).toBe(navMode === 'sidebar');
  });

  it('hamburger: aria-expanded mengikuti sidebarOpen; klik memanggil onToggleSidebar sekali', () => {
    const a = renderHeader({ navMode: 'sidebar', sidebarOpen: false });
    expect(hamburger()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(hamburger() as HTMLElement);
    expect(a.onToggleSidebar).toHaveBeenCalledTimes(1);
    a.unmount();
    renderHeader({ navMode: 'sidebar', sidebarOpen: true });
    expect(hamburger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('tombol + (sidebar): pintasan Ctrl/Cmd+N dan judul; klik memanggil onAddEntry sekali', () => {
    const { onAddEntry } = renderHeader({ navMode: 'sidebar' });
    expect(plus()).toHaveAttribute('aria-keyshortcuts', 'Control+n Meta+n');
    expect(plus()).toHaveAttribute('title', 'Tambah entri (Ctrl+N)');
    fireEvent.click(plus() as HTMLElement);
    expect(onAddEntry).toHaveBeenCalledTimes(1);
  });

  it('di Pengaturan: tidak ada tombol + (sidebar) dan tidak ada kotak cari', () => {
    renderHeader({ navMode: 'sidebar', activeView: 'Pengaturan' });
    expect(plus()).not.toBeInTheDocument();
    expect(search()).toBeNull();
    expect(hamburger()).toBeInTheDocument();
  });

  it('tema dan kunci selalu ada di kedua mode dan kedua layar', () => {
    for (const navMode of ['bottom', 'sidebar'] as const) {
      for (const activeView of ['Aurum Vault', 'Pengaturan']) {
        const { unmount } = renderHeader({ navMode, activeView });
        expect(screen.getByRole('button', { name: 'Mode terang' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Kunci vault' })).toBeInTheDocument();
        unmount();
      }
    }
  });
});

/* ───────────────────────── pencarian ───────────────────────── */
describe('Header — pencarian', () => {
  it('atribut kotak cari: type=search, placeholder, pintasan, penanda untuk AppShell, tanpa isi otomatis', () => {
    renderHeader();
    const s = search();
    expect(s).not.toBeNull();
    if (!s) return;
    expect(s).toHaveAttribute('type', 'search');
    expect(s).toHaveAttribute('placeholder', 'Cari di brankas…');
    expect(s).toHaveAttribute('aria-keyshortcuts', 'Control+k Meta+k');
    expect(s).toHaveAttribute('data-search-input');
    expect(s).toHaveAttribute('autocomplete', 'off');
    expect(s.value).toBe('');
  });

  it('mengetik memperbarui input SEGERA; store baru berubah tepat 280 ms (279 ms belum)', () => {
    vi.useFakeTimers();
    renderHeader();
    const s = search() as HTMLInputElement;
    fireEvent.change(s, { target: { value: 'gmail' } });
    expect(s.value).toBe('gmail');
    act(() => { vi.advanceTimersByTime(279); });
    expect(useAppStore.getState().searchQuery).toBe('');
    act(() => { vi.advanceTimersByTime(1); });
    expect(useAppStore.getState().searchQuery).toBe('gmail');
  });

  it('mengetik beruntun: jeda dihitung dari ketikan TERAKHIR dan hanya nilai terakhir yang diteruskan (sekali)', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    useAppStore.setState({ setSearchQuery: spy });
    renderHeader();
    const s = search() as HTMLInputElement;
    fireEvent.change(s, { target: { value: 'g' } });
    act(() => { vi.advanceTimersByTime(200); });
    fireEvent.change(s, { target: { value: 'gm' } });
    act(() => { vi.advanceTimersByTime(200); });
    expect(spy).not.toHaveBeenCalled();
    fireEvent.change(s, { target: { value: 'gma' } });
    act(() => { vi.advanceTimersByTime(279); });
    expect(spy).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('gma');
  });

  it('tombol hapus muncul hanya bila ada isi; klik mengosongkan input dan (setelah debounce) store', () => {
    vi.useFakeTimers();
    renderHeader();
    const s = search() as HTMLInputElement;
    expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).not.toBeInTheDocument();
    fireEvent.change(s, { target: { value: 'abc' } });
    act(() => { vi.advanceTimersByTime(280); });
    expect(useAppStore.getState().searchQuery).toBe('abc');
    fireEvent.click(screen.getByRole('button', { name: 'Hapus pencarian' }));
    expect(s.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Hapus pencarian' })).not.toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(280); });
    expect(useAppStore.getState().searchQuery).toBe('');
  });

  it('nilai awal dari store tampil di input dengan tombol hapus', () => {
    useAppStore.setState({ searchQuery: 'awal' });
    renderHeader();
    expect((search() as HTMLInputElement).value).toBe('awal');
    expect(screen.getByRole('button', { name: 'Hapus pencarian' })).toBeInTheDocument();
  });

  it('perubahan searchQuery dari luar (mis. filter di tempat lain) menyinkronkan input', () => {
    renderHeader();
    act(() => { useAppStore.setState({ searchQuery: 'dari-luar' }); });
    expect((search() as HTMLInputElement).value).toBe('dari-luar');
    act(() => { useAppStore.setState({ searchQuery: '' }); });
    expect((search() as HTMLInputElement).value).toBe('');
  });
});

/* ───────────────────────── hitung mundur auto-lock ───────────────────────── */
describe('Header — hitung mundur auto-lock', () => {
  /** sisa detik → lastActivityAt untuk autoLockMinutes=5 (300 dtk) pada jam palsu NOW. */
  const idleFor = (remainingSec: number) => NOW - (300 - remainingSec) * 1000;
  const setNow = () => { vi.useFakeTimers(); vi.setSystemTime(NOW); };

  it('autoLockMinutes <= 0 → tidak pernah tampil', () => {
    setNow();
    const a = renderHeader({ autoLockMinutes: 0, lastActivityAt: NOW - 10_000_000 });
    expect(countdown(a.container)).toBeNull();
    a.unmount();
    const b = renderHeader({ autoLockMinutes: -1, lastActivityAt: NOW });
    expect(countdown(b.container)).toBeNull();
  });

  it('sisa tepat 120 dtk → tampil "2:00" (batas termasuk); sisa 121 dtk → belum tampil', () => {
    setNow();
    const a = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(120) });
    expect(countdown(a.container)?.textContent?.trim()).toBe('2:00');
    expect(countdown(a.container)).toHaveAttribute('title', 'Auto-lock dalam 2:00');
    a.unmount();
    const b = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(121) });
    expect(countdown(b.container)).toBeNull();
  });

  it('sisa 120,001 dtk (sedikit di atas batas) → belum tampil', () => {
    setNow();
    const { container } = renderHeader({ autoLockMinutes: 5, lastActivityAt: NOW - 179_999 });
    expect(countdown(container)).toBeNull();
  });

  it.each([
    [61, '1:01'], [60, '1:00'], [59, '0:59'], [9, '0:09'], [1, '0:01'],
  ])('sisa %i dtk → "%s" (menit:detik dengan detik dua digit)', (sisa, teks) => {
    setNow();
    const { container } = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(sisa) });
    expect(countdown(container)?.textContent?.trim()).toBe(teks);
  });

  it('detik dibulatkan KE BAWAH: sisa 59,6 dtk → "0:59" (bukan "0:60"); 90,6 dtk → "1:30"', () => {
    setNow();
    const a = renderHeader({ autoLockMinutes: 5, lastActivityAt: NOW - (300 - 59.6) * 1000 });
    expect(countdown(a.container)?.textContent?.trim()).toBe('0:59');
    a.unmount();
    const b = renderHeader({ autoLockMinutes: 5, lastActivityAt: NOW - (300 - 90.6) * 1000 });
    expect(countdown(b.container)?.textContent?.trim()).toBe('1:30');
  });

  it('auto-lock nonaktif (0) tidak pernah menampilkan hitung mundur, juga bila jam mundur (lastActivityAt di masa depan)', () => {
    setNow();
    const { container } = renderHeader({ autoLockMinutes: 0, lastActivityAt: NOW + 60_000 });
    expect(countdown(container)).toBeNull();
  });

  it('sisa 0 dtk atau sudah lewat → tidak tampil', () => {
    setNow();
    const a = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(0) });
    expect(countdown(a.container)).toBeNull();
    a.unmount();
    const b = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(-30) });
    expect(countdown(b.container)).toBeNull();
  });

  it('berdetak tiap 1 dtk: 2:00 → 1:59 setelah 1000 ms (999 ms belum berubah); hilang di 0', () => {
    setNow();
    const { container } = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(120) });
    act(() => { vi.advanceTimersByTime(999); });
    expect(countdown(container)?.textContent?.trim()).toBe('2:00');
    act(() => { vi.advanceTimersByTime(1); });
    expect(countdown(container)?.textContent?.trim()).toBe('1:59');
    act(() => { vi.advanceTimersByTime(119_000); });
    expect(countdown(container)).toBeNull();
  });

  it('interval dibersihkan saat unmount (tidak ada timer tersisa)', () => {
    setNow();
    const { unmount } = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(90) });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('autoLockMinutes diubah menjadi 0 → hitung mundur hilang; lastActivityAt baru → mulai ulang', () => {
    setNow();
    const { container, rerenderWith } = renderHeader({ autoLockMinutes: 5, lastActivityAt: idleFor(90) });
    expect(countdown(container)?.textContent?.trim()).toBe('1:30');
    rerenderWith({ autoLockMinutes: 5, lastActivityAt: idleFor(300) });
    expect(countdown(container)).toBeNull(); // aktivitas baru: sisa 300 dtk > 120
    rerenderWith({ autoLockMinutes: 5, lastActivityAt: idleFor(90) });
    expect(countdown(container)).not.toBeNull();
    rerenderWith({ autoLockMinutes: 0, lastActivityAt: idleFor(90) });
    expect(countdown(container)).toBeNull();
  });
});

/* ───────────────────────── tema dan kunci ───────────────────────── */
describe('Header — tema dan kunci', () => {
  it('label tombol tema mengikuti tema; klik membalik data-theme dan label', () => {
    renderHeader();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    fireEvent.click(screen.getByRole('button', { name: 'Mode terang' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Mode gelap' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mode terang' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mode gelap' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('tombol kunci: nama "Kunci vault" dan klik memanggil store.lock sekali', () => {
    const lock = vi.fn();
    useAppStore.setState({ lock });
    renderHeader();
    const b = screen.getByRole('button', { name: 'Kunci vault' });
    expect(b).toHaveAttribute('title', 'Kunci vault');
    fireEvent.click(b);
    expect(lock).toHaveBeenCalledTimes(1);
  });
});
