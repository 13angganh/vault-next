/**
 * components/lock/__tests__/BiometricHintModal.test.tsx — Aurum Vault v2.0.0 (Tahap 4B)
 *
 * PENTING — BATAS PENGUJIAN (jujur): WebAuthn NYATA tidak bisa dijalankan di jsdom. Di sini
 * `window.PublicKeyCredential` dan `navigator.credentials.create/get` adalah STUB (vi.fn). Test ini
 * TIDAK membuktikan bahwa sensor sidik jari / Face ID bekerja, bahwa registrasi nyata berhasil, atau
 * bahwa browser menerima opsi yang dikirim. Yang dijaga:
 *  - tampilan per mode/langkah (register/auth; idle, memuat, sukses, galat, sesi habis, tidak didukung);
 *  - cara menutup (tombol, latar) dan penguncian saat memuat;
 *  - pesan galat untuk NotAllowedError / NotSupportedError / galat lain / hasil null;
 *  - logika penyimpanan sesi (kunci vault_bio_cred, vault_ss_mpw, vault_bio_sess = XOR credentialId
 *    lalu base64 — kontrak data, diperiksa dengan dekoder INDEPENDEN) dan auto-pemicu mode auth;
 *  - opsi yang DIKIRIM ke API (argumen panggilan stub): userVerification wajib, platform authenticator, challenge 32 byte.
 * Cek manual di perangkat nyata tetap wajib (Android Chrome / iOS Safari): daftar sidik jari di Pengaturan,
 * kunci → buka dengan sidik jari, tolak/batalkan, dan ganti sidik jari di OS.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4B): file dibuat (sebelumnya komponen ini tidak punya test).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { BiometricHintModal, clearBioSession } from '../BiometricHintModal';

/* ── stub WebAuthn ── */
type Stub = { create: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };
function stubWebAuthn(): Stub {
  const create = vi.fn();
  const get = vi.fn();
  Object.defineProperty(window, 'PublicKeyCredential', { value: class {}, configurable: true, writable: true });
  Object.defineProperty(navigator, 'credentials', { value: { create, get }, configurable: true });
  return { create, get };
}
function unstubWebAuthn() {
  Reflect.deleteProperty(window, 'PublicKeyCredential');
  Reflect.deleteProperty(navigator, 'credentials');
}

/* ── dekoder/pengkode INDEPENDEN untuk kontrak vault_bio_sess (bukan salinan kode komponen) ── */
const toB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const xor = (data: Uint8Array, key: string) => {
  const k = new TextEncoder().encode(key);
  return data.map((b, i) => b ^ k[i % k.length]);
};
const obf = (text: string, key: string) => toB64(xor(new TextEncoder().encode(text), key));
const unobf = (b64: string, key: string) =>
  new TextDecoder().decode(xor(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), key));

const RAW_ID = new Uint8Array([1, 2, 3, 4]);
const CRED_ID = toB64(RAW_ID); // 'AQIDBA=='
const MASTER = 'master-rahasia-Ω';
const credential = () => ({ rawId: RAW_ID.buffer.slice(0) });

const flush = () => act(async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); });
const dlg = (name: string) => screen.getByRole('dialog', { name });
const closeX = () => screen.queryByRole('button', { name: 'Tutup' });
const click = async (name: string) => { fireEvent.click(screen.getByRole('button', { name })); await flush(); };
function deferred<T>() {
  let resolve: (v: T) => void = () => {};
  let reject: (e: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const domErr = (name: string, message = '') => Object.assign(new Error(message), { name });

let stub: Stub;
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  stub = stubWebAuthn();
});
afterEach(() => {
  vi.useRealTimers();
  unstubWebAuthn();
  localStorage.clear();
  sessionStorage.clear();
});

/* ───────────────────────── tidak didukung ───────────────────────── */
describe('BiometricHintModal — peramban tanpa WebAuthn', () => {
  beforeEach(() => unstubWebAuthn());

  it.each<['register' | 'auth', string]>([
    ['register', 'Daftarkan Biometrik'],
    ['auth', 'Verifikasi Biometrik'],
  ])('mode %s: judul "%s", pesan tidak didukung, tombol "Mengerti" menutup; tidak ada panggilan API', async (mode, title) => {
    const onClose = vi.fn();
    render(<BiometricHintModal mode={mode} masterPw={MASTER} onClose={onClose} />);
    await flush();
    const d = dlg(title);
    expect(within(d).getByText(/tidak mendukung autentikasi biometrik/)).toBeInTheDocument();
    expect(within(d).queryByRole('button', { name: /Daftarkan Sidik Jari|Coba Lagi|Masuk dengan PIN/ })).not.toBeInTheDocument();
    fireEvent.click(within(d).getByRole('button', { name: 'Mengerti' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(stub.create).not.toHaveBeenCalled();
    expect(stub.get).not.toHaveBeenCalled();
  });

  it('navigator.credentials ada tetapi PublicKeyCredential tidak ada: tetap dianggap tidak didukung', () => {
    Object.defineProperty(navigator, 'credentials', { value: { create: vi.fn(), get: vi.fn() }, configurable: true });
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    expect(screen.getByText(/tidak mendukung autentikasi biometrik/)).toBeInTheDocument();
  });

  it('PublicKeyCredential ada tetapi navigator.credentials tidak ada: tetap dianggap tidak didukung', () => {
    Object.defineProperty(window, 'PublicKeyCredential', { value: class {}, configurable: true, writable: true });
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    expect(screen.getByText(/tidak mendukung autentikasi biometrik/)).toBeInTheDocument();
  });
});

/* ───────────────────────── mode register ───────────────────────── */
describe('BiometricHintModal — mode register', () => {
  it('tampilan awal: judul, catatan keamanan, tombol Daftarkan Sidik Jari dan Batal', () => {
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    const d = dlg('Daftarkan Biometrik');
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(within(d).getByText('Sidik jari / Face ID')).toBeInTheDocument();
    expect(within(d).getByText(/Sidik jari disimpan aman di perangkat \(tidak dikirim ke server\)/)).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Daftarkan Sidik Jari' })).toBeInTheDocument();
    expect(within(d).getByRole('button', { name: 'Batal' })).toBeInTheDocument();
    expect(stub.create).not.toHaveBeenCalled();
  });

  it('cara menutup: Batal, tombol X, klik latar → onClose; klik di dalam kartu TIDAK menutup', () => {
    const onClose = vi.fn();
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={onClose} />);
    const d = dlg('Daftarkan Biometrik');
    fireEvent.click(within(d).getByRole('button', { name: 'Batal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(within(d).getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(within(d).getByText('Sidik jari / Face ID'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.click(d); // latar = elemen dialog itu sendiri (role dialog dipasang pada latar)
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('tanpa masterPw: tidak memanggil API pendaftaran dan tidak menyimpan apa pun', async () => {
    render(<BiometricHintModal mode="register" onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    expect(stub.create).not.toHaveBeenCalled();
    expect(localStorage.getItem('vault_bio_cred')).toBeNull();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBeNull();
  });

  it('opsi yang dikirim ke API (argumen stub): platform authenticator, verifikasi pengguna wajib, challenge 32 byte, ES256 + RS256', async () => {
    stub.create.mockResolvedValue(credential());
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    expect(stub.create).toHaveBeenCalledTimes(1);
    const pk = stub.create.mock.calls[0][0].publicKey;
    expect(pk.rp.name).toBe('Aurum Vault');
    expect(pk.authenticatorSelection.authenticatorAttachment).toBe('platform');
    expect(pk.authenticatorSelection.userVerification).toBe('required');
    expect(pk.authenticatorSelection.residentKey).toBe('preferred');
    expect(pk.challenge.byteLength).toBe(32);
    expect(pk.pubKeyCredParams.map((p: { alg: number }) => p.alg)).toEqual([-7, -257]);
  });

  it('challenge acak: dua pendaftaran berbeda memakai challenge berbeda', async () => {
    stub.create.mockRejectedValue(domErr('NotAllowedError'));
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    await click('Coba Lagi');
    const [a, b] = stub.create.mock.calls.map((c) => Array.from(c[0].publicKey.challenge as Uint8Array).join(','));
    expect(a).not.toBe(b);
  });

  it('saat menunggu sensor: pesan memuat, tombol X hilang, klik latar TIDAK menutup', async () => {
    const d = deferred<unknown>();
    stub.create.mockReturnValue(d.promise);
    const onClose = vi.fn();
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={onClose} />);
    await click('Daftarkan Sidik Jari');
    const dialog = dlg('Daftarkan Biometrik');
    expect(within(dialog).getByText(/Menunggu sidik jari…/)).toBeInTheDocument();
    expect(closeX()).not.toBeInTheDocument();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { d.resolve(credential()); await Promise.resolve(); });
    expect(screen.getByText('Sidik jari terdaftar!')).toBeInTheDocument();
  });

  it('berhasil (stub): menyimpan credentialId, sesi di sessionStorage, dan sesi cadangan terobfuskasi (XOR credentialId → base64); tombol Selesai menutup', async () => {
    stub.create.mockResolvedValue(credential());
    const onClose = vi.fn();
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={onClose} />);
    await click('Daftarkan Sidik Jari');
    expect(screen.getByText('Sidik jari terdaftar!')).toBeInTheDocument();
    expect(localStorage.getItem('vault_bio_cred')).toBe(CRED_ID);
    expect(sessionStorage.getItem('vault_ss_mpw')).toBe(MASTER);
    const stored = localStorage.getItem('vault_bio_sess');
    expect(stored).not.toBeNull();
    expect(stored).not.toContain(MASTER); // bukan teks polos
    expect(unobf(stored ?? '', CRED_ID)).toBe(MASTER);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Selesai' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it.each<[string, unknown, string]>([
    ['NotAllowedError', domErr('NotAllowedError'), 'Permintaan biometrik ditolak atau dibatalkan.'],
    ['NotSupportedError', domErr('NotSupportedError'), 'Perangkat tidak mendukung biometrik platform.'],
    ['galat lain berpesan', new Error('Sensor rusak'), 'Sensor rusak'],
    ['galat tanpa pesan', new Error(''), 'Pendaftaran gagal.'],
  ])('gagal: %s → pesan yang sesuai + Coba Lagi/Tutup; tidak ada yang tersimpan', async (_label, err, message) => {
    stub.create.mockRejectedValue(err);
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tutup' })).toHaveLength(2); // X di header + tombol Tutup di bawah
    expect(localStorage.getItem('vault_bio_cred')).toBeNull();
    expect(localStorage.getItem('vault_bio_sess')).toBeNull();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBeNull();
  });

  it('hasil null dari API (dibatalkan): pesan "Pendaftaran dibatalkan", tidak ada yang tersimpan', async () => {
    stub.create.mockResolvedValue(null);
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    expect(screen.getByText('Pendaftaran dibatalkan')).toBeInTheDocument();
    expect(localStorage.getItem('vault_bio_cred')).toBeNull();
  });

  it('Coba Lagi setelah gagal memanggil API lagi dan bisa berhasil', async () => {
    stub.create.mockRejectedValueOnce(domErr('NotAllowedError')).mockResolvedValueOnce(credential());
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={() => {}} />);
    await click('Daftarkan Sidik Jari');
    await click('Coba Lagi');
    expect(stub.create).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Sidik jari terdaftar!')).toBeInTheDocument();
    expect(screen.queryByText('Permintaan biometrik ditolak atau dibatalkan.')).not.toBeInTheDocument();
  });

  it('tombol Tutup di keadaan galat menutup modal', async () => {
    stub.create.mockRejectedValue(domErr('NotAllowedError'));
    const onClose = vi.fn();
    render(<BiometricHintModal mode="register" masterPw={MASTER} onClose={onClose} />);
    await click('Daftarkan Sidik Jari');
    const buttons = screen.getAllByRole('button', { name: 'Tutup' });
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/* ───────────────────────── mode auth ───────────────────────── */
describe('BiometricHintModal — mode auth', () => {
  function withSession(pw = MASTER, opts: { ss?: boolean; ls?: boolean; cred?: boolean } = {}) {
    const { ss = true, ls = true, cred = true } = opts;
    if (cred) localStorage.setItem('vault_bio_cred', CRED_ID);
    if (ss) sessionStorage.setItem('vault_ss_mpw', pw);
    if (ls) localStorage.setItem('vault_bio_sess', obf(pw, CRED_ID));
  }

  it('mode bawaan = auth: judul "Verifikasi Biometrik"', async () => {
    withSession();
    stub.get.mockReturnValue(new Promise(() => {}));
    render(<BiometricHintModal onClose={() => {}} />);
    await flush();
    expect(dlg('Verifikasi Biometrik')).toBeInTheDocument();
  });

  it('sesi ada: otomatis memanggil API (tanpa ketukan), menampilkan "Verifikasi sidik jari…" dan mengunci penutupan selama memuat', async () => {
    withSession();
    const d = deferred<unknown>();
    stub.get.mockReturnValue(d.promise);
    const onClose = vi.fn();
    render(<BiometricHintModal mode="auth" onClose={onClose} />);
    await flush();
    expect(stub.get).toHaveBeenCalledTimes(1);
    const dialog = dlg('Verifikasi Biometrik');
    expect(within(dialog).getByText(/Verifikasi sidik jari…/)).toBeInTheDocument();
    expect(closeX()).not.toBeInTheDocument();
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { d.resolve({}); await Promise.resolve(); });
  });

  it('opsi yang dikirim ke API (argumen stub): credentialId tersimpan, verifikasi pengguna wajib, challenge 32 byte', async () => {
    withSession();
    stub.get.mockReturnValue(new Promise(() => {}));
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    const pk = stub.get.mock.calls[0][0].publicKey;
    expect(pk.userVerification).toBe('required');
    expect(pk.challenge.byteLength).toBe(32);
    expect(pk.allowCredentials).toHaveLength(1);
    expect(Array.from(new Uint8Array(pk.allowCredentials[0].id))).toEqual(Array.from(RAW_ID));
  });

  it('berhasil (stub): "Verifikasi berhasil!", onSuccess(masterPw)+onClose baru setelah 600 ms, sesi cadangan diperbarui', async () => {
    withSession();
    localStorage.removeItem('vault_bio_sess'); // buktikan sesi cadangan DITULIS ulang setelah berhasil
    stub.get.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={onClose} />);
    await flush();
    expect(screen.getByText('Verifikasi berhasil!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Selesai' })).not.toBeInTheDocument(); // tombol Selesai khusus register
    act(() => { vi.advanceTimersByTime(599); });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(MASTER);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(unobf(localStorage.getItem('vault_bio_sess') ?? '', CRED_ID)).toBe(MASTER);
  });

  it('tanpa onSuccess: tetap menutup setelah berhasil (tidak crash)', async () => {
    withSession();
    stub.get.mockResolvedValue({});
    const onClose = vi.fn();
    render(<BiometricHintModal mode="auth" onClose={onClose} />);
    await flush();
    act(() => { vi.advanceTimersByTime(600); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sesi hanya ada di penyimpanan cadangan (sessionStorage kosong, mis. tab baru): dipulihkan ke sessionStorage dan auth berjalan', async () => {
    withSession(MASTER, { ss: false });
    stub.get.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={() => {}} />);
    await flush();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBe(MASTER);
    act(() => { vi.advanceTimersByTime(600); });
    expect(onSuccess).toHaveBeenCalledWith(MASTER);
  });

  it('sesi hanya di sessionStorage (belum ada cadangan di localStorage): auth berjalan dan menulis cadangan', async () => {
    withSession(MASTER, { ls: false });
    stub.get.mockResolvedValue({});
    const onSuccess = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={() => {}} />);
    await flush();
    act(() => { vi.advanceTimersByTime(600); });
    expect(onSuccess).toHaveBeenCalledWith(MASTER);
    expect(unobf(localStorage.getItem('vault_bio_sess') ?? '', CRED_ID)).toBe(MASTER);
  });

  it('sesi dipulihkan dari cadangan ke sessionStorage SEBELUM sensor diminta (tetap ada walau sensor menolak)', async () => {
    withSession(MASTER, { ss: false });
    stub.get.mockRejectedValue(domErr('NotAllowedError'));
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    expect(screen.getByText('Verifikasi biometrik ditolak atau dibatalkan.')).toBeInTheDocument();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBe(MASTER);
  });

  it('tidak ada sesi sama sekali: pesan "Sesi biometrik belum aktif…", tombol "Masuk dengan PIN / Password" menutup, API TIDAK dipanggil', async () => {
    localStorage.setItem('vault_bio_cred', CRED_ID);
    const onClose = vi.fn();
    render(<BiometricHintModal mode="auth" onClose={onClose} />);
    await flush();
    expect(screen.getByText('Sesi biometrik belum aktif. Masuk sekali dengan PIN atau master password — sidik jari aktif kembali setelahnya.')).toBeInTheDocument();
    expect(stub.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Masuk dengan PIN / Password' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sesi cadangan rusak (bukan base64 sah) dianggap tidak ada: tampil "sesi belum aktif", tanpa crash', async () => {
    localStorage.setItem('vault_bio_cred', CRED_ID);
    localStorage.setItem('vault_bio_sess', '%%%bukan-base64%%%');
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Masuk dengan PIN / Password' })).toBeInTheDocument();
    expect(stub.get).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBeNull(); // sesi rusak TIDAK dipulihkan sebagai string kosong
  });

  it('sesi cadangan tanpa credentialId tidak bisa dibuka (kuncinya hilang): sesi belum aktif', async () => {
    localStorage.setItem('vault_bio_sess', obf(MASTER, CRED_ID));
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    expect(screen.getByRole('button', { name: 'Masuk dengan PIN / Password' })).toBeInTheDocument();
    expect(stub.get).not.toHaveBeenCalled();
  });

  it('sesi ada tetapi belum ada sidik jari terdaftar: pesan "Belum ada sidik jari terdaftar…", API tidak dipanggil', async () => {
    withSession(MASTER, { cred: false, ls: false });
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    expect(screen.getByText('Belum ada sidik jari terdaftar. Daftarkan di Pengaturan terlebih dahulu.')).toBeInTheDocument();
    expect(stub.get).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();
  });

  it.each<[string, unknown, string]>([
    ['NotAllowedError', domErr('NotAllowedError'), 'Verifikasi biometrik ditolak atau dibatalkan.'],
    ['galat lain berpesan', new Error('Sensor terkunci'), 'Sensor terkunci'],
    ['galat tanpa pesan', new Error(''), 'Verifikasi gagal.'],
  ])('gagal: %s → pesan sesuai + Coba Lagi/Tutup; onSuccess tidak dipanggil', async (_label, err, message) => {
    withSession();
    stub.get.mockRejectedValue(err);
    const onSuccess = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={() => {}} />);
    await flush();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('hasil null dari API (dibatalkan): "Verifikasi dibatalkan."', async () => {
    withSession();
    stub.get.mockResolvedValue(null);
    render(<BiometricHintModal mode="auth" onClose={() => {}} />);
    await flush();
    expect(screen.getByText('Verifikasi dibatalkan.')).toBeInTheDocument();
  });

  it('sesi hilang SETELAH sensor menyetujui: pesan "Sesi biometrik belum aktif…terlebih dahulu" dan onSuccess tidak dipanggil', async () => {
    withSession();
    stub.get.mockImplementation(async () => {
      sessionStorage.clear();
      localStorage.removeItem('vault_bio_sess');
      return {};
    });
    const onSuccess = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={() => {}} />);
    await flush();
    expect(screen.getByText('Sesi biometrik belum aktif. Masuk sekali dengan PIN atau master password terlebih dahulu — sidik jari akan aktif kembali setelahnya.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Masuk dengan PIN / Password' })).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('Coba Lagi setelah gagal memanggil API lagi dan bisa berhasil', async () => {
    withSession();
    stub.get.mockRejectedValueOnce(domErr('NotAllowedError')).mockResolvedValueOnce({});
    const onSuccess = vi.fn();
    render(<BiometricHintModal mode="auth" onSuccess={onSuccess} onClose={() => {}} />);
    await flush();
    await click('Coba Lagi');
    expect(stub.get).toHaveBeenCalledTimes(2);
    act(() => { vi.advanceTimersByTime(600); });
    expect(onSuccess).toHaveBeenCalledWith(MASTER);
  });

  it('galat: tombol X dan latar menutup (tidak terkunci seperti saat memuat)', async () => {
    withSession();
    stub.get.mockRejectedValue(domErr('NotAllowedError'));
    const onClose = vi.fn();
    render(<BiometricHintModal mode="auth" onClose={onClose} />);
    await flush();
    const dialog = dlg('Verifikasi Biometrik');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Tutup' })[0]);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

/* ───────────────────────── clearBioSession ───────────────────────── */
describe('clearBioSession', () => {
  it('menghapus sesi (sessionStorage + cadangan) tetapi TIDAK menghapus credentialId maupun flag aktif', () => {
    sessionStorage.setItem('vault_ss_mpw', MASTER);
    localStorage.setItem('vault_bio_sess', obf(MASTER, CRED_ID));
    localStorage.setItem('vault_bio_cred', CRED_ID);
    localStorage.setItem('vault_bio_enabled', 'true');
    clearBioSession();
    expect(sessionStorage.getItem('vault_ss_mpw')).toBeNull();
    expect(localStorage.getItem('vault_bio_sess')).toBeNull();
    expect(localStorage.getItem('vault_bio_cred')).toBe(CRED_ID);
    expect(localStorage.getItem('vault_bio_enabled')).toBe('true');
  });

  it('aman dipanggil saat tidak ada sesi', () => {
    expect(() => clearBioSession()).not.toThrow();
  });
});
