/**
 * components/lock/__tests__/LockScreen.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Layar kunci: pilihan panel awal (setup / master / PIN), PIN login dengan panjang dari kunci
 * BARU vault_pin_len ("4"|"6"; ABSEN = PIN lama 4–8 digit → papan 8 digit + tombol Buka),
 * pembatasan percobaan (vault_pin_attempts / vault_pin_locked_until, 5x → kunci 5 menit),
 * master password, masuk via recovery phrase, dan perakitan ke SetupFlow.
 * vaultService DI-MOCK: kripto/penyimpanannya diuji di vaultService.test.ts & dataCompat.test.ts;
 * di sini yang dijaga adalah orkestrasi UI → panggilan service → efek di store/storage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LockScreen } from '../LockScreen';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useAppStore } from '@/lib/store/appStore';
import * as svc from '@/lib/vaultService';
import type { UnlockPayload } from '@/lib/vaultService';

vi.mock('@/lib/vaultService', () => ({
  hasVaultData: vi.fn(),
  hasPinSetup: vi.fn(),
  getVaultHint: vi.fn(),
  unlockVault: vi.fn(),
  setupVault: vi.fn(),
  verifyPinAndGetMaster: vi.fn(),
  recoverMasterPw: vi.fn(),
}));

const PAYLOAD = { vault: [], recycleBin: [] } as unknown as UnlockPayload;
const m = vi.mocked(svc);

function atur(opsi: { data?: boolean; pin?: boolean; hint?: string } = {}) {
  m.hasVaultData.mockReturnValue(opsi.data ?? true);
  m.hasPinSetup.mockReturnValue(opsi.pin ?? false);
  m.getVaultHint.mockReturnValue(opsi.hint ?? '');
}
function tampil() {
  const onUnlocked = vi.fn();
  const utils = render(<ThemeProvider><LockScreen onUnlocked={onUnlocked} /></ThemeProvider>);
  return { onUnlocked, ...utils };
}
const digit = (d: string) => fireEvent.click(screen.getByRole('button', { name: `Digit ${d}` }));
const ketik = (pin: string) => { for (const d of pin) digit(d); };
const titik = (c: HTMLElement) => c.querySelectorAll('.pin-dot').length;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.setAttribute('data-theme', 'dark'); // meniru skrip anti-kedip (jsdom tanpa matchMedia)
  useAppStore.setState({ pinBuffer: '', pinAttempts: 0, pinLockedUntil: 0, pinLocked: false });
  m.unlockVault.mockResolvedValue(PAYLOAD);
});
afterEach(() => { vi.useRealTimers(); });

describe('LockScreen — panel awal', () => {
  it('belum ada data vault → langsung alur pembuatan vault (tanpa tab metode masuk)', () => {
    atur({ data: false });
    tampil();
    expect(screen.getByRole('heading', { name: 'Buat Master Password' })).toBeInTheDocument();
    expect(screen.getByText('Buat brankas pribadi yang terenkripsi')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('ada data, belum ada PIN → panel Master Password; tab hanya Password dan Seed', () => {
    atur({ data: true, pin: false });
    tampil();
    expect(screen.getByText('Masukkan master password kamu')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Password', 'Seed']);
  });

  it('ada data dan PIN → panel PIN aktif; tab PIN, Password, Seed', () => {
    atur({ data: true, pin: true });
    tampil();
    expect(screen.getByText('Masukkan PIN untuk membuka brankas')).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['PIN', 'Password', 'Seed']);
    expect(screen.getByRole('tab', { name: 'PIN' })).toHaveAttribute('aria-selected', 'true');
  });

  it('tombol tema mengganti label mode dan data-theme', () => {
    atur({ data: true, pin: false });
    tampil();
    fireEvent.click(screen.getByRole('button', { name: 'Mode terang' }));
    expect(screen.getByRole('button', { name: 'Mode gelap' })).toBeInTheDocument();
  });
});

describe('LockScreen — panjang PIN dari vault_pin_len', () => {
  it('"6": enam titik, tanpa tombol Buka dan tanpa petunjuk "Ketuk Buka"', () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    const { container } = tampil();
    expect(titik(container)).toBe(6);
    expect(screen.queryByRole('button', { name: 'Buka' })).not.toBeInTheDocument();
    expect(screen.queryByText('Ketuk Buka setelah memasukkan PIN')).not.toBeInTheDocument();
  });

  it('"4": empat titik', () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '4');
    const { container } = tampil();
    expect(titik(container)).toBe(4);
  });

  it('ABSEN (PIN lama): papan 8 digit + tombol Buka + petunjuk; Buka nonaktif sampai ≥4 digit', () => {
    atur({ pin: true });
    const { container } = tampil();
    expect(titik(container)).toBe(8);
    expect(screen.getByText('Ketuk Buka setelah memasukkan PIN')).toBeInTheDocument();
    const buka = screen.getByRole('button', { name: 'Buka' });
    expect(buka).toBeDisabled();
    ketik('123');
    expect(buka).toBeDisabled();
    ketik('4');
    expect(buka).toBeEnabled();
  });

  it('nilai tak dikenal di vault_pin_len diperlakukan sebagai ABSEN (papan 8 digit)', () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '5');
    const { container } = tampil();
    expect(titik(container)).toBe(8);
    expect(screen.getByRole('button', { name: 'Buka' })).toBeInTheDocument();
  });

  it('"6": mengisi 6 digit langsung mengirim otomatis (tanpa tombol) ke verifyPinAndGetMaster', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    m.verifyPinAndGetMaster.mockResolvedValue('master-uji');
    tampil();
    ketik('123456');
    await waitFor(() => expect(m.verifyPinAndGetMaster).toHaveBeenCalledWith('123456'));
  });

  it('ABSEN: PIN lama 4 digit masuk lewat tombol Buka (bukan otomatis)', async () => {
    atur({ pin: true });
    m.verifyPinAndGetMaster.mockResolvedValue('master-uji');
    tampil();
    ketik('1234');
    await new Promise((r) => setTimeout(r, 150)); // lebih lama dari jeda kirim-otomatis 80 ms
    expect(m.verifyPinAndGetMaster).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Buka' }));
    await waitFor(() => expect(m.verifyPinAndGetMaster).toHaveBeenCalledWith('1234'));
  });
});

describe('LockScreen — PIN benar dan salah', () => {
  it('PIN benar: unlockVault(masterPw) lalu onUnlocked(payload, masterPw); master disimpan di sessionStorage', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    m.verifyPinAndGetMaster.mockResolvedValue('master-uji');
    const { onUnlocked } = tampil();
    ketik('123456');
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith(PAYLOAD, 'master-uji'));
    expect(m.unlockVault).toHaveBeenCalledWith('master-uji');
    expect(sessionStorage.getItem('vault_ss_mpw')).toBe('master-uji');
    expect(useAppStore.getState().pinBuffer).toBe('');
  });

  it('bila ada kredensial biometrik: sesi biometrik (vault_bio_sess) menyimpan master ter-XOR dengan id kredensial, dapat dipulihkan', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    localStorage.setItem('vault_bio_cred', 'cred-abc');
    m.verifyPinAndGetMaster.mockResolvedValue('master-uji');
    const { onUnlocked } = tampil();
    ketik('123456');
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());

    const tersimpan = localStorage.getItem('vault_bio_sess');
    expect(tersimpan).toBeTruthy();
    const out = Uint8Array.from(atob(tersimpan ?? ''), (c) => c.charCodeAt(0));
    const kunci = new TextEncoder().encode('cred-abc');
    const asli = new TextDecoder().decode(out.map((b, i) => b ^ kunci[i % kunci.length]));
    expect(asli).toBe('master-uji');
  });

  it('PIN salah: pesan "4 percobaan tersisa", percobaan bertambah dan tersimpan di vault_pin_attempts, buffer dikosongkan', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    m.verifyPinAndGetMaster.mockRejectedValue(new Error('PIN salah'));
    const { onUnlocked } = tampil();
    ketik('111111');

    await waitFor(() => expect(screen.getByText('PIN salah. 4 percobaan tersisa.')).toBeInTheDocument());
    expect(useAppStore.getState().pinAttempts).toBe(1);
    expect(localStorage.getItem('vault_pin_attempts')).toBe('1');
    expect(useAppStore.getState().pinBuffer).toBe('');
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('sisa percobaan menurun: setelah 3 kesalahan sebelumnya, kesalahan ke-4 → "1 percobaan tersisa"', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    useAppStore.setState({ pinAttempts: 3 });
    m.verifyPinAndGetMaster.mockRejectedValue(new Error('PIN salah'));
    tampil();
    ketik('111111');
    await waitFor(() => expect(screen.getByText('PIN salah. 1 percobaan tersisa.')).toBeInTheDocument());
  });

  it('kesalahan ke-5 mengunci 5 menit: pesan, vault_pin_locked_until ≈ sekarang+5 menit, papan angka nonaktif', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    useAppStore.setState({ pinAttempts: 4 });
    m.verifyPinAndGetMaster.mockRejectedValue(new Error('PIN salah'));
    const sebelum = Date.now();
    tampil();
    ketik('111111');

    await waitFor(() => expect(screen.getAllByText('Terlalu banyak percobaan. PIN dikunci 5 menit.').length).toBeGreaterThan(0));
    const sampai = Number(localStorage.getItem('vault_pin_locked_until'));
    expect(sampai).toBeGreaterThanOrEqual(sebelum + 5 * 60 * 1000);
    expect(sampai).toBeLessThanOrEqual(Date.now() + 5 * 60 * 1000 + 50);
    expect(useAppStore.getState().pinLockedUntil).toBe(sampai);
    expect(screen.getByRole('button', { name: 'Digit 1' })).toBeDisabled();
  });

  it('sudah terkunci saat layar dibuka: pemberitahuan hitung mundur, semua tombol angka nonaktif, tidak ada panggilan verifikasi', () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    useAppStore.setState({ pinLockedUntil: Date.now() + 120_000, pinAttempts: 5 });
    tampil();

    const info = screen.getAllByText(/Dikunci \d+ detik lagi/)[0].textContent ?? '';
    const detik = Number(/(\d+)/.exec(info)?.[1]);
    expect(detik).toBeGreaterThanOrEqual(119);
    expect(detik).toBeLessThanOrEqual(120);
    for (const d of '0123456789') expect(screen.getByRole('button', { name: `Digit ${d}` })).toBeDisabled();
    digit('1');
    expect(useAppStore.getState().pinBuffer).toBe('');
    expect(m.verifyPinAndGetMaster).not.toHaveBeenCalled();
  });

  it('"Format PIN lama" → pindah ke panel master dengan petunjuk; percobaan TIDAK bertambah', async () => {
    atur({ pin: true });
    localStorage.setItem('vault_pin_len', '6');
    m.verifyPinAndGetMaster.mockRejectedValue(new Error('Format PIN lama, setup ulang'));
    tampil();
    ketik('123456');

    await waitFor(() => expect(screen.getByText('Masukkan master password kamu')).toBeInTheDocument());
    expect(useAppStore.getState().pinAttempts).toBe(0);
  });
});

describe('LockScreen — master password', () => {
  it('petunjuk ditampilkan bila ada; tombol Buka Vault nonaktif saat kolom kosong', () => {
    atur({ pin: false, hint: 'Nama kucing' });
    tampil();
    expect(screen.getByText('Nama kucing')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buka Vault' })).toBeDisabled();
  });

  it('tanpa petunjuk, blok petunjuk tidak muncul', () => {
    atur({ pin: false, hint: '' });
    tampil();
    expect(screen.queryByText('Petunjuk:')).not.toBeInTheDocument();
  });

  it('hanya spasi → "Masukkan master password", unlockVault tidak dipanggil', () => {
    atur();
    tampil();
    fireEvent.change(screen.getByPlaceholderText('Masukkan master password…'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));
    expect(screen.getByText('Masukkan master password')).toBeInTheDocument();
    expect(m.unlockVault).not.toHaveBeenCalled();
  });

  it('password benar: dikirim APA ADANYA (tanpa trim), onUnlocked dipanggil, sessionStorage terisi', async () => {
    atur();
    const { onUnlocked } = tampil();
    fireEvent.change(screen.getByPlaceholderText('Masukkan master password…'), { target: { value: ' sandi dengan spasi ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith(PAYLOAD, ' sandi dengan spasi '));
    expect(m.unlockVault).toHaveBeenCalledWith(' sandi dengan spasi ');
    expect(sessionStorage.getItem('vault_ss_mpw')).toBe(' sandi dengan spasi ');
  });

  it('Enter di kolom password mengirim; saat memproses tombol menampilkan "Membuka…" dan nonaktif', async () => {
    atur();
    let selesai: (v: UnlockPayload) => void = () => {};
    m.unlockVault.mockReturnValue(new Promise<UnlockPayload>((r) => { selesai = r; }));
    const { onUnlocked } = tampil();
    const kolom = screen.getByPlaceholderText('Masukkan master password…');
    fireEvent.change(kolom, { target: { value: 'abc' } });
    fireEvent.keyDown(kolom, { key: 'Enter' });

    await waitFor(() => expect(screen.getByRole('button', { name: /Membuka/ })).toBeDisabled());
    selesai(PAYLOAD);
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
  });

  it('password salah: pesan galat dari service ditampilkan, tombol kembali aktif, onUnlocked tidak dipanggil', async () => {
    atur();
    m.unlockVault.mockRejectedValue(new Error('Password salah'));
    const { onUnlocked } = tampil();
    fireEvent.change(screen.getByPlaceholderText('Masukkan master password…'), { target: { value: 'salah' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));

    await waitFor(() => expect(screen.getByText('Password salah')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Buka Vault' })).toBeEnabled();
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('tombol mata menampilkan/menyembunyikan password', () => {
    atur();
    tampil();
    const kolom = screen.getByPlaceholderText('Masukkan master password…');
    expect(kolom).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(kolom).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan' }));
    expect(kolom).toHaveAttribute('type', 'password');
  });
});

describe('LockScreen — masuk via recovery phrase & pindah tab', () => {
  // Pergantian panel memakai AnimatePresence mode="wait": panel lama keluar dulu, jadi kolom panel baru dicari dengan findBy.
  const bukaSeed = () => fireEvent.click(screen.getByRole('tab', { name: 'Seed' }));
  const kolomSeed = () => screen.findByPlaceholderText('kata1 kata2 kata3 kata4 kata5…');

  it('tab Seed: tombol nonaktif bila kosong; frasa di-trim lalu recoverMasterPw → unlockVault → onUnlocked', async () => {
    atur();
    m.recoverMasterPw.mockResolvedValue('master-pulih');
    const { onUnlocked } = tampil();
    bukaSeed();
    const kolom = await kolomSeed();
    expect(screen.getByText('Masuk dengan 5 kata recovery phrase')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buka Vault' })).toBeDisabled();

    fireEvent.change(kolom, { target: { value: '  abstract echo cash away grow  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith(PAYLOAD, 'master-pulih'));
    expect(m.recoverMasterPw).toHaveBeenCalledWith('abstract echo cash away grow');
    expect(m.unlockVault).toHaveBeenCalledWith('master-pulih');
  });

  it('recovery gagal: pesan galat dari service ditampilkan dan tidak masuk', async () => {
    atur();
    m.recoverMasterPw.mockRejectedValue(new Error('Recovery phrase salah'));
    const { onUnlocked } = tampil();
    bukaSeed();
    fireEvent.change(await kolomSeed(), { target: { value: 'a b c d e' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));
    await waitFor(() => expect(screen.getByText('Recovery phrase salah')).toBeInTheDocument());
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it('pindah tab mengosongkan isian dan galat sebelumnya', async () => {
    atur({ pin: true });
    tampil();
    fireEvent.click(screen.getByRole('tab', { name: 'Password' }));
    const kolom = await screen.findByPlaceholderText('Masukkan master password…');
    fireEvent.change(kolom, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buka Vault' }));
    expect(screen.getByText('Masukkan master password')).toBeInTheDocument();

    bukaSeed();
    await kolomSeed();
    fireEvent.click(screen.getByRole('tab', { name: 'Password' }));
    const kolomBaru = (await screen.findByPlaceholderText('Masukkan master password…')) as HTMLInputElement;
    expect(kolomBaru.value).toBe('');
    expect(screen.queryByText('Masukkan master password')).not.toBeInTheDocument();
  });
});

describe('LockScreen — membuat vault baru (perakitan SetupFlow → setupVault)', () => {
  it('setupVault menerima password, petunjuk, dan frasa YANG SAMA dengan yang ditampilkan; lalu unlockVault dan onUnlocked', async () => {
    atur({ data: false });
    m.setupVault.mockResolvedValue(undefined as never);
    const { onUnlocked } = tampil();

    fireEvent.change(screen.getByPlaceholderText('Master password…'), { target: { value: 'rahasia-uji' } });
    fireEvent.change(screen.getByPlaceholderText('Konfirmasi password…'), { target: { value: 'rahasia-uji' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    fireEvent.change(screen.getByPlaceholderText(/Contoh: nama hewan/), { target: { value: 'Ayah' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));

    const frasa = within(screen.getByRole('list', { name: 'Recovery phrase' }))
      .getAllByRole('listitem').map((li) => li.querySelector('.rp-word__val')?.textContent).join(' ');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
    fireEvent.click(screen.getByRole('button', { name: /Buat Vault Sekarang/ }));

    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith(PAYLOAD, 'rahasia-uji'));
    expect(m.setupVault).toHaveBeenCalledWith({ masterPw: 'rahasia-uji', hint: 'Ayah', recoveryPhrase: frasa });
    expect(m.unlockVault).toHaveBeenCalledWith('rahasia-uji');
    expect(frasa.split(' ')).toHaveLength(5);
  });
});
