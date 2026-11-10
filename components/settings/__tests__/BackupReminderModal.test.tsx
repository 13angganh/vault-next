/**
 * components/settings/__tests__/BackupReminderModal.test.tsx — Aurum Vault v2.0.0 (Tahap 4B)
 *
 * Maksud: menjaga pengingat backup — KAPAN muncul, KAPAN tidak, dan apa yang tersimpan saat ditutup.
 *  - Muncul 3 dtk setelah vault terbuka bila backup terakhir lebih lama dari interval (belum pernah
 *    backup = selalu dianggap terlambat, berapa pun interval) dan belum ditutup dalam 24 jam terakhir.
 *  - Tidak muncul: vault terkunci, interval 0 ("Tidak pernah"), backup masih baru, sudah ditutup hari ini.
 *  - Interval dibaca dari kunci vault_bkp_ivl lebih dulu, baru dari store.
 *  - "Nanti saja"/Escape/klik latar = tutup + tulis vault_bkp_dism; "Backup Sekarang" = tutup + tulis
 *    vault_bkp_dism + memanggil onOpenBackup.
 * Penyimpanan dan jam sungguhan (localStorage jsdom, fake timers); tidak ada mock modul.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4B): file dibuat (sebelumnya komponen ini tidak punya test).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { BackupReminderModal } from '../BackupReminderModal';
import { useAppStore } from '@/lib/store/appStore';

const NOW = Date.parse('2026-11-03T12:00:00Z');
const H = 60 * 60 * 1000;
/** Dialog tampil setelah jam palsu maju 3 dtk, jadi waktu tutup = NOW + 3000. */
const SHOWN_AT = NOW + 3000;

const dialog = () => screen.queryByRole('alertdialog', { name: 'Sudah waktunya backup!' });
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

function setup(opts: { unlocked?: boolean; storeInterval?: number; ivl?: string; last?: number; dism?: number } = {}) {
  const { unlocked = true, storeInterval = 24, ivl, last, dism } = opts;
  localStorage.clear();
  if (ivl !== undefined) localStorage.setItem('vault_bkp_ivl', ivl);
  if (last !== undefined) localStorage.setItem('vault_bkp_ts', String(last));
  if (dism !== undefined) localStorage.setItem('vault_bkp_dism', String(dism));
  useAppStore.setState({ isUnlocked: unlocked, backupIntervalHrs: storeInterval });
}

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe('BackupReminderModal — kapan muncul', () => {
  it('belum pernah backup: muncul tepat 3 detik setelah vault terbuka (bukan lebih cepat)', () => {
    setup();
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    expect(dialog()).not.toBeInTheDocument();
    tick(2999);
    expect(dialog()).not.toBeInTheDocument();
    tick(1);
    expect(dialog()).toBeInTheDocument();
  });

  it('isi dialog: judul, "Backup terakhir: Belum pernah", penjelasan, dua tombol; dideskripsikan oleh teks backup terakhir', () => {
    setup();
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    const d = screen.getByRole('alertdialog', { name: 'Sudah waktunya backup!' });
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(d).toHaveAccessibleDescription('Backup terakhir: Belum pernah');
    expect(within(d).getByText('Belum pernah')).toBeInTheDocument();
    expect(within(d).getByText('Backup rutin melindungi data kamu dari kehilangan yang tidak terduga.')).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Nanti saja' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Backup Sekarang' })).toBeInTheDocument();
  });

  it('pernah backup lebih lama dari interval: muncul dengan tanggal backup terakhir (bukan "Belum pernah")', () => {
    setup({ last: NOW - 5 * 24 * H });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    const d = screen.getByRole('alertdialog', { name: 'Sudah waktunya backup!' });
    expect(within(d).queryByText('Belum pernah')).not.toBeInTheDocument();
    expect(within(d).getByText(/^(29|30|31) Oktober 2026$/)).toBeInTheDocument();
  });

  it('batas interval: tepat sama dengan interval = BELUM waktunya; lebih 1 ms = waktunya', () => {
    setup({ last: NOW - 24 * H });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(5000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    setup({ last: NOW - 24 * H - 1 });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });

  it('backup masih baru (1 jam lalu): tidak muncul', () => {
    setup({ last: NOW - H });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('interval dibaca dari kunci vault_bkp_ivl lebih dulu: 30 jam lalu + interval 48 → tidak muncul; interval 24 → muncul', () => {
    setup({ last: NOW - 30 * H, ivl: '48', storeInterval: 24 });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(5000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    setup({ last: NOW - 30 * H, ivl: '24', storeInterval: 48 });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });

  it('tanpa vault_bkp_ivl: memakai interval dari store', () => {
    setup({ last: NOW - 30 * H, storeInterval: 48 });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(5000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    setup({ last: NOW - 30 * H, storeInterval: 24 });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });

  it('belum pernah backup + interval panjang (168 jam): tetap muncul', () => {
    setup({ ivl: '168' });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });

  it('interval 0 (dimatikan): tidak pernah muncul — dari kunci maupun dari store', () => {
    setup({ ivl: '0' });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    setup({ storeInterval: 0 });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('vault terkunci: tidak muncul; saat dibuka, mulai hitung 3 detik', () => {
    setup({ unlocked: false });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
    act(() => { useAppStore.setState({ isUnlocked: true }); });
    tick(2999);
    expect(dialog()).not.toBeInTheDocument();
    tick(1);
    expect(dialog()).toBeInTheDocument();
  });

  it('vault dikunci SEBELUM 3 detik habis: pengingat batal (tidak muncul di layar kunci)', () => {
    setup();
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(2000);
    act(() => { useAppStore.setState({ isUnlocked: false }); });
    tick(5000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('sudah ditutup dalam 24 jam terakhir: tidak muncul; ditutup >24 jam lalu: muncul lagi', () => {
    setup({ dism: NOW - H });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    setup({ dism: NOW - 25 * H });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });

  it('batas penutupan: tepat 24 jam lalu = sudah boleh muncul lagi; kurang 1 ms = masih ditahan', () => {
    setup({ dism: NOW - 24 * H + 1 });
    const { unmount } = render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(5000);
    expect(dialog()).not.toBeInTheDocument();
    unmount();

    vi.setSystemTime(NOW); // jam palsu sudah maju 5 dtk di bagian pertama; batas harus diuji TEPAT
    setup({ dism: NOW - 24 * H });
    render(<BackupReminderModal onOpenBackup={() => {}} />);
    tick(3000);
    expect(dialog()).toBeInTheDocument();
  });
});

describe('BackupReminderModal — menutup dan Backup Sekarang', () => {
  function shown(onOpenBackup = vi.fn()) {
    setup();
    render(<BackupReminderModal onOpenBackup={onOpenBackup} />);
    tick(3000);
    return { onOpenBackup, d: screen.getByRole('alertdialog', { name: 'Sudah waktunya backup!' }) };
  }

  it('"Nanti saja": menutup, mencatat waktu tutup (vault_bkp_dism), TIDAK membuka backup', () => {
    const { onOpenBackup, d } = shown();
    fireEvent.click(within(d).getByRole('button', { name: 'Nanti saja' }));
    expect(dialog()).not.toBeInTheDocument();
    expect(localStorage.getItem('vault_bkp_dism')).toBe(String(SHOWN_AT));
    expect(onOpenBackup).not.toHaveBeenCalled();
  });

  it('"Backup Sekarang": menutup, mencatat waktu tutup, memanggil onOpenBackup tepat sekali', () => {
    const { onOpenBackup, d } = shown();
    fireEvent.click(within(d).getByRole('button', { name: 'Backup Sekarang' }));
    expect(dialog()).not.toBeInTheDocument();
    expect(localStorage.getItem('vault_bkp_dism')).toBe(String(SHOWN_AT));
    expect(onOpenBackup).toHaveBeenCalledTimes(1);
  });

  it('Escape = tutup seperti "Nanti saja"', () => {
    const { onOpenBackup } = shown();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(dialog()).not.toBeInTheDocument();
    expect(localStorage.getItem('vault_bkp_dism')).toBe(String(SHOWN_AT));
    expect(onOpenBackup).not.toHaveBeenCalled();
  });

  it('klik latar menutup; klik di dalam dialog TIDAK menutup (latar tak punya role: dicari lewat induk dialog)', () => {
    const { d } = shown();
    fireEvent.click(d);
    expect(dialog()).toBeInTheDocument();
    const overlay = d.parentElement;
    if (!overlay) throw new Error('latar tidak ditemukan');
    fireEvent.click(overlay);
    expect(dialog()).not.toBeInTheDocument();
    expect(localStorage.getItem('vault_bkp_dism')).toBe(String(SHOWN_AT));
  });

  it('fokus awal berada DI DALAM dialog (focus trap)', () => {
    const { d } = shown();
    expect(d.contains(document.activeElement)).toBe(true);
  });

  it('setelah ditutup tidak muncul lagi walau vault dikunci lalu dibuka ulang', () => {
    const { d } = shown();
    fireEvent.click(within(d).getByRole('button', { name: 'Nanti saja' }));
    act(() => { useAppStore.setState({ isUnlocked: false }); });
    act(() => { useAppStore.setState({ isUnlocked: true }); });
    tick(10000);
    expect(dialog()).not.toBeInTheDocument();
  });
});
