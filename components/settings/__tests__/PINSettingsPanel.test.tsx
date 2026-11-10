/**
 * components/settings/__tests__/PINSettingsPanel.test.tsx — Aurum Vault v2.0.0 (Tahap 4B)
 *
 * Maksud: menjaga panel PIN di Pengaturan (buat / ganti / hapus) dan kontrak vault_pin_len:
 *  - PIN baru: panjang dipilih 6 (disarankan) atau 4 digit; input hanya angka dan dibatasi panjangnya;
 *    vault_pin_len BARU ditulis SETELAH setupPin berhasil; hapus PIN menghapus vault_pin_len.
 *  - PIN lama (tanpa vault_pin_len = panjang bebas 4–8): status "4–8 digit", input verifikasi menerima 8 digit.
 *  - Validasi dan pesan galat; PIN salah tidak mengubah apa pun; tombol terkunci saat memproses.
 *  - Panel TIDAK menulis kunci percobaan PIN (vault_pin_attempts / vault_pin_locked_until): kunci-coba
 *    adalah urusan lapisan layanan/layar kunci. Perilaku kunci-coba itu sendiri (U14) TIDAK dikunci di sini.
 *
 * vaultService DI-MOCK (kripto/penyimpanan PIN diuji di vaultService.test.ts & dataCompat.test.ts);
 * pinLength.ts dan localStorage asli. Fake timers hanya untuk jeda 1,5 dtk "berhasil → kembali".
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4B): file dibuat (sebelumnya panel ini tidak punya test).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { PINSettingsPanel } from '../PINSettingsPanel';
import { useAppStore } from '@/lib/store/appStore';
import * as svc from '@/lib/vaultService';

vi.mock('@/lib/vaultService', () => ({
  setupPin: vi.fn(),
  verifyPin: vi.fn(),
  removePin: vi.fn(),
  hasPinSetup: vi.fn(),
}));
const m = vi.mocked(svc);

const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); });
const click = async (name: string) => { fireEvent.click(screen.getByRole('button', { name })); await flush(); };
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const input = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

function setup(opts: { pin?: boolean; len?: '4' | '6' | null; masterPw?: string } = {}) {
  const { pin = false, len = null, masterPw = 'pw-master' } = opts;
  localStorage.clear();
  if (len) localStorage.setItem('vault_pin_len', len);
  localStorage.setItem('vault_pin_attempts', '2');
  localStorage.setItem('vault_pin_locked_until', '0');
  m.hasPinSetup.mockReturnValue(pin);
  m.setupPin.mockResolvedValue(undefined);
  m.verifyPin.mockResolvedValue(true);
  useAppStore.setState({ masterPw });
}
const lockKeysUntouched = () => {
  expect(localStorage.getItem('vault_pin_attempts')).toBe('2');
  expect(localStorage.getItem('vault_pin_locked_until')).toBe('0');
};

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

/* ───────────────────────── status awal ───────────────────────── */
describe('PINSettingsPanel — status awal', () => {
  it('belum ada PIN: "PIN belum dikonfigurasi" + hanya tombol "Buat PIN"', () => {
    setup();
    render(<PINSettingsPanel />);
    expect(screen.getByText('PIN belum dikonfigurasi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buat PIN' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ganti PIN' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus PIN' })).not.toBeInTheDocument();
  });

  it('PIN 6 digit (vault_pin_len=6): status menyebut 6 digit + tombol Ganti/Hapus, tanpa Buat', () => {
    setup({ pin: true, len: '6' });
    render(<PINSettingsPanel />);
    expect(screen.getByText('PIN aktif (6 digit) — login cepat tersedia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ganti PIN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus PIN' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Buat PIN' })).not.toBeInTheDocument();
  });

  it('PIN 4 digit (vault_pin_len=4) disebut 4 digit', () => {
    setup({ pin: true, len: '4' });
    render(<PINSettingsPanel />);
    expect(screen.getByText('PIN aktif (4 digit) — login cepat tersedia')).toBeInTheDocument();
  });

  it('PIN lama tanpa vault_pin_len: status "4–8 digit" (panjang bebas)', () => {
    setup({ pin: true, len: null });
    render(<PINSettingsPanel />);
    expect(screen.getByText('PIN aktif (4–8 digit) — login cepat tersedia')).toBeInTheDocument();
  });

  it('nilai vault_pin_len tak dikenal diperlakukan sebagai ABSEN (4–8 digit)', () => {
    setup({ pin: true });
    localStorage.setItem('vault_pin_len', '5');
    render(<PINSettingsPanel />);
    expect(screen.getByText('PIN aktif (4–8 digit) — login cepat tersedia')).toBeInTheDocument();
  });
});

/* ───────────────────────── buat PIN ───────────────────────── */
describe('PINSettingsPanel — buat PIN', () => {
  async function openSetup() {
    setup();
    render(<PINSettingsPanel />);
    await click('Buat PIN');
  }

  it('formulir: judul, pemilih panjang (6 disarankan terpilih, 4 lebih cepat), kolom PIN + Ulangi PIN', async () => {
    await openSetup();
    expect(screen.getByRole('heading', { name: 'Buat PIN Baru' })).toBeInTheDocument();
    const group = screen.getByRole('radiogroup', { name: 'Panjang PIN' });
    const six = within(group).getByRole('radio', { name: /^6 digit/ });
    const four = within(group).getByRole('radio', { name: /^4 digit/ });
    expect(within(group).getAllByRole('radio')[0]).toBe(six); // 6 digit (disarankan) di urutan pertama
    expect(within(group).getAllByRole('radio')[1]).toBe(four);
    expect(within(six).getByText('Disarankan')).toBeInTheDocument();
    expect(within(four).getByText('Lebih cepat')).toBeInTheDocument();
    expect(six).toHaveAttribute('aria-checked', 'true');
    expect(four).toHaveAttribute('aria-checked', 'false');
    expect(input('PIN (6 digit)')).toHaveAttribute('type', 'password');
    expect(input('PIN (6 digit)')).toHaveAttribute('inputmode', 'numeric');
    expect(input('Ulangi PIN')).toHaveAttribute('type', 'password');
  });

  it('input hanya menerima angka dan dibatasi panjang terpilih (6 → 4)', async () => {
    await openSetup();
    type('PIN (6 digit)', 'a1b2c3d4e5f6g7h8');
    expect(input('PIN (6 digit)').value).toBe('123456');
    type('Ulangi PIN', '9 8-7x6w5v4u3');
    expect(input('Ulangi PIN').value).toBe('987654');

    fireEvent.click(screen.getByRole('radio', { name: /^4 digit/ }));
    type('PIN (4 digit)', '12345678');
    expect(input('PIN (4 digit)').value).toBe('1234');
    type('Ulangi PIN', '12345678');
    expect(input('Ulangi PIN').value).toBe('1234');
  });

  it('memilih panjang lain: radio berpindah, label mengikuti, PIN/ulangi dikosongkan dan galat dihapus', async () => {
    await openSetup();
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '654321');
    await click('Buat PIN'); // memicu 'PIN tidak cocok'
    expect(screen.getByText('PIN tidak cocok')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /^4 digit/ }));
    expect(screen.getByRole('radio', { name: /^4 digit/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^6 digit/ })).toHaveAttribute('aria-checked', 'false');
    expect(input('PIN (4 digit)').value).toBe('');
    expect(input('Ulangi PIN').value).toBe('');
    expect(screen.queryByText('PIN tidak cocok')).not.toBeInTheDocument();
  });

  it('validasi: kurang dari panjang → "PIN harus tepat 6 digit"; tidak cocok → "PIN tidak cocok"; tidak ada yang tersimpan', async () => {
    await openSetup();
    type('PIN (6 digit)', '12345');
    type('Ulangi PIN', '12345');
    await click('Buat PIN');
    expect(screen.getByText('PIN harus tepat 6 digit')).toBeInTheDocument();

    type('PIN (6 digit)', '123456');
    expect(screen.queryByText('PIN harus tepat 6 digit')).not.toBeInTheDocument(); // galat hilang saat mengetik
    type('Ulangi PIN', '123457');
    await click('Buat PIN');
    expect(screen.getByText('PIN tidak cocok')).toBeInTheDocument();
    type('Ulangi PIN', '123456');
    expect(screen.queryByText('PIN tidak cocok')).not.toBeInTheDocument(); // galat hilang saat mengetik di Ulangi PIN juga

    expect(m.setupPin).not.toHaveBeenCalled();
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
  });

  it('panjang 4 dipilih: pesan "PIN harus tepat 4 digit"', async () => {
    await openSetup();
    fireEvent.click(screen.getByRole('radio', { name: /^4 digit/ }));
    type('PIN (4 digit)', '123');
    type('Ulangi PIN', '123');
    await click('Buat PIN');
    expect(screen.getByText('PIN harus tepat 4 digit')).toBeInTheDocument();
  });

  it('master password sesi kosong: "Tidak dapat membaca master password sesi ini", setupPin tidak dipanggil', async () => {
    setup({ masterPw: '' });
    render(<PINSettingsPanel />);
    await click('Buat PIN');
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    await click('Buat PIN');
    expect(screen.getByText('Tidak dapat membaca master password sesi ini')).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
  });

  it('berhasil 6 digit: setupPin(PIN, masterPw), vault_pin_len="6", pesan sukses, lalu kembali ke status aktif setelah 1,5 dtk', async () => {
    await openSetup();
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    await click('Buat PIN');
    expect(m.setupPin).toHaveBeenCalledTimes(1);
    expect(m.setupPin).toHaveBeenCalledWith('123456', 'pw-master');
    expect(localStorage.getItem('vault_pin_len')).toBe('6');
    expect(screen.getByText('PIN berhasil dibuat!')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1499); });
    expect(screen.getByText('PIN berhasil dibuat!')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('PIN aktif (6 digit) — login cepat tersedia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ganti PIN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus PIN' })).toBeInTheDocument();
    lockKeysUntouched();
  });

  it('berhasil 4 digit: vault_pin_len="4" dan status menyebut 4 digit', async () => {
    await openSetup();
    fireEvent.click(screen.getByRole('radio', { name: /^4 digit/ }));
    type('PIN (4 digit)', '2468');
    type('Ulangi PIN', '2468');
    await click('Buat PIN');
    expect(m.setupPin).toHaveBeenCalledWith('2468', 'pw-master');
    expect(localStorage.getItem('vault_pin_len')).toBe('4');
    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.getByText('PIN aktif (4 digit) — login cepat tersedia')).toBeInTheDocument();
  });

  it('setupPin gagal: "Gagal menyimpan PIN"; vault_pin_len TIDAK ditulis; status tetap "belum dikonfigurasi"', async () => {
    await openSetup();
    m.setupPin.mockRejectedValueOnce(new Error('boom'));
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    await click('Buat PIN');
    expect(screen.getByText('Gagal menyimpan PIN')).toBeInTheDocument();
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
    await click('Batal');
    expect(screen.getByText('PIN belum dikonfigurasi')).toBeInTheDocument();
  });

  it('saat memproses: tombol Batal terkunci dan tombol "Buat PIN" berganti spinner (tak bisa dikirim dua kali)', async () => {
    await openSetup();
    let resolve: () => void = () => {};
    m.setupPin.mockReturnValueOnce(new Promise<void>((r) => { resolve = r; }));
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    await click('Buat PIN');
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Buat PIN' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button').filter((b) => (b as HTMLButtonElement).disabled).length).toBeGreaterThanOrEqual(2);
    await act(async () => { resolve(); await Promise.resolve(); });
    expect(screen.getByText('PIN berhasil dibuat!')).toBeInTheDocument();
    expect(m.setupPin).toHaveBeenCalledTimes(1);
  });

  it('Enter di kolom Ulangi PIN mengirim formulir (setupPin dipanggil sekali)', async () => {
    await openSetup();
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    fireEvent.keyDown(input('Ulangi PIN'), { key: 'Enter' });
    await flush();
    expect(m.setupPin).toHaveBeenCalledTimes(1);
  });

  it('Escape di kolom PIN membatalkan: kembali ke status, tidak ada yang tersimpan', async () => {
    await openSetup();
    type('PIN (6 digit)', '123456');
    fireEvent.keyDown(input('PIN (6 digit)'), { key: 'Escape' });
    expect(screen.getByText('PIN belum dikonfigurasi')).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
  });
});

/* ───────────────────────── ganti PIN ───────────────────────── */
describe('PINSettingsPanel — ganti PIN', () => {
  async function openChange(len: '4' | '6' | null = '6') {
    setup({ pin: true, len });
    render(<PINSettingsPanel />);
    await click('Ganti PIN');
  }

  it('langkah 1 "Verifikasi PIN Lama": tanpa pemilih panjang; kosong → "Masukkan PIN lama"', async () => {
    await openChange();
    expect(screen.getByRole('heading', { name: 'Verifikasi PIN Lama' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Panjang PIN' })).not.toBeInTheDocument();
    await click('Lanjut');
    expect(screen.getByText('Masukkan PIN lama')).toBeInTheDocument();
    expect(m.verifyPin).not.toHaveBeenCalled();
  });

  it('PIN lama salah: "PIN salah", tetap di langkah 1, tidak ada perubahan tersimpan', async () => {
    await openChange();
    m.verifyPin.mockResolvedValueOnce(false);
    type('PIN Lama', '000000');
    await click('Lanjut');
    expect(m.verifyPin).toHaveBeenCalledWith('000000');
    expect(screen.getByText('PIN salah')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Verifikasi PIN Lama' })).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
    expect(localStorage.getItem('vault_pin_len')).toBe('6');
    lockKeysUntouched();
  });

  it('PIN lama benar: lanjut ke "PIN Baru" dengan kolom kosong, pemilih panjang, dan Ulangi PIN', async () => {
    await openChange();
    type('PIN Lama', '123456');
    await click('Lanjut');
    expect(screen.getByRole('heading', { name: 'PIN Baru' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Panjang PIN' })).toBeInTheDocument();
    expect(input('PIN Baru').value).toBe('');
    expect(input('Ulangi PIN').value).toBe('');
  });

  it('placeholder kolom verifikasi mengikuti panjang PIN tersimpan (6 digit → 6 titik)', async () => {
    await openChange('6');
    expect(input('PIN Lama').getAttribute('placeholder')).toBe('••••••');
  });

  it('placeholder verifikasi PIN lama (tanpa vault_pin_len): 4 titik', async () => {
    await openChange(null);
    expect(input('PIN Lama').getAttribute('placeholder')).toBe('••••');
  });

  it('PIN tersimpan 6 digit: kolom verifikasi dibatasi 6 digit', async () => {
    await openChange('6');
    type('PIN Lama', '12345678901');
    expect(input('PIN Lama').value).toBe('123456');
  });

  it('PIN lama tanpa vault_pin_len: kolom verifikasi menerima sampai 8 digit', async () => {
    await openChange(null);
    type('PIN Lama', '12345678901');
    expect(input('PIN Lama').value).toBe('12345678');
  });

  it('PIN baru berhasil (ganti ke 4 digit): setupPin(PIN baru, masterPw), vault_pin_len="4", "PIN berhasil diubah!", lalu kembali', async () => {
    await openChange('6');
    type('PIN Lama', '123456');
    await click('Lanjut');
    fireEvent.click(screen.getByRole('radio', { name: /^4 digit/ }));
    type('PIN Baru', '1357');
    type('Ulangi PIN', '1357');
    await click('Simpan PIN Baru');
    expect(m.setupPin).toHaveBeenCalledTimes(1);
    expect(m.setupPin).toHaveBeenCalledWith('1357', 'pw-master');
    expect(localStorage.getItem('vault_pin_len')).toBe('4');
    expect(screen.getByText('PIN berhasil diubah!')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1499); });
    expect(screen.getByText('PIN berhasil diubah!')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('PIN aktif (4 digit) — login cepat tersedia')).toBeInTheDocument();
    lockKeysUntouched();
  });

  it('PIN lama (tanpa vault_pin_len) diganti: panjang baru bawaan 6 digit dan menetapkan vault_pin_len="6"', async () => {
    await openChange(null);
    type('PIN Lama', '1234');
    await click('Lanjut');
    expect(input('PIN Baru').getAttribute('placeholder')).toBe('••••••');
    type('PIN Baru', '654321');
    type('Ulangi PIN', '654321');
    await click('Simpan PIN Baru');
    expect(localStorage.getItem('vault_pin_len')).toBe('6');
  });

  it('PIN baru: validasi panjang ("PIN baru harus tepat 6 digit"), cocok ("PIN tidak cocok"), master pw; gagal simpan → "Gagal menyimpan PIN baru" tanpa menulis vault_pin_len', async () => {
    await openChange('4');
    type('PIN Lama', '1234');
    await click('Lanjut');
    // len awal mengikuti vault_pin_len tersimpan (4)
    type('PIN Baru', '123');
    type('Ulangi PIN', '123');
    await click('Simpan PIN Baru');
    expect(screen.getByText('PIN baru harus tepat 4 digit')).toBeInTheDocument();

    type('PIN Baru', '1234');
    type('Ulangi PIN', '4321');
    await click('Simpan PIN Baru');
    expect(screen.getByText('PIN tidak cocok')).toBeInTheDocument();

    m.setupPin.mockRejectedValueOnce(new Error('boom'));
    type('Ulangi PIN', '1234');
    await click('Simpan PIN Baru');
    expect(screen.getByText('Gagal menyimpan PIN baru')).toBeInTheDocument();
    expect(localStorage.getItem('vault_pin_len')).toBe('4');
  });

  it('master password sesi kosong saat menyimpan PIN baru: galat tampil, setupPin tidak dipanggil', async () => {
    await openChange('6');
    type('PIN Lama', '123456');
    await click('Lanjut');
    act(() => { useAppStore.setState({ masterPw: '' }); });
    type('PIN Baru', '123456');
    type('Ulangi PIN', '123456');
    await click('Simpan PIN Baru');
    expect(screen.getByText('Tidak dapat membaca master password sesi ini')).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
  });

  it('Batal di langkah mana pun kembali ke status tanpa mengubah PIN', async () => {
    await openChange('6');
    await click('Batal');
    expect(screen.getByText('PIN aktif (6 digit) — login cepat tersedia')).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
  });
});

/* ───────────────────────── hapus PIN ───────────────────────── */
describe('PINSettingsPanel — hapus PIN', () => {
  async function openRemove(len: '4' | '6' | null = '6') {
    setup({ pin: true, len });
    render(<PINSettingsPanel />);
    await click('Hapus PIN');
  }

  it('formulir: judul, peringatan konfirmasi, kolom "PIN (konfirmasi)", tanpa pemilih panjang', async () => {
    await openRemove();
    expect(screen.getByRole('heading', { name: 'Hapus PIN' })).toBeInTheDocument();
    expect(screen.getByText('Masukkan PIN untuk mengonfirmasi penghapusan.')).toBeInTheDocument();
    expect(input('PIN (konfirmasi)')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Panjang PIN' })).not.toBeInTheDocument();
  });

  it('kosong → "Masukkan PIN untuk konfirmasi"; PIN salah → "PIN salah"; keduanya TIDAK menghapus apa pun', async () => {
    await openRemove();
    await click('Hapus PIN');
    expect(screen.getByText('Masukkan PIN untuk konfirmasi')).toBeInTheDocument();

    m.verifyPin.mockResolvedValueOnce(false);
    type('PIN (konfirmasi)', '000000');
    await click('Hapus PIN');
    expect(m.verifyPin).toHaveBeenCalledWith('000000');
    expect(screen.getByText('PIN salah')).toBeInTheDocument();
    expect(m.removePin).not.toHaveBeenCalled();
    expect(localStorage.getItem('vault_pin_len')).toBe('6');
    lockKeysUntouched();
  });

  it('PIN benar: removePin dipanggil sekali, vault_pin_len dihapus, pesan sukses, lalu status "belum dikonfigurasi" + tombol Buat PIN', async () => {
    await openRemove();
    type('PIN (konfirmasi)', '123456');
    await click('Hapus PIN');
    expect(m.removePin).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
    expect(screen.getByText('PIN berhasil dihapus.')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1499); });
    expect(screen.getByText('PIN berhasil dihapus.')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('PIN belum dikonfigurasi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buat PIN' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus PIN' })).not.toBeInTheDocument();
    lockKeysUntouched();
  });

  it('menghapus PIN lama (tanpa vault_pin_len) juga berhasil dan tidak membuat kunci vault_pin_len', async () => {
    await openRemove(null);
    type('PIN (konfirmasi)', '12345678');
    expect(input('PIN (konfirmasi)').value).toBe('12345678');
    await click('Hapus PIN');
    expect(m.removePin).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vault_pin_len')).toBeNull();
  });

  it('Batal kembali ke status tanpa menghapus', async () => {
    await openRemove();
    await click('Batal');
    expect(screen.getByText('PIN aktif (6 digit) — login cepat tersedia')).toBeInTheDocument();
    expect(m.removePin).not.toHaveBeenCalled();
  });
});

/* ───────────────────────── pintasan keyboard ───────────────────────── */
describe('PINSettingsPanel — pintasan keyboard', () => {
  it('Enter di kolom PIN utama mengirim formulir pada mode buat / verifikasi ganti / hapus', async () => {
    // buat
    setup();
    const r1 = render(<PINSettingsPanel />);
    await click('Buat PIN');
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    fireEvent.keyDown(input('PIN (6 digit)'), { key: 'Enter' });
    await flush();
    expect(m.setupPin).toHaveBeenCalledTimes(1);
    r1.unmount();

    // verifikasi PIN lama
    vi.clearAllMocks();
    setup({ pin: true, len: '6' });
    const r2 = render(<PINSettingsPanel />);
    await click('Ganti PIN');
    type('PIN Lama', '123456');
    fireEvent.keyDown(input('PIN Lama'), { key: 'Enter' });
    await flush();
    expect(m.verifyPin).toHaveBeenCalledWith('123456');
    expect(screen.getByRole('heading', { name: 'PIN Baru' })).toBeInTheDocument();
    r2.unmount();

    // hapus
    vi.clearAllMocks();
    setup({ pin: true, len: '6' });
    render(<PINSettingsPanel />);
    await click('Hapus PIN');
    type('PIN (konfirmasi)', '123456');
    fireEvent.keyDown(input('PIN (konfirmasi)'), { key: 'Enter' });
    await flush();
    expect(m.removePin).toHaveBeenCalledTimes(1);
  });

  it('PIN baru (mode ganti): Enter di kolom PIN Baru dan di kolom Ulangi PIN sama-sama menyimpan', async () => {
    for (const field of ['PIN Baru', 'Ulangi PIN']) {
      vi.clearAllMocks();
      setup({ pin: true, len: '6' });
      const { unmount } = render(<PINSettingsPanel />);
      await click('Ganti PIN');
      type('PIN Lama', '123456');
      await click('Lanjut');
      type('PIN Baru', '654321');
      type('Ulangi PIN', '654321');
      fireEvent.keyDown(input(field), { key: 'Enter' });
      await flush();
      expect(m.setupPin).toHaveBeenCalledTimes(1);
      expect(m.setupPin).toHaveBeenCalledWith('654321', 'pw-master');
      unmount();
    }
  });

  it('tombol selain Enter/Escape tidak mengirim apa pun', async () => {
    setup();
    render(<PINSettingsPanel />);
    await click('Buat PIN');
    type('PIN (6 digit)', '123456');
    type('Ulangi PIN', '123456');
    fireEvent.keyDown(input('PIN (6 digit)'), { key: 'a' });
    fireEvent.keyDown(input('Ulangi PIN'), { key: 'Tab' });
    await flush();
    expect(m.setupPin).not.toHaveBeenCalled();
  });

  it.each<['change-verify' | 'remove-verify' | 'change-new', string]>([
    ['change-verify', 'PIN Lama'],
    ['remove-verify', 'PIN (konfirmasi)'],
    ['change-new', 'PIN Baru'],
  ])('Escape di mode %s membatalkan dan kembali ke status (PIN tetap aktif)', async (mode, label) => {
    setup({ pin: true, len: '6' });
    render(<PINSettingsPanel />);
    if (mode === 'remove-verify') await click('Hapus PIN');
    else await click('Ganti PIN');
    if (mode === 'change-new') { type('PIN Lama', '123456'); await click('Lanjut'); }
    type(label, '1234');
    fireEvent.keyDown(input(label), { key: 'Escape' });
    expect(screen.getByText('PIN aktif (6 digit) — login cepat tersedia')).toBeInTheDocument();
    expect(m.setupPin).not.toHaveBeenCalled();
    expect(m.removePin).not.toHaveBeenCalled();
  });
});
