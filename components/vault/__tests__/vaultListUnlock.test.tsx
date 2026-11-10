/**
 * components/vault/__tests__/vaultListUnlock.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga sisa VaultListView di luar header/filter (sudah dijaga 4B):
 *  - modal "Buka Entri" (handleUnlockSubmit): terbuka dari kartu terkunci; tombol Buka nonaktif
 *    untuk input kosong/spasi; ditutup lewat X/Batal/latar/Escape dan bersih saat dibuka lagi;
 *    master password cocok → TANPA memanggil verifyPinAndGetMaster; selain itu diverifikasi sebagai
 *    PIN (nilai apa adanya); salah → galat + tak ada perubahan; benar → hanya entri itu yang
 *    dilepas, kartu mengembang, tersimpan dengan 9 argumen benar; selama verifikasi input/Batal
 *    nonaktif; simpan GAGAL → lockedIds dikembalikan + toast galat;
 *  - handleEdit/handleSaved: tombol Edit membuka EntryForm (mode edit) menggantikan daftar, tutup
 *    kembali ke daftar, simpan → toast "Entri disimpan"; openAddForm lewat ref membuka form tambah;
 *  - handleCopy: salin cepat kartu → toast "<label> disalin!".
 *
 * Tidak diuji (sengaja): DetailView/handleDetail (tak terjangkau; USULAN U9). Tidak dikunci karena
 * diamati tetapi belum diputuskan: apakah kartu tetap terbuka setelah rollback kunci gagal
 * (toggleExpanded sudah jalan sebelum simpan; USULAN U27), tampilan "Memverifikasi…" (Button loading
 * menyembunyikan label; U13), fokus awal input.
 *
 * Konvensi: vaultService di-mock (kripto dijaga test lain); EntryForm di-stub (dijaga EntryForm.test);
 * elemen lewat role/label/teks UTUH. Pengecualian terdokumentasi: toast galat dibedakan lewat kelas
 * .toast--error (tak ada role per jenis), latar modal (.vl-unlock-overlay) karena overlay ini
 * bukan role=dialog.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { VaultListView, type VaultListViewRef } from '../VaultListView';
import { useAppStore } from '@/lib/store/appStore';
import * as svc from '@/lib/vaultService';
import type { CustomCategory, VaultEntry, VaultMeta } from '@/lib/types';

vi.mock('@/lib/vaultService', () => ({ saveVault: vi.fn(), verifyPinAndGetMaster: vi.fn() }));
vi.mock('@/components/entries/EntryForm', () => ({
  EntryForm: (p: { entry?: VaultEntry; onClose: () => void; onSaved: (e: VaultEntry) => void }) => (
    <div role="form" aria-label={p.entry ? `Form edit ${p.entry.name}` : 'Form tambah'}>
      <button onClick={() => p.onSaved(p.entry ?? ({ id: 'baru', cat: 'lainnya', name: 'Baru', ts: 1 } as VaultEntry))}>Simpan stub</button>
      <button onClick={p.onClose}>Tutup stub</button>
    </div>
  ),
}));
const saveVault = vi.mocked(svc.saveVault);
const verifyPin = vi.mocked(svc.verifyPinAndGetMaster);

const meta: VaultMeta = { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' };
const CATS: CustomCategory[] = [{ id: 'c1', label: 'Kustom', emoji: 'Briefcase', iconKey: 'Briefcase' }];
const NETS = [{ id: 'n1', label: 'Net Satu' }];
const E1: VaultEntry = { id: 'e1', cat: 'sosmed', name: 'Akun Terkunci', ts: 1, user: 'pengguna1', pass: 'Rahasia-1' };
const E2: VaultEntry = { id: 'e2', cat: 'sosmed', name: 'Akun Dua', ts: 2, user: 'pengguna2', pass: 'Rahasia-2' };
const E3: VaultEntry = { id: 'e3', cat: 'sosmed', name: 'Akun Tiga', ts: 3, user: 'pengguna3', pass: 'Rahasia-3' };

function setup(over: Partial<ReturnType<typeof useAppStore.getState>> = {}) {
  useAppStore.setState(useAppStore.getInitialState(), true);
  useAppStore.setState({
    vault: [E1, E2, E3], recycleBin: [], customCats: CATS, lockedIds: ['e1', 'e3'], lockedCatIds: ['lc'],
    defaultCatFieldOverrides: { email: [] }, customNetworks: NETS, masterPw: 'pw-master', vaultMeta: meta,
    autoSaveEnabled: true, currentFilter: 'all', searchQuery: '', expandedIds: [], ...over,
  });
}
const writeText = vi.fn();
beforeEach(() => {
  localStorage.clear();
  saveVault.mockReset(); saveVault.mockResolvedValue(undefined);
  verifyPin.mockReset(); verifyPin.mockRejectedValue(new Error('PIN salah'));
  writeText.mockReset(); writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  setup();
});
afterAll(() => { Reflect.deleteProperty(navigator, 'clipboard'); });

const input = () => screen.getByPlaceholderText('PIN atau Master Password') as HTMLInputElement;
const bukaBtn = () => screen.getByRole('button', { name: 'Buka' });
const batalBtn = () => screen.getByRole('button', { name: 'Batal' });
const modalOpen = () => screen.queryByText('Buka Entri') !== null;
const type = (v: string) => fireEvent.change(input(), { target: { value: v } });
const openUnlock = (name = 'Akun Terkunci') => fireEvent.click(screen.getByRole('button', { name: `Buka ${name}` }));
const lockedIds = () => useAppStore.getState().lockedIds;

/* ───────────────────────── membuka / menutup modal ───────────────────────── */
describe('VaultListView — modal "Buka Entri": buka dan tutup', () => {
  it('klik kartu terkunci membuka modal dengan nama entri, petunjuk, input password kosong', () => {
    render(<VaultListView />);
    expect(modalOpen()).toBe(false);
    openUnlock();
    expect(modalOpen()).toBe(true);
    expect(screen.getByText('Akun Terkunci', { selector: '.vl-unlock-name' })).toBeInTheDocument();
    expect(screen.getByText('Masukkan PIN atau Master Password')).toBeInTheDocument();
    expect(input()).toHaveAttribute('type', 'password');
    expect(input().value).toBe('');
    expect(lockedIds()).toEqual(['e1', 'e3']);
  });

  it('kartu TIDAK terkunci tidak membuka modal (langsung mengembang)', () => {
    render(<VaultListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Buka Akun Dua' }));
    expect(modalOpen()).toBe(false);
    expect(useAppStore.getState().expandedIds).toEqual(['e2']);
  });

  it('tombol Buka nonaktif untuk input kosong dan hanya spasi; aktif bila ada isi', () => {
    render(<VaultListView />);
    openUnlock();
    expect(bukaBtn()).toBeDisabled();
    type('   ');
    expect(bukaBtn()).toBeDisabled();
    type('x');
    expect(bukaBtn()).toBeEnabled();
  });

  it('Enter pada input kosong/spasi tidak memverifikasi apa pun dan tidak menampilkan galat', async () => {
    render(<VaultListView />);
    openUnlock();
    fireEvent.keyDown(input(), { key: 'Enter' });
    type('   ');
    fireEvent.keyDown(input(), { key: 'Enter' });
    await act(async () => { await Promise.resolve(); });
    expect(verifyPin).not.toHaveBeenCalled();
    expect(saveVault).not.toHaveBeenCalled();
    expect(screen.queryByText(/salah/)).not.toBeInTheDocument();
    expect(modalOpen()).toBe(true);
  });

  it.each([
    ['tombol X (Tutup)', () => fireEvent.click(screen.getByRole('button', { name: 'Tutup' }))],
    ['tombol Batal', () => fireEvent.click(batalBtn())],
    ['klik latar', () => { const o = document.querySelector('.vl-unlock-overlay'); if (!o) throw new Error('latar tidak ada'); fireEvent.click(o); }],
    ['Escape pada input', () => fireEvent.keyDown(input(), { key: 'Escape' })],
  ])('menutup modal lewat %s tanpa mengubah kunci', (_n, tutup) => {
    render(<VaultListView />);
    openUnlock();
    type('sesuatu');
    tutup();
    expect(modalOpen()).toBe(false);
    expect(lockedIds()).toEqual(['e1', 'e3']);
    expect(verifyPin).not.toHaveBeenCalled();
  });

  it.each([
    ['tombol Batal', () => fireEvent.click(batalBtn())],
    ['tombol X (Tutup)', () => fireEvent.click(screen.getByRole('button', { name: 'Tutup' }))],
    ['Escape pada input', () => fireEvent.keyDown(input(), { key: 'Escape' })],
    ['klik latar', () => { const o = document.querySelector('.vl-unlock-overlay'); if (!o) throw new Error('latar tidak ada'); fireEvent.click(o); }],
  ])('dibuka lagi setelah ditutup lewat %s: input kosong dan galat sebelumnya hilang', async (_n, tutup) => {
    render(<VaultListView />);
    openUnlock();
    type('salah');
    fireEvent.click(bukaBtn());
    await screen.findByText('PIN atau master password salah');
    tutup();
    openUnlock();
    expect(input().value).toBe('');
    expect(screen.queryByText('PIN atau master password salah')).not.toBeInTheDocument();
  });

  it('klik di dalam kartu modal tidak menutup modal', () => {
    render(<VaultListView />);
    openUnlock();
    fireEvent.click(screen.getByText('Masukkan PIN atau Master Password'));
    fireEvent.click(input());
    expect(modalOpen()).toBe(true);
  });

  it('modal membuka entri YANG DIKLIK (bukan entri terkunci lain)', () => {
    render(<VaultListView />);
    openUnlock('Akun Tiga');
    expect(screen.getByText('Akun Tiga', { selector: '.vl-unlock-name' })).toBeInTheDocument();
  });
});

/* ───────────────────────── verifikasi ───────────────────────── */
describe('VaultListView — modal "Buka Entri": verifikasi', () => {
  it('password SALAH: pesan galat, modal tetap, tak ada perubahan kunci/ekspansi/penyimpanan', async () => {
    render(<VaultListView />);
    openUnlock();
    type('bukan-pin');
    fireEvent.click(bukaBtn());
    expect(await screen.findByText('PIN atau master password salah')).toBeInTheDocument();
    expect(verifyPin).toHaveBeenCalledTimes(1);
    expect(verifyPin).toHaveBeenCalledWith('bukan-pin');
    expect(modalOpen()).toBe(true);
    expect(lockedIds()).toEqual(['e1', 'e3']);
    expect(useAppStore.getState().expandedIds).toEqual([]);
    expect(saveVault).not.toHaveBeenCalled();
    expect(input()).toBeEnabled();
  });

  it('mengetik lagi menghapus pesan galat', async () => {
    render(<VaultListView />);
    openUnlock();
    type('salah');
    fireEvent.click(bukaBtn());
    await screen.findByText('PIN atau master password salah');
    type('salah2');
    expect(screen.queryByText('PIN atau master password salah')).not.toBeInTheDocument();
  });

  it('master password COCOK: verifyPinAndGetMaster TIDAK dipanggil (tidak menghitung percobaan PIN)', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(modalOpen()).toBe(false));
    expect(verifyPin).not.toHaveBeenCalled();
  });

  it('master password benar: HANYA entri itu dilepas, kartunya mengembang, modal menutup, tersimpan dengan 9 argumen', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    expect(lockedIds()).toEqual(['e3']);
    expect(useAppStore.getState().expandedIds).toEqual(['e1']);
    expect(saveVault).toHaveBeenCalledWith('pw-master', [E1, E2, E3], [], meta, CATS, ['e3'], ['lc'], { email: [] }, NETS);
    await waitFor(() => expect(modalOpen()).toBe(false));
    expect(screen.getByRole('button', { name: 'Tutup Akun Terkunci' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Buka Akun Tiga' })).toBeInTheDocument(); // e3 tetap terkunci
  });

  it('PIN benar (verifyPinAndGetMaster berhasil): hasil sama; dipanggil tepat sekali dengan input apa adanya', async () => {
    verifyPin.mockResolvedValue('pw-master');
    render(<VaultListView />);
    openUnlock();
    type('123456');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    expect(verifyPin).toHaveBeenCalledTimes(1);
    expect(verifyPin).toHaveBeenCalledWith('123456');
    expect(lockedIds()).toEqual(['e3']);
    expect(useAppStore.getState().expandedIds).toEqual(['e1']);
    await waitFor(() => expect(modalOpen()).toBe(false));
  });

  it('input TIDAK di-trim untuk perbandingan: " pw-master " diverifikasi sebagai PIN (bukan master password)', async () => {
    verifyPin.mockResolvedValue('pw-master');
    render(<VaultListView />);
    openUnlock();
    type(' pw-master ');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(verifyPin).toHaveBeenCalledWith(' pw-master '));
  });

  it('Enter pada input = klik Buka', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.keyDown(input(), { key: 'Enter' });
    await waitFor(() => expect(lockedIds()).toEqual(['e3']));
  });

  it('tombol lain (mis. "a") pada input tidak mengirim', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.keyDown(input(), { key: 'a' });
    await act(async () => { await Promise.resolve(); });
    expect(lockedIds()).toEqual(['e1', 'e3']);
  });

  it('selama verifikasi: input dan Batal nonaktif; setelah selesai modal menutup', async () => {
    let selesai: (v: string) => void = () => {};
    verifyPin.mockImplementation(() => new Promise<string>((r) => { selesai = r; }));
    render(<VaultListView />);
    openUnlock();
    type('123456');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(batalBtn()).toBeDisabled();
    expect(lockedIds()).toEqual(['e1', 'e3']);
    await act(async () => { selesai('pw-master'); await Promise.resolve(); });
    await waitFor(() => expect(modalOpen()).toBe(false));
    expect(lockedIds()).toEqual(['e3']);
  });

  it('setelah berhasil membuka satu entri, modal entri terkunci berikutnya bersih dan aktif (tidak macet loading)', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(modalOpen()).toBe(false));
    openUnlock('Akun Tiga');
    expect(input().value).toBe('');
    expect(input()).toBeEnabled();
    expect(batalBtn()).toBeEnabled();
    expect(screen.queryByText(/salah/)).not.toBeInTheDocument();
  });

  it('setelah simpan GAGAL, modal berikutnya juga tidak macet loading', async () => {
    saveVault.mockRejectedValueOnce(new Error('kuota penuh'));
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    await screen.findByText('Gagal menyimpan perubahan, coba lagi');
    await waitFor(() => expect(modalOpen()).toBe(false));
    openUnlock('Akun Tiga'); // e3 masih terkunci; keadaan kartu e1 setelah rollback sengaja tidak diperiksa (U27)
    expect(input()).toBeEnabled();
    expect(batalBtn()).toBeEnabled();
  });

  it('percobaan ulang setelah galat: pesan galat hilang selama verifikasi berjalan', async () => {
    render(<VaultListView />);
    openUnlock();
    type('salah');
    fireEvent.click(bukaBtn());
    await screen.findByText('PIN atau master password salah');
    verifyPin.mockImplementation(() => new Promise<string>(() => {})); // menggantung
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(input()).toBeDisabled());
    expect(screen.queryByText('PIN atau master password salah')).not.toBeInTheDocument();
  });

  it('galat verifikasi (ditolak) mengaktifkan kembali input dan Batal', async () => {
    render(<VaultListView />);
    openUnlock();
    type('salah');
    fireEvent.click(bukaBtn());
    await screen.findByText('PIN atau master password salah');
    expect(input()).toBeEnabled();
    expect(batalBtn()).toBeEnabled();
  });
});

/* ───────────────────────── gagal simpan → rollback ───────────────────────── */
describe('VaultListView — buka entri: simpan GAGAL', () => {
  it('lockedIds dikembalikan ke daftar semula, toast galat tampil, modal menutup, tidak ada galat verifikasi', async () => {
    saveVault.mockRejectedValue(new Error('kuota penuh'));
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    expect(await screen.findByText('Gagal menyimpan perubahan, coba lagi')).toBeInTheDocument();
    expect(lockedIds()).toEqual(['e1', 'e3']);
    expect(document.querySelector('.toast--error')).not.toBeNull();
    await waitFor(() => expect(modalOpen()).toBe(false));
    expect(screen.queryByText('Gagal memverifikasi, coba lagi')).not.toBeInTheDocument();
  });

  it('simpan sukses: tidak ada toast galat', async () => {
    render(<VaultListView />);
    openUnlock();
    type('pw-master');
    fireEvent.click(bukaBtn());
    await waitFor(() => expect(modalOpen()).toBe(false));
    expect(screen.queryByText('Gagal menyimpan perubahan, coba lagi')).not.toBeInTheDocument();
    expect(document.querySelector('.toast--error')).toBeNull();
  });
});

/* ───────────────────────── edit / tambah / salin ───────────────────────── */
describe('VaultListView — edit, tambah, dan salin', () => {
  it('Edit pada kartu terbuka → EntryForm mode edit menggantikan daftar', () => {
    setup({ expandedIds: ['e2'] });
    render(<VaultListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('form', { name: 'Form edit Akun Dua' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^(Buka|Tutup) Akun Dua$/ })).not.toBeInTheDocument();
  });

  it('menutup form edit kembali ke daftar tanpa toast', () => {
    setup({ expandedIds: ['e2'] });
    render(<VaultListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutup stub' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Buka|Tutup) Akun Dua$/ })).toBeInTheDocument();
    expect(screen.queryByText('Entri disimpan')).not.toBeInTheDocument();
  });

  it('simpan lalu tutup (urutan EntryForm) → toast "Entri disimpan" tampil di daftar', async () => {
    setup({ expandedIds: ['e2'] });
    render(<VaultListView />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan stub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutup stub' }));
    expect(await screen.findByText('Entri disimpan')).toBeInTheDocument();
  });

  it('openAddForm (ref) membuka EntryForm mode tambah; tutup kembali; simpan → toast', async () => {
    const ref = createRef<VaultListViewRef>();
    render(<VaultListView ref={ref} />);
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    act(() => { ref.current?.openAddForm(); });
    expect(screen.getByRole('form', { name: 'Form tambah' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup stub' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    act(() => { ref.current?.openAddForm(); });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan stub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tutup stub' }));
    expect(await screen.findByText('Entri disimpan')).toBeInTheDocument();
  });

  it('salin cepat pada kartu → toast "<label> disalin!" (Username dan Password)', async () => {
    render(<VaultListView />);
    const kartu = screen.getByRole('button', { name: 'Buka Akun Dua' });
    fireEvent.click(within(kartu).getByRole('button', { name: 'Salin username' }));
    expect(await screen.findByText('Username disalin!')).toBeInTheDocument();
    fireEvent.click(within(kartu).getByRole('button', { name: 'Salin password' }));
    expect(await screen.findByText('Password disalin!')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('pengguna2');
    expect(writeText).toHaveBeenCalledWith('Rahasia-2');
  });
});

/* ───────────────────────── wiring kartu di kedua jalur render ───────────────────────── */
describe.each([['name_asc', 'urutan biasa'], ['cat_group', 'mode Per kategori']] as const)(
  'VaultListView — kartu pada %s (%s): handler dan properti tersambung',
  (sortBy, _nama) => {
    beforeEach(() => { useAppStore.setState({ sortBy }); });

    it('kartu terkunci → modal Buka Entri (onRequestUnlock tersambung)', () => {
      render(<VaultListView />);
      openUnlock();
      expect(modalOpen()).toBe(true);
    });

    it('Edit → form edit (onEdit tersambung)', () => {
      useAppStore.setState({ expandedIds: ['e2'] });
      render(<VaultListView />);
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      expect(screen.getByRole('form', { name: 'Form edit Akun Dua' })).toBeInTheDocument();
    });

    it('salin cepat → toast (onCopy tersambung)', async () => {
      render(<VaultListView />);
      fireEvent.click(within(screen.getByRole('button', { name: 'Buka Akun Dua' })).getByRole('button', { name: 'Salin username' }));
      expect(await screen.findByText('Username disalin!')).toBeInTheDocument();
    });

    it('di Sampah: kartu berada dalam mode Sampah (Pulihkan + Hapus Permanen, tanpa Edit) — isRecycleBin tersambung', () => {
      useAppStore.setState({ currentFilter: 'bin', recycleBin: [E2], expandedIds: ['e2'], lockedIds: [] });
      render(<VaultListView />);
      expect(screen.getByRole('button', { name: 'Pulihkan' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hapus Permanen' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });

    it('di luar Sampah: kartu BUKAN mode Sampah (ada Edit, tanpa Pulihkan)', () => {
      useAppStore.setState({ expandedIds: ['e2'] });
      render(<VaultListView />);
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pulihkan' })).not.toBeInTheDocument();
    });
  },
);

describe('VaultListView — sub-judul kategori (mode Per kategori)', () => {
  it('kategori kustom memakai label kustomnya; kategori tak dikenal memakai id mentah', () => {
    const kustom: VaultEntry = { id: 'e4', cat: 'c1', name: 'Akun Kustom', ts: 4 };
    const asing: VaultEntry = { id: 'e5', cat: 'zzz-asing', name: 'Akun Asing', ts: 5 };
    useAppStore.setState({ sortBy: 'cat_group', vault: [kustom, asing], lockedIds: [] });
    render(<VaultListView />);
    expect(screen.getByText('Kustom', { selector: '.vault-cat-group-label' })).toBeInTheDocument();
    expect(screen.getByText('zzz-asing', { selector: '.vault-cat-group-label' })).toBeInTheDocument();
  });
});
