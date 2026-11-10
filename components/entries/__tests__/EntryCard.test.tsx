/**
 * components/entries/__tests__/EntryCard.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga kartu entri (EntryCard) yang dipakai di seluruh daftar:
 *  - kepala kartu: nama, sub-label per kategori, penanda favorit/terkunci, brand (--brand);
 *  - ekspansi lewat klik/Enter/Spasi (status di store, a11y aria-expanded), badan dibuat saat
 *    pertama dibuka; entri TERKUNCI meminta buka kunci (onRequestUnlock), bukan mengembang;
 *  - salin cepat user/password (hanya saat tertutup, tidak terkunci, bukan Sampah; umpan balik
 *    centang tepat 1500 ms; tidak ikut mengembangkan kartu);
 *  - isi badan per kategori (crypto/kartu/wifi/bank/email/umum): label, fallback, field kosong
 *    disembunyikan, rahasia TIDAK ada di DOM saat tersembunyi, salin memakai nilai asli;
 *  - seed phrase (sembunyi/tampil/salin); tombol aksi berbeda di Sampah vs vault;
 *  - dialog konfirmasi tiap aksi (judul/pesan/label/varian), batal tidak mengubah apa pun;
 *  - efek aksi pada store + penyimpanan (saveVault dengan 9 argumen yang benar): favorit, hapus
 *    ke Sampah (ts), hapus permanen, pulihkan, kunci/lepas kunci (+ rollback bila simpan gagal).
 *
 * Tidak diuji (sengaja): onDetail (tak pernah dipanggil; USULAN U9) dan DetailView.
 * TIDAK dikunci karena diamati tetapi belum diputuskan (lihat USULAN U25–U27 di laporan):
 *  salin gagal tetap memanggil onCopy; aksi favorit/hapus/pulihkan tanpa rollback saat simpan
 *  gagal; apakah kartu tetap terbuka setelah rollback kunci.
 *
 * Konvensi: elemen dicari lewat role/label/teks UTUH. Pengecualian terdokumentasi (tak ada
 * alternatif a11y): badan kartu (.entry-card__body-wrap, atribut inert), label field
 * (.entry-field__label, urutan), sub-label (.entry-card__sub), keadaan "tersalin" (kelas
 * *--copied karena nama aksesibel tombol tidak berubah), wadah kartu ([data-id], gaya --brand).
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat. Dua test REGRESI (bagian "keyboard pada tombol salin cepat")
 *    direproduksi dulu sebagai GAGAL sebelum EntryCard.tsx diperbaiki: keydown Enter/Spasi pada
 *    tombol salin cepat (anak kepala role=button) ikut menjalankan handler kepala → kartu
 *    mengembang dan preventDefault membatalkan klik tombol, sehingga salin cepat tak bisa
 *    dipakai dengan keyboard.
 */
import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { EntryCard } from '../EntryCard';
import { EntryIcon } from '../EntryIcon';
import { useAppStore } from '@/lib/store/appStore';
import * as svc from '@/lib/vaultService';
import { ALL_BRAND_ICONS } from '@/lib/brand-icons';
import type { CustomCategory, VaultEntry, VaultMeta } from '@/lib/types';

vi.mock('@/lib/vaultService', () => ({ saveVault: vi.fn() }));
const saveVault = vi.mocked(svc.saveVault);

const meta: VaultMeta = { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' };
const CATS: CustomCategory[] = [{ id: 'c1', label: 'Kustom', emoji: 'Briefcase', iconKey: 'Briefcase' }];
const NETS = [{ id: 'n1', label: 'Net Satu' }];
const mk = (over: Partial<VaultEntry> = {}): VaultEntry =>
  ({ id: 'e1', cat: 'sosmed', name: 'Akun Uji', ts: 1, user: 'pengguna1', pass: 'Rahasia-123', ...over } as VaultEntry);

type StoreState = ReturnType<typeof useAppStore.getState>;
function setup(entry: VaultEntry, over: Partial<StoreState> = {}) {
  useAppStore.setState({
    vault: [entry], recycleBin: [], customCats: CATS, lockedIds: [], expandedIds: [], pwVisible: {}, seedVisible: {},
    masterPw: 'pw-master', vaultMeta: meta, lockedCatIds: ['lc'], defaultCatFieldOverrides: { email: [] },
    customNetworks: NETS, autoSaveEnabled: true, ...over,
  });
}
function renderCard(entry: VaultEntry, over: Partial<StoreState> = {}, props: Partial<React.ComponentProps<typeof EntryCard>> = {}) {
  setup(entry, over);
  const onEdit = vi.fn();
  const onCopy = vi.fn();
  const onRequestUnlock = vi.fn();
  const utils = render(<EntryCard entry={entry} onEdit={onEdit} onCopy={onCopy} onRequestUnlock={onRequestUnlock} {...props} />);
  return { onEdit, onCopy, onRequestUnlock, ...utils };
}

const header = (name = 'Akun Uji') => screen.getByRole('button', { name: new RegExp(`^(Buka|Tutup) ${name}$`) });
const cardEl = (container: HTMLElement) => {
  const el = container.querySelector('[data-id]');
  if (!(el instanceof HTMLElement)) throw new Error('wadah kartu tidak ditemukan');
  return el;
};
const fieldLabels = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.entry-field__label')).map((n) => n.textContent);
/** Nilai tampil sebuah field di badan (label → teks nilai), bebas dari sub-label kepala yang bisa sama. */
function fieldValue(container: HTMLElement, label: string): string | undefined {
  const f = Array.from(container.querySelectorAll('.entry-field')).find(
    (n) => n.querySelector('.entry-field__label')?.textContent === label,
  );
  return f?.querySelector('.entry-field__value')?.textContent ?? undefined;
}
/** Markup ikon yang dirender terpisah (membandingkan ikon kepala yang tak punya nama a11y). */
function iconMarkup(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const html = container.innerHTML;
  unmount();
  return html;
}
const bodyWrap = (container: HTMLElement) => container.querySelector('.entry-card__body-wrap');
const expanded = () => useAppStore.getState().expandedIds;

const writeText = vi.fn();
function stubClipboard(impl: () => Promise<void> = () => Promise.resolve()) {
  writeText.mockReset();
  writeText.mockImplementation(impl);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

beforeEach(() => {
  saveVault.mockReset();
  saveVault.mockResolvedValue(undefined);
  stubClipboard();
});
afterEach(() => { vi.useRealTimers(); });
afterAll(() => { Reflect.deleteProperty(navigator, 'clipboard'); });

/* ───────────────────────── kepala kartu ───────────────────────── */
describe('EntryCard — kepala kartu (tertutup)', () => {
  it('tombol kepala: nama aksesibel "Buka <nama>", aria-expanded=false, nama entri tampil', () => {
    renderCard(mk());
    const h = header();
    expect(h).toHaveAccessibleName('Buka Akun Uji');
    expect(h).toHaveAttribute('aria-expanded', 'false');
    expect(within(h).getByText('Akun Uji')).toBeInTheDocument();
  });

  it.each([
    ['umum: user lebih dulu dari url', mk({ user: 'u-satu', url: 'https://a.example' }), 'u-satu'],
    ['umum: tanpa user memakai url', mk({ user: undefined, url: 'https://a.example' }), 'https://a.example'],
    ['wifi: wifiSSID', mk({ cat: 'wifi', wifiSSID: 'SSID-X', user: 'u-lain' }), 'SSID-X'],
    ['wifi: tanpa wifiSSID memakai user', mk({ cat: 'wifi', wifiSSID: undefined, user: 'u-wifi' }), 'u-wifi'],
    ['kartu: nama pemegang', mk({ cat: 'kartu', cardHolder: 'BUDI S', user: 'u-lain' }), 'BUDI S'],
    ['email: emailAddr', mk({ cat: 'email', emailAddr: 'a@b.example', user: 'u-lain' }), 'a@b.example'],
    ['email: tanpa emailAddr memakai user', mk({ cat: 'email', emailAddr: undefined, user: 'u-mail' }), 'u-mail'],
  ])('sub-label — %s', (_n, entry, expected) => {
    const { container } = renderCard(entry);
    expect(container.querySelector('.entry-card__sub')?.textContent).toBe(expected);
  });

  it.each([
    ['umum tanpa user dan url', mk({ user: undefined, url: undefined })],
    ['kartu tanpa pemegang (tidak jatuh ke user)', mk({ cat: 'kartu', cardHolder: undefined, user: 'harusnya-tak-tampil' })],
  ])('tanpa sub-label — %s', (_n, entry) => {
    const { container } = renderCard(entry);
    expect(container.querySelector('.entry-card__sub')).toBeNull();
  });

  it('penanda favorit hanya bila fav; penanda terkunci hanya bila id ada di lockedIds', () => {
    const a = renderCard(mk());
    expect(screen.queryByLabelText('Favorit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Terkunci')).not.toBeInTheDocument();
    a.unmount();
    renderCard(mk({ fav: true }), { lockedIds: ['e1'] });
    expect(screen.getByLabelText('Favorit')).toBeInTheDocument();
    expect(screen.getByLabelText('Terkunci')).toBeInTheDocument();
  });

  it('lockedIds berisi id LAIN → entri ini tidak tampil terkunci', () => {
    renderCard(mk(), { lockedIds: ['lain'] });
    expect(screen.queryByLabelText('Terkunci')).not.toBeInTheDocument();
  });

  it('wadah kartu membawa data-id dan kelas keadaan (terbuka/terkunci/sampah)', () => {
    const a = renderCard(mk());
    expect(cardEl(a.container)).toHaveAttribute('data-id', 'e1');
    expect(cardEl(a.container).className).not.toMatch(/entry-card--(expanded|locked|bin)/);
    a.unmount();
    const b = renderCard(mk(), { lockedIds: ['e1'], expandedIds: ['e1'] }, { isRecycleBin: true });
    expect(cardEl(b.container)).toHaveClass('entry-card--expanded', 'entry-card--locked', 'entry-card--bin');
  });

  it('brand dikenal → CSS var --brand = #accent bila ada, #hex bila tidak; tak dikenal/kosong → tanpa --brand', () => {
    const tanpaAccent = ALL_BRAND_ICONS.find((b) => !b.accent);
    const denganAccent = ALL_BRAND_ICONS.find((b) => b.accent && b.accent !== b.hex);
    expect(tanpaAccent, 'katalog harus punya brand tanpa accent').toBeDefined();
    expect(denganAccent, 'katalog harus punya brand dengan accent berbeda dari hex').toBeDefined();
    if (!tanpaAccent || !denganAccent) return;
    const a = renderCard(mk({ brandIconSlug: tanpaAccent.slug }));
    expect(cardEl(a.container).style.getPropertyValue('--brand')).toBe(`#${tanpaAccent.hex}`);
    a.unmount();
    const w = renderCard(mk({ brandIconSlug: denganAccent.slug }));
    expect(cardEl(w.container).style.getPropertyValue('--brand')).toBe(`#${denganAccent.accent}`);
    w.unmount();
    const c = renderCard(mk({ brandIconSlug: 'brand-tidak-ada-xyz' }));
    expect(cardEl(c.container).style.getPropertyValue('--brand')).toBe('');
    c.unmount();
    const d = renderCard(mk());
    expect(cardEl(d.container).style.getPropertyValue('--brand')).toBe('');
  });
});

describe('EntryCard — ikon kepala', () => {
  it('ikon kepala = EntryIcon ukuran xl dengan kategori kustom entri (bukan ikon generik)', () => {
    const entry = mk({ cat: 'c1' });
    renderCard(entry);
    const diharapkan = iconMarkup(<EntryIcon entry={entry} customCats={CATS} size="xl" />);
    expect(header().firstElementChild?.outerHTML).toBe(diharapkan);
    expect(diharapkan).not.toBe(iconMarkup(<EntryIcon entry={entry} customCats={[]} size="xl" />));
  });

  it('ikon kepala memakai logo brand bila brandIconSlug dikenal', () => {
    const entry = mk({ cat: 'sosmed', brandIconSlug: 'binance' });
    renderCard(entry);
    expect(header().firstElementChild?.outerHTML).toBe(iconMarkup(<EntryIcon entry={entry} customCats={CATS} size="xl" />));
    expect(header().firstElementChild?.outerHTML).not.toBe(iconMarkup(<EntryIcon entry={mk({ cat: 'sosmed' })} customCats={CATS} size="xl" />));
  });
});

/* ───────────────────────── ekspansi ───────────────────────── */
describe('EntryCard — ekspansi', () => {
  it('klik kepala mengembangkan (id masuk expandedIds), klik lagi menutup', () => {
    renderCard(mk());
    fireEvent.click(header());
    expect(expanded()).toEqual(['e1']);
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(header()).toHaveAccessibleName('Tutup Akun Uji');
    fireEvent.click(header());
    expect(expanded()).toEqual([]);
    expect(header()).toHaveAttribute('aria-expanded', 'false');
  });

  it('keyboard: Enter dan Spasi pada kepala mengembangkan dan dibatalkan default-nya; tombol lain tidak', () => {
    renderCard(mk());
    const h = header();
    expect(fireEvent.keyDown(h, { key: 'Enter' })).toBe(false); // false = preventDefault dipanggil
    expect(expanded()).toEqual(['e1']);
    expect(fireEvent.keyDown(h, { key: ' ' })).toBe(false);
    expect(expanded()).toEqual([]);
    expect(fireEvent.keyDown(h, { key: 'a' })).toBe(true);
    expect(fireEvent.keyDown(h, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(h, { key: 'Escape' })).toBe(true);
    expect(expanded()).toEqual([]);
  });

  it('kepala fokusable (tabIndex 0)', () => {
    renderCard(mk());
    expect(header()).toHaveAttribute('tabindex', '0');
  });

  it('badan kartu BELUM dibuat sebelum pertama dibuka; setelah dibuka lalu ditutup tetap ada tetapi inert', async () => {
    const { container } = renderCard(mk());
    expect(bodyWrap(container)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Salin Password' })).not.toBeInTheDocument();
    fireEvent.click(header());
    expect(bodyWrap(container)).not.toBeNull();
    await waitFor(() => expect(bodyWrap(container)).not.toHaveAttribute('inert'));
    expect(bodyWrap(container)).toHaveClass('entry-card__body-wrap--open');
    fireEvent.click(header());
    await waitFor(() => expect(bodyWrap(container)).toHaveAttribute('inert'));
    expect(bodyWrap(container)).not.toHaveClass('entry-card__body-wrap--open');
  });

  it('dibuka ulang setelah ditutup: kelas --open baru terpasang SETELAH frame berikutnya (animasi mulai dari tertutup)', async () => {
    const { container } = renderCard(mk());
    fireEvent.click(header());
    await waitFor(() => expect(bodyWrap(container)).toHaveClass('entry-card__body-wrap--open'));
    fireEvent.click(header());
    await waitFor(() => expect(bodyWrap(container)).not.toHaveClass('entry-card__body-wrap--open'));
    fireEvent.click(header());
    expect(header()).toHaveAttribute('aria-expanded', 'true');
    expect(bodyWrap(container)).not.toHaveClass('entry-card__body-wrap--open'); // belum: menunggu frame
    expect(bodyWrap(container)).toHaveAttribute('inert');
    await waitFor(() => expect(bodyWrap(container)).toHaveClass('entry-card__body-wrap--open'));
  });

  it('kartu yang sudah terbuka sejak awal (expandedIds berisi id) langsung punya badan', () => {
    const { container } = renderCard(mk(), { expandedIds: ['e1'] });
    expect(bodyWrap(container)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Salin Password' })).toBeInTheDocument();
  });

  it('expandedIds berisi id LAIN → kartu ini tertutup', () => {
    renderCard(mk(), { expandedIds: ['lain'] });
    expect(header()).toHaveAttribute('aria-expanded', 'false');
  });
});

/* ───────────────────────── entri terkunci ───────────────────────── */
describe('EntryCard — entri terkunci', () => {
  it('klik kepala (tertutup) → onRequestUnlock(entry), TIDAK mengembang', () => {
    const entry = mk();
    const { onRequestUnlock } = renderCard(entry, { lockedIds: ['e1'] });
    fireEvent.click(header());
    expect(onRequestUnlock).toHaveBeenCalledTimes(1);
    expect(onRequestUnlock).toHaveBeenCalledWith(entry);
    expect(expanded()).toEqual([]);
  });

  it('Enter dan Spasi pada kepala terkunci juga meminta buka kunci', () => {
    const { onRequestUnlock } = renderCard(mk(), { lockedIds: ['e1'] });
    fireEvent.keyDown(header(), { key: 'Enter' });
    fireEvent.keyDown(header(), { key: ' ' });
    expect(onRequestUnlock).toHaveBeenCalledTimes(2);
    expect(expanded()).toEqual([]);
  });

  it('terkunci tetapi sudah terbuka: klik MENUTUP kartu dan tidak meminta buka kunci', () => {
    const { onRequestUnlock } = renderCard(mk(), { lockedIds: ['e1'], expandedIds: ['e1'] });
    fireEvent.click(header());
    expect(onRequestUnlock).not.toHaveBeenCalled();
    expect(expanded()).toEqual([]);
  });

  it('tanpa onRequestUnlock: klik kepala terkunci tidak crash dan tidak mengembang', () => {
    renderCard(mk(), { lockedIds: ['e1'] }, { onRequestUnlock: undefined });
    fireEvent.click(header());
    expect(expanded()).toEqual([]);
  });

  it('tidak terkunci: klik kepala tidak memanggil onRequestUnlock', () => {
    const { onRequestUnlock } = renderCard(mk());
    fireEvent.click(header());
    expect(onRequestUnlock).not.toHaveBeenCalled();
  });
});

/* ───────────────────────── salin cepat ───────────────────────── */
describe('EntryCard — salin cepat (kepala)', () => {
  it('tampil saat tertutup, tidak terkunci, bukan Sampah: tombol username dan password', () => {
    renderCard(mk());
    expect(screen.getByRole('button', { name: 'Salin username' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salin password' })).toBeInTheDocument();
  });

  it('hanya tombol yang datanya ada: tanpa user → hanya password; tanpa pass → hanya username', () => {
    const a = renderCard(mk({ user: undefined }));
    expect(screen.queryByRole('button', { name: 'Salin username' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salin password' })).toBeInTheDocument();
    a.unmount();
    renderCard(mk({ pass: undefined }));
    expect(screen.getByRole('button', { name: 'Salin username' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salin password' })).not.toBeInTheDocument();
  });

  it('tanpa user dan pass → tidak ada salin cepat sama sekali (juga tanpa wadah kosong)', () => {
    const { container } = renderCard(mk({ user: undefined, pass: undefined }));
    expect(screen.queryByRole('button', { name: /^Salin (username|password)$/ })).not.toBeInTheDocument();
    expect(container.querySelector('.entry-card__quick-copy')).toBeNull();
  });

  it.each([
    ['terbuka', { expandedIds: ['e1'] }, {}],
    ['terkunci', { lockedIds: ['e1'] }, {}],
    ['di Sampah', {}, { isRecycleBin: true }],
  ])('tersembunyi saat %s', (_n, over, props) => {
    renderCard(mk(), over, props);
    expect(screen.queryByRole('button', { name: 'Salin username' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salin password' })).not.toBeInTheDocument();
  });

  it('klik salin username → clipboard menerima user ASLI, lalu onCopy(user, "Username")', async () => {
    const { onCopy } = renderCard(mk({ user: 'budi.s' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salin username' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('budi.s');
    await act(async () => { await Promise.resolve(); });
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('budi.s', 'Username');
  });

  it('klik salin password → clipboard menerima password ASLI, lalu onCopy(pass, "Password")', async () => {
    const { onCopy } = renderCard(mk({ pass: 'P@ss-RAHASIA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salin password' }));
    expect(writeText).toHaveBeenCalledWith('P@ss-RAHASIA');
    await act(async () => { await Promise.resolve(); });
    expect(onCopy).toHaveBeenCalledWith('P@ss-RAHASIA', 'Password');
  });

  it('onCopy BARU dipanggil setelah clipboard selesai (tidak sebelum)', async () => {
    let selesai: () => void = () => {};
    stubClipboard(() => new Promise<void>((r) => { selesai = r; }));
    const { onCopy } = renderCard(mk());
    fireEvent.click(screen.getByRole('button', { name: 'Salin username' }));
    await act(async () => { await Promise.resolve(); });
    expect(onCopy).not.toHaveBeenCalled();
    await act(async () => { selesai(); await Promise.resolve(); });
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('klik salin cepat TIDAK mengembangkan kartu dan tidak meminta buka kunci', () => {
    const { onRequestUnlock } = renderCard(mk());
    fireEvent.click(screen.getByRole('button', { name: 'Salin username' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salin password' }));
    expect(expanded()).toEqual([]);
    expect(onRequestUnlock).not.toHaveBeenCalled();
  });

  it('umpan balik "tersalin" tepat 1500 ms: tampil di 1499 ms, hilang di 1500 ms (hanya tombol yang diklik)', async () => {
    vi.useFakeTimers();
    renderCard(mk());
    const u = screen.getByRole('button', { name: 'Salin username' });
    const p = screen.getByRole('button', { name: 'Salin password' });
    fireEvent.click(u);
    await act(async () => { await Promise.resolve(); });
    expect(u).toHaveClass('entry-card__qc-btn--copied');
    expect(p).not.toHaveClass('entry-card__qc-btn--copied');
    act(() => { vi.advanceTimersByTime(1499); });
    expect(u).toHaveClass('entry-card__qc-btn--copied');
    act(() => { vi.advanceTimersByTime(1); });
    expect(u).not.toHaveClass('entry-card__qc-btn--copied');
  });

  it('umpan balik tombol password dan tidak menyentuh tombol username', async () => {
    renderCard(mk());
    const u = screen.getByRole('button', { name: 'Salin username' });
    const p = screen.getByRole('button', { name: 'Salin password' });
    fireEvent.click(p);
    await waitFor(() => expect(p).toHaveClass('entry-card__qc-btn--copied'));
    expect(u).not.toHaveClass('entry-card__qc-btn--copied');
  });
});

/* ───── REGRESI (bug nyata): keyboard pada tombol salin cepat di dalam kepala role=button ───── */
describe('EntryCard — keyboard pada tombol salin cepat (regresi)', () => {
  it('Enter pada tombol salin cepat TIDAK mengembangkan kartu dan default-nya TIDAK dibatalkan (klik tetap terjadi)', () => {
    renderCard(mk());
    const aman = fireEvent.keyDown(screen.getByRole('button', { name: 'Salin password' }), { key: 'Enter' });
    expect(expanded()).toEqual([]);
    expect(aman).toBe(true);
  });

  it('Spasi pada tombol salin cepat TIDAK mengembangkan kartu dan default-nya TIDAK dibatalkan', () => {
    renderCard(mk());
    const aman = fireEvent.keyDown(screen.getByRole('button', { name: 'Salin username' }), { key: ' ' });
    expect(expanded()).toEqual([]);
    expect(aman).toBe(true);
  });

  it('keyboard pada kepala kartu sendiri tetap bekerja setelah perbaikan', () => {
    renderCard(mk());
    fireEvent.keyDown(header(), { key: 'Enter' });
    expect(expanded()).toEqual(['e1']);
  });
});

/* ───────────────────────── isi badan per kategori ───────────────────────── */
describe('EntryCard — isi badan per kategori', () => {
  it('umum: Username, Password, URL, Catatan (urut); field kosong dilewati', () => {
    const { container } = renderCard(mk({ url: 'https://x.example', note: 'catatan x' }), { expandedIds: ['e1'] });
    expect(fieldLabels(container)).toEqual(['Username', 'Password', 'URL', 'Catatan']);
    const b = renderCard(mk({ id: 'e2', url: undefined, note: undefined }), { expandedIds: ['e2'] });
    expect(fieldLabels(b.container)).toEqual(['Username', 'Password']);
  });

  it('crypto: 8 field berurutan termasuk Network, Alamat Wallet, Password Wallet, Seed Phrase', () => {
    const { container } = renderCard(
      mk({ cat: 'crypto', network: 'Solana', walletAddr: 'ADDR1', walletPw: 'wpw', seedPhrase: ['a', 'b'], url: 'https://c.example', note: 'n' }),
      { expandedIds: ['e1'] },
    );
    expect(fieldLabels(container)).toEqual(['Username', 'Password', 'Network', 'Alamat Wallet', 'Password Wallet', 'Seed Phrase', 'URL', 'Catatan']);
  });

  it('kartu: Nomor Kartu, Nama Pemegang, Masa Berlaku, CVV, PIN (dari pass), Catatan', () => {
    const { container } = renderCard(
      mk({ cat: 'kartu', cardNo: '4111', cardHolder: 'BUDI', cardExpiry: '12/30', cardCVV: '123', pass: '9999', note: 'n' }),
      { expandedIds: ['e1'] },
    );
    expect(fieldLabels(container)).toEqual(['Nomor Kartu', 'Nama Pemegang', 'Masa Berlaku', 'CVV', 'PIN', 'Catatan']);
  });

  it('wifi: SSID dan password memakai wifiSSID/wifiPass; tanpa itu jatuh ke user/pass', () => {
    const a = renderCard(mk({ cat: 'wifi', wifiSSID: 'JaringanA', wifiPass: 'sandiA', user: 'u-lain', pass: 'p-lain' }), { expandedIds: ['e1'] });
    expect(fieldLabels(a.container)).toEqual(['Nama Jaringan (SSID)', 'Password Wi-Fi']);
    expect(fieldValue(a.container, 'Nama Jaringan (SSID)')).toBe('JaringanA');
    expect(a.container.textContent).not.toContain('u-lain');
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(fieldValue(a.container, 'Password Wi-Fi')).toBe('sandiA');
    expect(a.container.textContent).not.toContain('p-lain');
    a.unmount();
    const b = renderCard(mk({ cat: 'wifi', wifiSSID: undefined, wifiPass: undefined, user: 'ssid-dari-user', pass: 'sandi-dari-pass' }), { expandedIds: ['e1'] });
    expect(fieldValue(b.container, 'Nama Jaringan (SSID)')).toBe('ssid-dari-user');
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(fieldValue(b.container, 'Password Wi-Fi')).toBe('sandi-dari-pass');
  });

  it('bank: label "Username / No. Rekening", Password, URL, Catatan', () => {
    const { container } = renderCard(mk({ cat: 'bank', url: 'https://b.example', note: 'n' }), { expandedIds: ['e1'] });
    expect(fieldLabels(container)).toEqual(['Username / No. Rekening', 'Password', 'URL', 'Catatan']);
  });

  it('email: dengan emailAddr → Alamat Email + Username terpisah; tanpa emailAddr → user menjadi Alamat Email dan tak ada Username', () => {
    const a = renderCard(mk({ cat: 'email', emailAddr: 'a@b.example', user: 'login-a' }), { expandedIds: ['e1'] });
    expect(fieldLabels(a.container)).toEqual(['Alamat Email', 'Username', 'Password']);
    expect(fieldValue(a.container, 'Alamat Email')).toBe('a@b.example');
    expect(fieldValue(a.container, 'Username')).toBe('login-a');
    a.unmount();
    const b = renderCard(mk({ cat: 'email', emailAddr: undefined, user: 'saya@mail.example' }), { expandedIds: ['e1'] });
    expect(fieldLabels(b.container)).toEqual(['Alamat Email', 'Password']);
    expect(fieldValue(b.container, 'Alamat Email')).toBe('saya@mail.example');
  });

  it('crypto: tiap field memuat nilainya sendiri (pemetaan label → data)', () => {
    const { container } = renderCard(
      mk({ cat: 'crypto', user: 'cuser', pass: 'cpass', network: 'Solana', walletAddr: 'ADDR1', walletPw: 'wpw', seedPhrase: ['a', 'b'], url: 'https://c.example', note: 'cnote' }),
      { expandedIds: ['e1'], pwVisible: { e1: true } },
    );
    expect(fieldValue(container, 'Username')).toBe('cuser');
    expect(fieldValue(container, 'Password')).toBe('cpass');
    expect(fieldValue(container, 'Network')).toBe('Solana');
    expect(fieldValue(container, 'Alamat Wallet')).toBe('ADDR1');
    expect(fieldValue(container, 'Password Wallet')).toBe('wpw');
    expect(fieldValue(container, 'URL')).toBe('https://c.example');
    expect(fieldValue(container, 'Catatan')).toBe('cnote');
  });

  it('kartu: tiap field memuat nilainya sendiri (PIN berasal dari pass)', () => {
    const { container } = renderCard(
      mk({ cat: 'kartu', cardNo: '4111', cardHolder: 'BUDI', cardExpiry: '12/30', cardCVV: '123', pass: '9999', note: 'cn' }),
      { expandedIds: ['e1'], pwVisible: { e1: true } },
    );
    expect(fieldValue(container, 'Nomor Kartu')).toBe('4111');
    expect(fieldValue(container, 'Nama Pemegang')).toBe('BUDI');
    expect(fieldValue(container, 'Masa Berlaku')).toBe('12/30');
    expect(fieldValue(container, 'CVV')).toBe('123');
    expect(fieldValue(container, 'PIN')).toBe('9999');
    expect(fieldValue(container, 'Catatan')).toBe('cn');
  });

  it('bank: tiap field memuat nilainya sendiri', () => {
    const { container } = renderCard(
      mk({ cat: 'bank', user: '1234567', pass: 'bpass', url: 'https://b.example', note: 'bn' }),
      { expandedIds: ['e1'], pwVisible: { e1: true } },
    );
    expect(fieldValue(container, 'Username / No. Rekening')).toBe('1234567');
    expect(fieldValue(container, 'Password')).toBe('bpass');
    expect(fieldValue(container, 'URL')).toBe('https://b.example');
    expect(fieldValue(container, 'Catatan')).toBe('bn');
  });

  it('kategori kustom / tak dikenal memakai tata letak umum', () => {
    const { container } = renderCard(mk({ cat: 'c1', url: 'https://k.example' }), { expandedIds: ['e1'] });
    expect(fieldLabels(container)).toEqual(['Username', 'Password', 'URL']);
  });

  it('nilai non-rahasia tampil apa adanya; Catatan dan URL tampil', () => {
    const { container } = renderCard(mk({ url: 'https://tampil.example', note: 'isi catatan' }), { expandedIds: ['e1'] });
    expect(fieldValue(container, 'Username')).toBe('pengguna1');
    expect(fieldValue(container, 'URL')).toBe('https://tampil.example');
    expect(fieldValue(container, 'Catatan')).toBe('isi catatan');
  });
});

/* ───────────────────────── rahasia: sembunyi/tampil ───────────────────────── */
describe('EntryCard — rahasia tersembunyi di DOM sampai ditampilkan', () => {
  const RAHASIA = {
    crypto: mk({ cat: 'crypto', pass: 'CPASS-9X', walletPw: 'WPW-7Q', seedPhrase: ['seedkata1', 'seedkata2', 'seedkata3'], walletAddr: 'ADDR-PUBLIK' }),
    kartu: mk({ cat: 'kartu', cardNo: '4111222233334444', cardCVV: '987', pass: '5566' }),
    umum: mk({ pass: 'PASS-UMUM-1' }),
  };

  it('umum: password hanya titik-titik; tombol Tampilkan membuka, Sembunyikan menutup lagi', () => {
    renderCard(RAHASIA.umum, { expandedIds: ['e1'] });
    expect(document.body.textContent).not.toContain('PASS-UMUM-1');
    expect(screen.getByText('••••••••')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(screen.getByText('PASS-UMUM-1')).toBeInTheDocument();
    expect(screen.queryByText('••••••••')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan' }));
    expect(document.body.textContent).not.toContain('PASS-UMUM-1');
  });

  it('toggle memakai store pwVisible[id] (kunci = id entri)', () => {
    renderCard(RAHASIA.umum, { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(useAppStore.getState().pwVisible).toEqual({ e1: true });
  });

  it('pwVisible milik entri LAIN tidak membuka rahasia kartu ini', () => {
    renderCard(RAHASIA.umum, { expandedIds: ['e1'], pwVisible: { lain: true } });
    expect(document.body.textContent).not.toContain('PASS-UMUM-1');
  });

  it('kartu: nomor kartu, CVV, dan PIN tak ada di DOM saat tersembunyi; muncul semua setelah Tampilkan', () => {
    renderCard(RAHASIA.kartu, { expandedIds: ['e1'] });
    for (const s of ['4111222233334444', '987', '5566']) expect(document.body.textContent).not.toContain(s);
    expect(screen.getAllByText('••••••••')).toHaveLength(3);
    fireEvent.click(screen.getAllByRole('button', { name: 'Tampilkan' })[0]);
    for (const s of ['4111222233334444', '987', '5566']) expect(screen.getByText(s)).toBeInTheDocument();
  });

  it('crypto: password, password wallet, dan seed tersembunyi; alamat wallet (publik) tampil', () => {
    renderCard(RAHASIA.crypto, { expandedIds: ['e1'] });
    expect(screen.getByText('ADDR-PUBLIK')).toBeInTheDocument();
    for (const s of ['CPASS-9X', 'WPW-7Q', 'seedkata1', 'seedkata2', 'seedkata3']) expect(document.body.textContent).not.toContain(s);
  });

  it('crypto: Tampilkan membuka password + password wallet', () => {
    renderCard(RAHASIA.crypto, { expandedIds: ['e1'] });
    fireEvent.click(screen.getAllByRole('button', { name: 'Tampilkan' })[0]);
    expect(screen.getByText('CPASS-9X')).toBeInTheDocument();
    expect(screen.getByText('WPW-7Q')).toBeInTheDocument();
  });
});

/* ───────────────────────── salin field di badan ───────────────────────── */
describe('EntryCard — salin field (badan)', () => {
  it('salin password memakai nilai ASLI (bukan titik-titik) walau tersembunyi; onCopy(nilai, label)', async () => {
    const { onCopy } = renderCard(mk({ pass: 'ASLI-123' }), { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Salin Password' }));
    expect(writeText).toHaveBeenCalledWith('ASLI-123');
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith('ASLI-123', 'Password'));
  });

  it('salin Username dan URL: nilai dan label sesuai', async () => {
    const { onCopy } = renderCard(mk({ url: 'https://u.example' }), { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Salin Username' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salin URL' }));
    await waitFor(() => expect(onCopy).toHaveBeenCalledTimes(2));
    expect(onCopy).toHaveBeenNthCalledWith(1, 'pengguna1', 'Username');
    expect(onCopy).toHaveBeenNthCalledWith(2, 'https://u.example', 'URL');
  });

  it('tiap field punya tombol salin berlabel "Salin <label>" (kartu: 6 field)', () => {
    renderCard(mk({ cat: 'kartu', cardNo: '1', cardHolder: 'H', cardExpiry: '1/1', cardCVV: '2', pass: '3', note: 'n' }), { expandedIds: ['e1'] });
    for (const l of ['Nomor Kartu', 'Nama Pemegang', 'Masa Berlaku', 'CVV', 'PIN', 'Catatan']) {
      expect(screen.getByRole('button', { name: `Salin ${l}` })).toBeInTheDocument();
    }
  });

  it('umpan balik tersalin tepat 1500 ms, hanya pada field yang disalin', async () => {
    vi.useFakeTimers();
    renderCard(mk(), { expandedIds: ['e1'] });
    const pw = screen.getByRole('button', { name: 'Salin Password' });
    const us = screen.getByRole('button', { name: 'Salin Username' });
    fireEvent.click(pw);
    await act(async () => { await Promise.resolve(); });
    expect(pw).toHaveClass('entry-field__btn--copied');
    expect(us).not.toHaveClass('entry-field__btn--copied');
    act(() => { vi.advanceTimersByTime(1499); });
    expect(pw).toHaveClass('entry-field__btn--copied');
    act(() => { vi.advanceTimersByTime(1); });
    expect(pw).not.toHaveClass('entry-field__btn--copied');
  });
});

/* ───────────────────────── seed phrase ───────────────────────── */
describe('EntryCard — seed phrase', () => {
  const seed = ['alfa', 'bravo', 'charlie', 'delta'];
  const cryptoSeed = () => mk({ cat: 'crypto', seedPhrase: seed, user: undefined, pass: undefined });

  it('tersembunyi: jumlah titik = min(kata*4, 32); kata tak ada di DOM; tombol "Tampilkan seed"', () => {
    renderCard(cryptoSeed(), { expandedIds: ['e1'] });
    expect(screen.getByText('•'.repeat(16))).toBeInTheDocument();
    for (const w of seed) expect(document.body.textContent).not.toContain(w);
    expect(screen.getByRole('button', { name: 'Tampilkan seed' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salin seed phrase' })).not.toBeInTheDocument();
  });

  it('titik dibatasi 32 untuk seed panjang (12 kata)', () => {
    const dua12 = Array.from({ length: 12 }, (_, i) => `kata${i}`);
    renderCard(mk({ cat: 'crypto', seedPhrase: dua12, user: undefined, pass: undefined }), { expandedIds: ['e1'] });
    expect(screen.getByText('•'.repeat(32))).toBeInTheDocument();
  });

  it('ditampilkan: tiap kata bernomor mulai 1 berurutan; toggle memakai seedVisible[id]', () => {
    const { container } = renderCard(cryptoSeed(), { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan seed' }));
    expect(useAppStore.getState().seedVisible).toEqual({ e1: true });
    const words = Array.from(container.querySelectorAll('.entry-seed-word')).map((n) => n.textContent);
    expect(words).toEqual(['1. alfa', '2. bravo', '3. charlie', '4. delta']);
    expect(screen.getByRole('button', { name: 'Sembunyikan seed' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan seed' }));
    for (const w of seed) expect(document.body.textContent).not.toContain(w);
  });

  it('salin seed (hanya saat tampil): clipboard menerima kata digabung spasi; onCopy label "Seed Phrase"', async () => {
    const { onCopy } = renderCard(cryptoSeed(), { expandedIds: ['e1'], seedVisible: { e1: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Salin seed phrase' }));
    expect(writeText).toHaveBeenCalledWith('alfa bravo charlie delta');
    await waitFor(() => expect(onCopy).toHaveBeenCalledWith('alfa bravo charlie delta', 'Seed Phrase'));
  });

  it('seed berisi satu kata kosong: tombol salin tidak menulis ke clipboard (tidak menyalin string kosong)', () => {
    const { onCopy } = renderCard(mk({ cat: 'crypto', seedPhrase: [''], user: undefined, pass: undefined }), { expandedIds: ['e1'], seedVisible: { e1: true } });
    fireEvent.click(screen.getByRole('button', { name: 'Salin seed phrase' }));
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('seedPhrase kosong atau tidak ada → field Seed Phrase tidak dirender', () => {
    const a = renderCard(mk({ cat: 'crypto', seedPhrase: [] }), { expandedIds: ['e1'] });
    expect(fieldLabels(a.container)).not.toContain('Seed Phrase');
    a.unmount();
    const b = renderCard(mk({ cat: 'crypto', seedPhrase: undefined }), { expandedIds: ['e1'] });
    expect(fieldLabels(b.container)).not.toContain('Seed Phrase');
  });
});

/* ───────────────────────── tombol aksi ───────────────────────── */
describe('EntryCard — tombol aksi di badan', () => {
  it('vault: Edit, Kunci, Favorit, Hapus (tanpa Pulihkan)', () => {
    renderCard(mk(), { expandedIds: ['e1'] });
    for (const n of ['Edit', 'Kunci', 'Favorit', 'Hapus']) expect(screen.getByRole('button', { name: n })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pulihkan' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hapus Permanen' })).not.toBeInTheDocument();
  });

  it('Sampah: Pulihkan dan Hapus Permanen saja (tanpa Edit/Kunci/Favorit)', () => {
    renderCard(mk(), { expandedIds: ['e1'] }, { isRecycleBin: true });
    expect(screen.getByRole('button', { name: 'Pulihkan' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus Permanen' })).toBeInTheDocument();
    for (const n of ['Edit', 'Kunci', 'Lepas', 'Favorit', 'Hapus']) {
      expect(screen.queryByRole('button', { name: n })).not.toBeInTheDocument();
    }
  });

  it('tombol Edit hanya ada bila onEdit diberikan; klik → onEdit(entry)', () => {
    const entry = mk();
    const a = renderCard(entry, { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(a.onEdit).toHaveBeenCalledTimes(1);
    expect(a.onEdit).toHaveBeenCalledWith(entry);
    a.unmount();
    renderCard(entry, { expandedIds: ['e1'] }, { onEdit: undefined });
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('entri terkunci: tombol berlabel "Lepas" (bukan "Kunci")', () => {
    renderCard(mk(), { expandedIds: ['e1'], lockedIds: ['e1'] });
    expect(screen.getByRole('button', { name: 'Lepas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kunci' })).not.toBeInTheDocument();
  });
});

/* ───────────────────────── dialog konfirmasi ───────────────────────── */
describe('EntryCard — dialog konfirmasi', () => {
  const dlg = () => screen.getByRole('alertdialog');
  const batal = () => within(dlg()).getByText('Batal');

  it.each([
    ['Hapus', mk({ name: 'Akun Uji' }), {}, {}, 'Pindahkan ke Sampah?', 'Pindahkan', 'danger', 'akan dipindahkan ke sampah. Bisa dipulihkan nanti.'],
    ['Hapus Permanen', mk(), {}, { isRecycleBin: true }, 'Hapus Permanen?', 'Hapus Permanen', 'danger', 'akan dihapus selamanya dan tidak bisa dipulihkan.'],
    ['Kunci', mk(), {}, {}, 'Kunci Entri?', 'Kunci', 'lock', 'akan dikunci. Butuh PIN/password untuk membukanya.'],
    ['Lepas', mk(), { lockedIds: ['e1'] }, {}, 'Lepas Kunci Entri?', 'Lepas Kunci', 'warning', 'tidak akan memerlukan PIN lagi untuk dibuka.'],
    ['Favorit', mk(), {}, {}, 'Tandai Favorit?', 'Tandai Favorit', 'warning', 'akan ditambahkan ke daftar favorit.'],
    ['Favorit', mk({ fav: true }), {}, {}, 'Hapus dari Favorit?', 'Hapus Favorit', 'warning', 'akan dihapus dari daftar favorit.'],
    ['Pulihkan', mk(), {}, { isRecycleBin: true }, 'Pulihkan Entri?', 'Pulihkan', 'warning', 'akan dipindahkan kembali ke vault.'],
  ])('tombol "%s" membuka dialog: judul "%s" · konfirmasi "%s" · varian %s', (tombol, entry, over, props, judul, label, varian, pesan) => {
    renderCard(entry, { expandedIds: ['e1'], ...over }, props);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${tombol}$`) }));
    expect(screen.getByRole('alertdialog', { name: judul })).toBeInTheDocument();
    expect(within(dlg()).getByRole('button', { name: label })).toBeInTheDocument();
    expect(within(dlg()).getByText('Akun Uji')).toBeInTheDocument(); // nama entri tebal di pesan
    expect(dlg().textContent).toContain(pesan);
    expect(dlg().querySelector(`.confirm-card--${varian}`)).not.toBeNull();
  });

  it('tanpa membuka tombol aksi, tidak ada dialog', () => {
    renderCard(mk(), { expandedIds: ['e1'] });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('Batal menutup dialog dan TIDAK mengubah store maupun menyimpan', () => {
    renderCard(mk(), { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Hapus' }));
    fireEvent.click(batal());
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(useAppStore.getState().vault).toHaveLength(1);
    expect(useAppStore.getState().recycleBin).toHaveLength(0);
    expect(saveVault).not.toHaveBeenCalled();
  });

  it('konfirmasi menutup dialog', async () => {
    renderCard(mk(), { expandedIds: ['e1'] });
    fireEvent.click(screen.getByRole('button', { name: 'Favorit' }));
    fireEvent.click(within(dlg()).getByRole('button', { name: 'Tandai Favorit' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(saveVault).toHaveBeenCalled());
  });
});

/* ───────────────────────── efek aksi + penyimpanan ───────────────────────── */
describe('EntryCard — efek aksi pada store dan penyimpanan', () => {
  const konfirmasi = (tombol: string, label: string) => {
    fireEvent.click(screen.getByRole('button', { name: tombol }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: label }));
  };
  const lain = mk({ id: 'e2', name: 'Lain', fav: false });

  it('favorit: hanya entri ini yang fav-nya dibalik; disimpan dengan 9 argumen yang benar', async () => {
    const e = mk();
    renderCard(e, { expandedIds: ['e1'], vault: [e, lain], recycleBin: [mk({ id: 'b1' })], lockedIds: ['x'] });
    konfirmasi('Favorit', 'Tandai Favorit');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const v = useAppStore.getState().vault;
    expect(v.find((x) => x.id === 'e1')?.fav).toBe(true);
    expect(v.find((x) => x.id === 'e2')?.fav).toBe(false);
    expect(saveVault).toHaveBeenCalledWith('pw-master', v, [expect.objectContaining({ id: 'b1' })], meta, CATS, ['x'], ['lc'], { email: [] }, NETS);
  });

  it('favorit dibalik lagi (fav=true → false)', async () => {
    const e = mk({ fav: true });
    renderCard(e, { expandedIds: ['e1'], vault: [e] });
    konfirmasi('Favorit', 'Hapus Favorit');
    await waitFor(() => expect(useAppStore.getState().vault[0].fav).toBe(false));
  });

  it('autoSave mati: store berubah tetapi TIDAK menyimpan (favorit, hapus, pulihkan, hapus permanen)', async () => {
    const e = mk();
    const a = renderCard(e, { expandedIds: ['e1'], autoSaveEnabled: false });
    konfirmasi('Favorit', 'Tandai Favorit');
    await waitFor(() => expect(useAppStore.getState().vault[0].fav).toBe(true));
    konfirmasi('Hapus', 'Pindahkan');
    await waitFor(() => expect(useAppStore.getState().recycleBin).toHaveLength(1));
    a.unmount();
    const b = renderCard(e, { expandedIds: ['e1'], autoSaveEnabled: false, vault: [], recycleBin: [e] }, { isRecycleBin: true });
    konfirmasi('Pulihkan', 'Pulihkan');
    await waitFor(() => expect(useAppStore.getState().vault).toHaveLength(1));
    b.unmount();
    renderCard(e, { expandedIds: ['e1'], autoSaveEnabled: false, vault: [], recycleBin: [e] }, { isRecycleBin: true });
    konfirmasi('Hapus Permanen', 'Hapus Permanen');
    await waitFor(() => expect(useAppStore.getState().recycleBin).toHaveLength(0));
    expect(saveVault).not.toHaveBeenCalled();
  });

  it('hapus (vault) → keluar dari vault, masuk Sampah dengan ts = waktu sekarang; entri lain utuh; disimpan', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(1_700_000_000_000));
    const e = mk({ name: 'Dihapus', ts: 5 });
    renderCard(e, { expandedIds: ['e1'], vault: [e, lain], recycleBin: [mk({ id: 'b0' })] });
    konfirmasi('Hapus', 'Pindahkan');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const st = useAppStore.getState();
    expect(st.vault.map((x) => x.id)).toEqual(['e2']);
    expect(st.recycleBin.map((x) => x.id)).toEqual(['b0', 'e1']);
    expect(st.recycleBin[1]).toEqual({ ...e, ts: 1_700_000_000_000 });
    expect(saveVault).toHaveBeenCalledWith('pw-master', st.vault, st.recycleBin, meta, CATS, [], ['lc'], { email: [] }, NETS);
  });

  it('hapus permanen (Sampah) → hanya keluar dari Sampah; vault tidak berubah; disimpan', async () => {
    const e = mk();
    const v = [lain];
    renderCard(e, { expandedIds: ['e1'], vault: v, recycleBin: [e, mk({ id: 'b2' })] }, { isRecycleBin: true });
    konfirmasi('Hapus Permanen', 'Hapus Permanen');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const st = useAppStore.getState();
    expect(st.recycleBin.map((x) => x.id)).toEqual(['b2']);
    expect(st.vault).toBe(v);
    expect(saveVault).toHaveBeenCalledWith('pw-master', v, st.recycleBin, meta, CATS, [], ['lc'], { email: [] }, NETS);
  });

  it('pulihkan → keluar dari Sampah, ditambahkan di AKHIR vault dengan isi sama; disimpan', async () => {
    const e = mk({ name: 'Dipulihkan', ts: 99 });
    renderCard(e, { expandedIds: ['e1'], vault: [lain], recycleBin: [e, mk({ id: 'b2' })] }, { isRecycleBin: true });
    konfirmasi('Pulihkan', 'Pulihkan');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const st = useAppStore.getState();
    expect(st.vault.map((x) => x.id)).toEqual(['e2', 'e1']);
    expect(st.vault[1]).toEqual(e);
    expect(st.recycleBin.map((x) => x.id)).toEqual(['b2']);
    expect(saveVault).toHaveBeenCalledWith('pw-master', st.vault, st.recycleBin, meta, CATS, [], ['lc'], { email: [] }, NETS);
  });

  it('kunci: id masuk lockedIds (entri lain tetap), kartu yang terbuka MENUTUP, disimpan dengan lockedIds baru', async () => {
    const e = mk();
    renderCard(e, { expandedIds: ['e1', 'e9'], vault: [e], lockedIds: ['x'] });
    konfirmasi('Kunci', 'Kunci');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const st = useAppStore.getState();
    expect(st.lockedIds).toEqual(['x', 'e1']);
    expect(st.expandedIds).toEqual(['e9']);
    expect(saveVault).toHaveBeenCalledWith('pw-master', st.vault, st.recycleBin, meta, CATS, ['x', 'e1'], ['lc'], { email: [] }, NETS);
  });

  it('lepas kunci: id keluar dari lockedIds (lainnya tetap); kartu tidak ditutup; disimpan', async () => {
    const e = mk();
    renderCard(e, { expandedIds: ['e1'], vault: [e], lockedIds: ['x', 'e1'] });
    konfirmasi('Lepas', 'Lepas Kunci');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    const st = useAppStore.getState();
    expect(st.lockedIds).toEqual(['x']);
    expect(st.expandedIds).toEqual(['e1']);
    expect(saveVault).toHaveBeenCalledWith('pw-master', st.vault, st.recycleBin, meta, CATS, ['x'], ['lc'], { email: [] }, NETS);
  });

  it('kunci: bila simpan GAGAL, lockedIds dikembalikan ke nilai semula (rollback)', async () => {
    saveVault.mockRejectedValue(new Error('kuota penuh'));
    const e = mk();
    renderCard(e, { expandedIds: ['e1'], vault: [e], lockedIds: ['x'] });
    konfirmasi('Kunci', 'Kunci');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAppStore.getState().lockedIds).toEqual(['x']));
  });

  it('lepas kunci: bila simpan GAGAL, entri kembali terkunci (rollback)', async () => {
    saveVault.mockRejectedValue(new Error('kuota penuh'));
    const e = mk();
    renderCard(e, { expandedIds: ['e1'], vault: [e], lockedIds: ['e1'] });
    konfirmasi('Lepas', 'Lepas Kunci');
    await waitFor(() => expect(saveVault).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(useAppStore.getState().lockedIds).toEqual(['e1']));
  });
});
