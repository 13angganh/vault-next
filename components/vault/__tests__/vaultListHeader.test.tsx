/**
 * components/vault/__tests__/vaultListHeader.test.tsx — Aurum Vault v2.0.0 (Tahap 4B)
 *
 * Maksud: menjaga header daftar entri (VaultListView) yang seragam di semua filter:
 *  - judul + jumlah entri (ikut filter, pencarian, dan Sampah);
 *  - tombol pemilih kategori → OptionSheet vertikal (TANPA deretan geser), nilai + ikon sesuai pilihan;
 *  - pemilih urutan (7 pilihan; urutan DOM benar untuk tiap pilihan);
 *  - chip cepat Favorit/Terkunci/Tanpa Pass (aktif/nonaktif, hanya satu aktif, tanpa chip "Semua");
 *  - empty state di luar yang sudah dijaga vaultListFilters.test.tsx; skeleton; tombol "Kosongkan".
 *
 * Tidak menduplikasi: handleEmptyBin (VaultListView.test.tsx) dan filter Terkunci / empty state
 * chip cepat (vaultListFilters.test.tsx). Tidak menguji modal Buka Entri (di luar lingkup 4B).
 *
 * Konvensi: elemen dicari lewat role/label/teks UTUH. Pengecualian terdokumentasi: ikon header
 * (aria-hidden, tak punya nama a11y) dibandingkan lewat markup DOM ikon yang dirender terpisah.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4B): file dibuat. Dua test REGRESI (bagian "chip tersembunyi tidak menyaring")
 *    direproduksi dulu sebagai GAGAL sebelum VaultListView.tsx diperbaiki: chip cepat yang sudah
 *    tidak tampil (di Sampah / saat mencari) tetap menyaring daftar secara diam-diam.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { createRef } from 'react';
import { Star, LayoutGrid } from 'lucide-react';
import { VaultListView, type VaultListViewRef } from '../VaultListView';
import { CategoryIcon } from '@/components/entries/CategoryIcon';
import { useAppStore } from '@/lib/store/appStore';
import type { CustomCategory, VaultEntry, VaultMeta } from '@/lib/types';

const meta: VaultMeta = { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' };
const mk = (id: string, name: string, extra: Partial<VaultEntry> = {}): VaultEntry =>
  ({ id, cat: 'lainnya', name, ts: 1, pass: 'x', ...extra } as VaultEntry);
const custom = (id: string, label: string): CustomCategory =>
  ({ id, label, emoji: 'Briefcase', iconKey: 'Briefcase' });

type StoreState = ReturnType<typeof useAppStore.getState>;
function setup(over: Partial<StoreState> = {}) {
  useAppStore.setState({
    vault: [], recycleBin: [], customCats: [], lockedIds: [], masterPw: 'pw', vaultMeta: meta,
    autoSaveEnabled: false, currentFilter: 'all', sortBy: 'default', searchQuery: '', ...over,
  });
}

/** Nama yang tampil, urut sesuai posisi di DOM (pencocokan teks UTUH per elemen). */
function domOrder(names: string[]): string[] {
  return names
    .map((n) => ({ n, el: screen.queryByText(n) }))
    .filter((x): x is { n: string; el: HTMLElement } => x.el !== null)
    .sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((x) => x.n);
}
const pickBtn = () => screen.getByRole('button', { name: /^Kategori/ });
const sortBtn = () => screen.getByRole('button', { name: 'Urutkan entri' });
const chipGroup = () => screen.getByRole('group', { name: 'Filter cepat' });
const chip = (name: string) => within(chipGroup()).getByRole('button', { name });
const optionOf = (dialog: HTMLElement, label: string) => {
  const el = within(dialog).getByText(label).closest('[role="option"]');
  if (!(el instanceof HTMLElement)) throw new Error(`opsi "${label}" tidak ditemukan`);
  return el;
};
const optionLabels = (dialog: HTMLElement) =>
  within(dialog).getAllByRole('option').map((o) => within(o).getAllByText(/./)[0].textContent);

/** Markup ikon yang dirender terpisah (dipakai membandingkan ikon header yang aria-hidden). */
function iconMarkup(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const html = container.innerHTML;
  unmount();
  return html;
}
const headerIcon = () => {
  const slot = pickBtn().firstElementChild; // pembungkus ikon = anak pertama tombol
  return slot ? slot.innerHTML : '';
};

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

/* ───────────────────────── judul + jumlah ───────────────────────── */
describe('VaultListView header — judul dan jumlah entri', () => {
  const vault = [mk('a', 'Alpha', { fav: true }), mk('b', 'Bravo', { cat: 'email' }), mk('c', 'Charlie', { cat: 'email' })];

  it('semua: judul "Semua Entri" + jumlah seluruh vault', () => {
    setup({ vault });
    render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'Semua Entri' })).toBeInTheDocument();
    expect(screen.getByText('3 entri')).toBeInTheDocument();
  });

  it('favorit: judul "Favorit" + jumlah hanya favorit', () => {
    setup({ vault, currentFilter: 'fav' });
    render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'Favorit' })).toBeInTheDocument();
    expect(screen.getByText('1 entri')).toBeInTheDocument();
  });

  it('kategori bawaan dan kategori kustom: judul = label kategori, jumlah = entri kategori itu', () => {
    setup({ vault: [...vault, mk('d', 'Delta', { cat: 'kerja' })], customCats: [custom('kerja', 'Kerja')], currentFilter: 'email' });
    const { unmount } = render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'Email' })).toBeInTheDocument();
    expect(screen.getByText('2 entri')).toBeInTheDocument();
    unmount();
    act(() => { useAppStore.setState({ currentFilter: 'kerja' }); });
    render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'Kerja' })).toBeInTheDocument();
    expect(screen.getByText('1 entri')).toBeInTheDocument();
  });

  it('id kategori yang sudah tidak ada (mis. kategori kustom terhapus): judul jatuh ke id, tidak crash', () => {
    setup({ vault, currentFilter: 'sudah-dihapus' });
    render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'sudah-dihapus' })).toBeInTheDocument();
    expect(within(pickBtn()).getByText('sudah-dihapus')).toBeInTheDocument(); // nilai tombol juga jatuh ke id
    expect(screen.getByText('0 entri')).toBeInTheDocument();
  });

  it('Sampah: judul "Sampah" + jumlah isi sampah (bukan vault)', () => {
    setup({ vault, recycleBin: [mk('t', 'Terhapus')], currentFilter: 'bin' });
    render(<VaultListView />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sampah' })).toBeInTheDocument();
    expect(screen.getByText('1 entri')).toBeInTheDocument();
  });

  it('pencarian: subtitle "N hasil untuk \\"kata\\"" memakai jumlah hasil, bukan jumlah vault', () => {
    setup({ vault, searchQuery: 'al' });
    render(<VaultListView />);
    expect(screen.getByText('1 hasil untuk "al"')).toBeInTheDocument();
  });

  it('jumlah ikut berubah saat vault berubah (langganan store, bukan nilai beku)', () => {
    setup({ vault });
    render(<VaultListView />);
    expect(screen.getByText('3 entri')).toBeInTheDocument();
    act(() => { useAppStore.setState({ vault: [...vault, mk('z', 'Zulu')] }); });
    expect(screen.getByText('4 entri')).toBeInTheDocument();
  });
});

/* ───────────────────────── pemilih kategori ───────────────────────── */
describe('VaultListView header — pemilih kategori (OptionSheet, bukan deretan geser)', () => {
  const vault = [
    mk('a', 'Alpha', { cat: 'sosmed' }), mk('b', 'Bravo', { cat: 'sosmed' }),
    mk('c', 'Charlie', { cat: 'email' }), mk('d', 'Delta', { cat: 'kerja' }),
  ];
  beforeEach(() => setup({ vault, customCats: [custom('kerja', 'Kerja')] }));

  it('tombol menampilkan label "Kategori" + nilai terpilih, dan menandai dialog (aria-haspopup)', () => {
    render(<VaultListView />);
    const b = pickBtn();
    expect(within(b).getByText('Kategori')).toBeInTheDocument();
    expect(within(b).getByText('Semua kategori')).toBeInTheDocument();
    expect(b).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('membuka sheet vertikal "Pilih kategori": semua kategori + bawaan + kustom berurutan, tiap opsi bertanda jumlah entri', () => {
    render(<VaultListView />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(pickBtn());
    const dialog = screen.getByRole('dialog', { name: 'Pilih kategori' });
    expect(optionLabels(dialog)).toEqual([
      'Semua kategori', 'Sosmed', 'Email', 'Bank', 'Game', 'Crypto', 'Kartu', 'Wi-Fi', 'Lainnya', 'Catatan', 'Kerja',
    ]);
    const expected: Array<[string, string]> = [
      ['Semua kategori', '4'], ['Sosmed', '2'], ['Email', '1'], ['Bank', '0'], ['Kerja', '1'], ['Catatan', '0'],
    ];
    for (const [label, n] of expected) expect(within(optionOf(dialog, label)).getByText(n)).toBeInTheDocument();
  });

  it('opsi terpilih ditandai aria-selected: awalnya "Semua kategori" saja', () => {
    render(<VaultListView />);
    fireEvent.click(pickBtn());
    const dialog = screen.getByRole('dialog', { name: 'Pilih kategori' });
    const selected = within(dialog).getAllByRole('option').filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(within(selected[0]).getByText('Semua kategori')).toBeInTheDocument();
  });

  it('memilih kategori: filter store berubah, sheet menutup, judul + nilai tombol + jumlah mengikuti; dibuka lagi → opsi itu terpilih', () => {
    render(<VaultListView />);
    fireEvent.click(pickBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Pilih kategori' }), 'Sosmed'));
    expect(useAppStore.getState().currentFilter).toBe('sosmed');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Sosmed' })).toBeInTheDocument();
    expect(within(pickBtn()).getByText('Sosmed')).toBeInTheDocument();
    expect(screen.getByText('2 entri')).toBeInTheDocument();
    expect(domOrder(['Alpha', 'Bravo', 'Charlie', 'Delta'])).toEqual(['Alpha', 'Bravo']);

    fireEvent.click(pickBtn());
    const dialog = screen.getByRole('dialog', { name: 'Pilih kategori' });
    expect(optionOf(dialog, 'Sosmed')).toHaveAttribute('aria-selected', 'true');
    expect(optionOf(dialog, 'Semua kategori')).toHaveAttribute('aria-selected', 'false');
    // jumlah "Semua kategori" = seluruh vault (4), bukan jumlah yang sedang tampil (2)
    expect(within(optionOf(dialog, 'Semua kategori')).getByText('4')).toBeInTheDocument();
  });

  it('kategori kustom bisa dipilih; "Semua kategori" mengembalikan ke semua', () => {
    render(<VaultListView />);
    fireEvent.click(pickBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Pilih kategori' }), 'Kerja'));
    expect(useAppStore.getState().currentFilter).toBe('kerja');
    expect(domOrder(['Alpha', 'Bravo', 'Charlie', 'Delta'])).toEqual(['Delta']);
    fireEvent.click(pickBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Pilih kategori' }), 'Semua kategori'));
    expect(useAppStore.getState().currentFilter).toBe('all');
    expect(domOrder(['Alpha', 'Bravo', 'Charlie', 'Delta'])).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
  });

  it('filter Favorit (dari navigasi bawah): tombol menampilkan "Favorit"; sheet menandai "Semua kategori" dan TIDAK punya opsi Favorit', () => {
    act(() => { useAppStore.setState({ currentFilter: 'fav', vault: [...vault.slice(0, 3), mk('f', 'Favo', { fav: true })] }); });
    render(<VaultListView />);
    expect(within(pickBtn()).getByText('Favorit')).toBeInTheDocument();
    fireEvent.click(pickBtn());
    const dialog = screen.getByRole('dialog', { name: 'Pilih kategori' });
    expect(within(dialog).queryByText('Favorit')).not.toBeInTheDocument();
    expect(optionOf(dialog, 'Semua kategori')).toHaveAttribute('aria-selected', 'true');
  });

  it('ikon di tombol sesuai pilihan: Semua = grid, Favorit = bintang, kategori = ikon kategori itu (3 ikon berbeda)', () => {
    const { unmount } = render(<VaultListView />);
    const allIcon = headerIcon();
    expect(allIcon).toBe(iconMarkup(<LayoutGrid size={18} />));
    unmount();

    act(() => { useAppStore.setState({ currentFilter: 'fav' }); });
    const r2 = render(<VaultListView />);
    const favIcon = headerIcon();
    expect(favIcon).toBe(iconMarkup(<Star size={18} />));
    r2.unmount();

    act(() => { useAppStore.setState({ currentFilter: 'email' }); });
    const r3 = render(<VaultListView />);
    const catIcon = headerIcon();
    expect(catIcon).toBe(iconMarkup(<CategoryIcon catId="email" customCats={[]} size="sm" />));
    r3.unmount();

    expect(new Set([allIcon, favIcon, catIcon]).size).toBe(3);
  });

  it('Escape dan tombol Tutup menutup sheet tanpa mengubah filter', () => {
    render(<VaultListView />);
    fireEvent.click(pickBtn());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(pickBtn());
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Pilih kategori' })).getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useAppStore.getState().currentFilter).toBe('all');
  });

  it('memilih kategori saat sedang mencari mengosongkan pencarian (subtitle kembali ke jumlah biasa)', () => {
    act(() => { useAppStore.setState({ searchQuery: 'zzz' }); });
    render(<VaultListView />);
    expect(screen.getByText('0 hasil untuk "zzz"')).toBeInTheDocument();
    fireEvent.click(pickBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Pilih kategori' }), 'Email'));
    expect(screen.getByText('1 entri')).toBeInTheDocument();
    expect(screen.queryByText(/hasil untuk/)).not.toBeInTheDocument();
  });

  it('di Sampah: tidak ada pemilih kategori, pemilih urutan, maupun chip cepat', () => {
    act(() => { useAppStore.setState({ currentFilter: 'bin', recycleBin: [mk('t', 'Terhapus')] }); });
    render(<VaultListView />);
    expect(screen.queryByRole('button', { name: /^Kategori/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Urutkan entri' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter cepat' })).not.toBeInTheDocument();
  });
});

/* ───────────────────────── pemilih urutan ───────────────────────── */
describe('VaultListView header — pemilih urutan', () => {
  const vault = [
    mk('1', 'Charlie', { cat: 'bank',   ts: 30 }),
    mk('2', 'alpha',   { cat: 'sosmed', ts: 10, fav: true }),
    mk('3', 'Bravo',   { cat: 'bank',   ts: 20 }),
    mk('4', 'delta',   { cat: 'sosmed', ts: 40, fav: true }),
  ];
  const NAMES = ['Charlie', 'alpha', 'Bravo', 'delta'];
  beforeEach(() => setup({ vault }));

  it('tombol menampilkan urutan aktif; sheet "Urutkan entri" berisi 7 pilihan berurutan; yang aktif ditandai', () => {
    render(<VaultListView />);
    expect(within(sortBtn()).getByText('Default')).toBeInTheDocument();
    fireEvent.click(sortBtn());
    const dialog = screen.getByRole('dialog', { name: 'Urutkan entri' });
    expect(optionLabels(dialog)).toEqual(['Default', 'Favorit dulu', 'Nama A–Z', 'Nama Z–A', 'Terbaru', 'Terlama', 'Per kategori']);
    expect(optionOf(dialog, 'Default')).toHaveAttribute('aria-selected', 'true');
  });

  it('memilih urutan: store berubah, sheet menutup, label tombol mengikuti', () => {
    render(<VaultListView />);
    fireEvent.click(sortBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Urutkan entri' }), 'Nama A–Z'));
    expect(useAppStore.getState().sortBy).toBe('name_asc');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(sortBtn()).getByText('Nama A–Z')).toBeInTheDocument();
  });

  it.each<[string, string, string[]]>([
    ['default',   'Default',      ['Charlie', 'alpha', 'Bravo', 'delta']],
    ['name_asc',  'Nama A–Z',     ['alpha', 'Bravo', 'Charlie', 'delta']],
    ['name_desc', 'Nama Z–A',     ['delta', 'Charlie', 'Bravo', 'alpha']],
    ['newest',    'Terbaru',      ['delta', 'Charlie', 'Bravo', 'alpha']],
    ['oldest',    'Terlama',      ['alpha', 'Bravo', 'Charlie', 'delta']],
    ['fav_first', 'Favorit dulu', ['alpha', 'delta', 'Charlie', 'Bravo']],
  ])('urutan %s (%s) menata daftar di DOM sesuai', (sortBy, label, expected) => {
    render(<VaultListView />);
    fireEvent.click(sortBtn());
    fireEvent.click(optionOf(screen.getByRole('dialog', { name: 'Urutkan entri' }), label));
    expect(useAppStore.getState().sortBy).toBe(sortBy);
    expect(domOrder(NAMES)).toEqual(expected);
  });

  it('nama A–Z mengabaikan huruf besar/kecil (alpha sebelum Bravo), bukan urutan kode karakter', () => {
    act(() => { useAppStore.setState({ sortBy: 'name_asc' }); });
    render(<VaultListView />);
    expect(domOrder(NAMES).slice(0, 2)).toEqual(['alpha', 'Bravo']);
  });

  it('Per kategori: sub-judul kategori sekali per grup, entri urut nama di dalam grup, grup urut kategori', () => {
    act(() => { useAppStore.setState({ sortBy: 'cat_group' }); });
    render(<VaultListView />);
    expect(screen.getAllByText('Bank')).toHaveLength(1);
    expect(screen.getAllByText('Sosmed')).toHaveLength(1);
    expect(domOrder(['Bank', 'Bravo', 'Charlie', 'Sosmed', 'alpha', 'delta']))
      .toEqual(['Bank', 'Bravo', 'Charlie', 'Sosmed', 'alpha', 'delta']);
  });

  it('urutan selain Per kategori tidak menampilkan sub-judul kategori', () => {
    act(() => { useAppStore.setState({ sortBy: 'name_asc' }); });
    render(<VaultListView />);
    expect(screen.queryByText('Bank')).not.toBeInTheDocument();
    expect(screen.queryByText('Sosmed')).not.toBeInTheDocument();
  });
});

/* ───────────────────────── chip cepat ───────────────────────── */
describe('VaultListView header — chip cepat', () => {
  const vault = [
    mk('a', 'Alpha',  { fav: true, cat: 'bank' }),
    mk('b', 'Bravo',  { cat: 'bank' }),
    mk('c', 'Charlie', { fav: true }),
  ];
  const NAMES = ['Alpha', 'Bravo', 'Charlie'];

  it('tepat tiga chip: Favorit, Terkunci, Tanpa Pass (urut), semua nonaktif di awal; tidak ada chip "Semua"', () => {
    setup({ vault });
    render(<VaultListView />);
    const chips = within(chipGroup()).getAllByRole('button');
    expect(chips.map((c) => c.textContent)).toEqual(['Favorit', 'Terkunci', 'Tanpa Pass']);
    for (const c of chips) expect(c).toHaveAttribute('aria-pressed', 'false');
    expect(within(chipGroup()).queryByRole('button', { name: /Semua/ })).not.toBeInTheDocument();
  });

  it('Favorit: ketuk → aktif + hanya favorit + jumlah ikut; ketuk lagi → nonaktif + semua kembali', () => {
    setup({ vault });
    render(<VaultListView />);
    fireEvent.click(chip('Favorit'));
    expect(chip('Favorit')).toHaveAttribute('aria-pressed', 'true');
    expect(domOrder(NAMES)).toEqual(['Alpha', 'Charlie']);
    expect(screen.getByText('2 entri')).toBeInTheDocument();
    fireEvent.click(chip('Favorit'));
    expect(chip('Favorit')).toHaveAttribute('aria-pressed', 'false');
    expect(domOrder(NAMES)).toEqual(NAMES);
    expect(screen.getByText('3 entri')).toBeInTheDocument();
  });

  it('hanya satu chip aktif: mengetuk chip lain memindahkan keaktifan', () => {
    setup({ vault, lockedIds: ['b'] });
    render(<VaultListView />);
    fireEvent.click(chip('Favorit'));
    fireEvent.click(chip('Terkunci'));
    expect(chip('Favorit')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('Terkunci')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Tanpa Pass')).toHaveAttribute('aria-pressed', 'false');
    expect(domOrder(NAMES)).toEqual(['Bravo']);
  });

  it('Tanpa Pass: hanya entri tanpa password, tanpa password Wi-Fi, dan tanpa nomor kartu', () => {
    setup({
      vault: [
        mk('1', 'Punya Pass', { pass: 'rahasia' }),
        mk('2', 'Punya Wifi', { pass: '', wifiPass: 'wifi123' }),
        mk('3', 'Punya Kartu', { pass: '', cardNo: '4111' }),
        mk('4', 'Kosong Satu', { pass: '' }),
        mk('5', 'Kosong Dua', { pass: undefined }),
      ],
    });
    render(<VaultListView />);
    fireEvent.click(chip('Tanpa Pass'));
    expect(domOrder(['Punya Pass', 'Punya Wifi', 'Punya Kartu', 'Kosong Satu', 'Kosong Dua'])).toEqual(['Kosong Satu', 'Kosong Dua']);
  });

  it('chip digabung dengan filter kategori (irisan keduanya)', () => {
    setup({ vault, currentFilter: 'bank' });
    render(<VaultListView />);
    expect(domOrder(NAMES)).toEqual(['Alpha', 'Bravo']);
    fireEvent.click(chip('Favorit'));
    expect(domOrder(NAMES)).toEqual(['Alpha']);
  });

  it('chip disembunyikan saat mencari dan muncul lagi setelah pencarian dikosongkan', () => {
    setup({ vault, searchQuery: 'al' });
    render(<VaultListView />);
    expect(screen.queryByRole('group', { name: 'Filter cepat' })).not.toBeInTheDocument();
    act(() => { useAppStore.setState({ searchQuery: '' }); });
    expect(chipGroup()).toBeInTheDocument();
  });

  /* REGRESI (Tahap 4B): chip yang tidak tampil tidak boleh menyaring daftar secara diam-diam. */
  it('REGRESI: chip aktif lalu pindah ke Sampah → isi sampah tetap tampil lengkap (bukan "Sampah kosong")', () => {
    setup({ vault, recycleBin: [mk('t1', 'Terhapus Satu'), mk('t2', 'Terhapus Dua')] });
    render(<VaultListView />);
    fireEvent.click(chip('Favorit'));
    act(() => { useAppStore.getState().setFilter('bin'); });
    expect(screen.getByText('2 entri')).toBeInTheDocument();
    expect(domOrder(['Terhapus Satu', 'Terhapus Dua'])).toEqual(['Terhapus Satu', 'Terhapus Dua']);
    expect(screen.queryByText('Sampah kosong')).not.toBeInTheDocument();
  });

  it('REGRESI: chip aktif lalu mencari → hasil pencarian tidak disaring chip yang tersembunyi; setelah pencarian dikosongkan, chip dan daftar konsisten', () => {
    setup({ vault: [mk('a', 'Alpha', { fav: true }), mk('b', 'Alpine')] });
    render(<VaultListView />);
    fireEvent.click(chip('Favorit'));
    act(() => { useAppStore.getState().setSearchQuery('alp'); });
    expect(screen.getByText('2 hasil untuk "alp"')).toBeInTheDocument();
    expect(domOrder(['Alpha', 'Alpine'])).toEqual(['Alpha', 'Alpine']);

    act(() => { useAppStore.getState().setSearchQuery(''); });
    // Invarian: yang ditampilkan chip (aktif/tidak) sama dengan yang terjadi pada daftar.
    const pressed = chip('Favorit').getAttribute('aria-pressed') === 'true';
    expect(domOrder(['Alpha', 'Alpine'])).toEqual(pressed ? ['Alpha'] : ['Alpha', 'Alpine']);
  });
});

/* ───────────────────────── pencarian ───────────────────────── */
describe('VaultListView — logika pencarian (kolom yang dicari)', () => {
  const NAMES = ['Kuda Laut', 'E user', 'E url', 'E note', 'E ssid', 'E holder', 'E email', 'Hanya Pass', 'Lain'];
  const vault = [
    mk('1', 'Kuda Laut'),
    mk('2', 'E user', { user: 'u-kuda' }),
    mk('3', 'E url', { url: 'https://situs-kuda.id' }),
    mk('4', 'E note', { note: 'catatan kuda' }),
    mk('5', 'E ssid', { wifiSSID: 'ssid-kuda' }),
    mk('6', 'E holder', { cardHolder: 'holder KUDA' }),
    mk('7', 'E email', { emailAddr: 'mail-kuda@contoh.id' }),
    mk('8', 'Hanya Pass', { pass: 'kuda-rahasia' }),
    mk('9', 'Lain'),
  ];

  it('mencari di nama, user, URL, catatan, SSID Wi-Fi, pemilik kartu, dan email — TIDAK di password', () => {
    setup({ vault, searchQuery: 'kuda' });
    render(<VaultListView />);
    expect(domOrder(NAMES)).toEqual(['Kuda Laut', 'E user', 'E url', 'E note', 'E ssid', 'E holder', 'E email']);
    expect(screen.getByText('7 hasil untuk "kuda"')).toBeInTheDocument();
  });

  it('tidak peka huruf besar/kecil: kueri KAPITAL menemukan data huruf kecil dan sebaliknya', () => {
    setup({ vault, searchQuery: 'KUDA' });
    render(<VaultListView />);
    expect(domOrder(NAMES)).toEqual(['Kuda Laut', 'E user', 'E url', 'E note', 'E ssid', 'E holder', 'E email']);
  });

  it('kueri hanya spasi tidak menyaring daftar', () => {
    setup({ vault, searchQuery: '   ' });
    render(<VaultListView />);
    expect(domOrder(NAMES)).toEqual(NAMES);
  });

  it('pencarian digabung dengan filter kategori / favorit (irisan)', () => {
    setup({
      vault: [mk('1', 'Kuda Bank', { cat: 'bank' }), mk('2', 'Kuda Email', { cat: 'email', fav: true }), mk('3', 'Sapi Bank', { cat: 'bank' })],
      currentFilter: 'bank', searchQuery: 'kuda',
    });
    const { unmount } = render(<VaultListView />);
    expect(domOrder(['Kuda Bank', 'Kuda Email', 'Sapi Bank'])).toEqual(['Kuda Bank']);
    unmount();
    act(() => { useAppStore.setState({ currentFilter: 'fav' }); });
    render(<VaultListView />);
    expect(domOrder(['Kuda Bank', 'Kuda Email', 'Sapi Bank'])).toEqual(['Kuda Email']);
  });

  it('di Sampah: pencarian menyaring isi sampah, bukan vault', () => {
    setup({ vault: [mk('1', 'Kuda Vault')], recycleBin: [mk('t1', 'Kuda Sampah'), mk('t2', 'Sapi Sampah')], currentFilter: 'bin', searchQuery: 'kuda' });
    render(<VaultListView />);
    expect(domOrder(['Kuda Vault', 'Kuda Sampah', 'Sapi Sampah'])).toEqual(['Kuda Sampah']);
  });
});

/* ───────────────────────── empty state (di luar vaultListFilters) ───────────────────────── */
describe('VaultListView — empty state lain', () => {
  it('pencarian tanpa hasil: "Tidak ada hasil" + kata yang dicari (menang atas empty state lain)', () => {
    setup({ vault: [mk('a', 'Alpha')], searchQuery: 'zzz' });
    render(<VaultListView />);
    expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
    expect(screen.getByText('Tidak ditemukan entri untuk "zzz"')).toBeInTheDocument();
    expect(screen.queryByText(/Vault masih kosong/)).not.toBeInTheDocument();
  });

  it('vault kosong, semua kategori: "Vault masih kosong" + tombol tambah entri pertama', () => {
    setup();
    render(<VaultListView />);
    expect(screen.getByText('Vault masih kosong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Tambah Entri Pertama' })).toBeInTheDocument();
  });

  it('kategori bawaan dan kustom kosong: judul memuat label kategori + tombol tambah entri', () => {
    setup({ customCats: [custom('kerja', 'Kerja')], currentFilter: 'email' });
    const { unmount } = render(<VaultListView />);
    expect(screen.getByText('Kategori Email kosong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Tambah Entri' })).toBeInTheDocument();
    unmount();
    act(() => { useAppStore.setState({ currentFilter: 'kerja' }); });
    render(<VaultListView />);
    expect(screen.getByText('Kategori Kerja kosong')).toBeInTheDocument();
  });

  it('filter Favorit (bukan chip) tanpa favorit: "Belum ada favorit"', () => {
    setup({ vault: [mk('a', 'Alpha')], currentFilter: 'fav' });
    render(<VaultListView />);
    expect(screen.getByText('Belum ada favorit')).toBeInTheDocument();
    expect(screen.queryByText(/Kategori fav kosong/)).not.toBeInTheDocument();
  });

  it('Sampah kosong: pesan khusus dan tanpa tombol Kosongkan', () => {
    setup({ currentFilter: 'bin' });
    render(<VaultListView />);
    expect(screen.getByText('Sampah kosong')).toBeInTheDocument();
    expect(screen.queryByLabelText('Kosongkan semua sampah')).not.toBeInTheDocument();
  });

  it('tombol tambah di empty state membuka form entri (menggantikan daftar)', () => {
    setup();
    render(<VaultListView />);
    fireEvent.click(screen.getByRole('button', { name: '+ Tambah Entri Pertama' }));
    expect(screen.queryByRole('heading', { level: 2, name: 'Semua Entri' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah entri' })).toBeInTheDocument();
  });

  it('ref.openAddForm() (dipakai tombol + di navigasi) membuka form entri', () => {
    setup({ vault: [mk('a', 'Alpha')] });
    const ref = createRef<VaultListViewRef>();
    render(<VaultListView ref={ref} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Semua Entri' })).toBeInTheDocument();
    act(() => { ref.current?.openAddForm(); });
    expect(screen.queryByRole('heading', { level: 2, name: 'Semua Entri' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah entri' })).toBeInTheDocument();
  });
});

/* ───────────────────────── Kosongkan sampah (tampilan) ───────────────────────── */
describe('VaultListView — tombol "Kosongkan" hanya di Sampah yang berisi', () => {
  it('tidak tampil di daftar biasa; tampil di Sampah berisi; hilang di Sampah kosong', () => {
    setup({ vault: [mk('a', 'Alpha')], recycleBin: [mk('t', 'Terhapus')] });
    const { unmount } = render(<VaultListView />);
    expect(screen.queryByLabelText('Kosongkan semua sampah')).not.toBeInTheDocument();
    unmount();
    act(() => { useAppStore.setState({ currentFilter: 'bin' }); });
    const r2 = render(<VaultListView />);
    expect(screen.getByLabelText('Kosongkan semua sampah')).toBeInTheDocument();
    r2.unmount();
    act(() => { useAppStore.setState({ recycleBin: [] }); });
    render(<VaultListView />);
    expect(screen.queryByLabelText('Kosongkan semua sampah')).not.toBeInTheDocument();
  });
});

/* ───────────────────────── skeleton ───────────────────────── */
describe('VaultListView — skeleton saat vault dimuat', () => {
  it('isVaultLoading: skeleton tampil (aria-busy), entri belum tampil, header tetap ada; setelah selesai skeleton bertahan 300 ms lalu diganti daftar', () => {
    vi.useFakeTimers();
    setup({ vault: [mk('a', 'Alpha')] });
    const { rerender } = render(<VaultListView isVaultLoading />);
    expect(screen.getByLabelText('Memuat entri…')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Semua Entri' })).toBeInTheDocument();

    rerender(<VaultListView isVaultLoading={false} />);
    act(() => { vi.advanceTimersByTime(299); });
    expect(screen.getByLabelText('Memuat entri…')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.queryByLabelText('Memuat entri…')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('memuat ulang: bila isVaultLoading kembali true setelah selesai, skeleton muncul lagi dan entri disembunyikan', () => {
    vi.useFakeTimers();
    setup({ vault: [mk('a', 'Alpha')] });
    const { rerender } = render(<VaultListView isVaultLoading={false} />);
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.queryByLabelText('Memuat entri…')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    rerender(<VaultListView isVaultLoading />);
    expect(screen.getByLabelText('Memuat entri…')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  });

  it('tanpa isVaultLoading: daftar langsung tampil tanpa skeleton', () => {
    setup({ vault: [mk('a', 'Alpha')] });
    render(<VaultListView />);
    expect(screen.queryByLabelText('Memuat entri…')).not.toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
