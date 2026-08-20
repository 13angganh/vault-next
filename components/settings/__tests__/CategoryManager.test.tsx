/**
 * components/settings/__tests__/CategoryManager.test.tsx — Vault Next
 *
 * v1.7.0: addCustomCat(newCat) sebelumnya dipanggil telanjang di
 * handleSave, di luar try/catch manapun. Kalau localStorage penuh tepat
 * di titik itu, exception lolos ke luar sebagai uncaught error di
 * onClick handler React — berpotensi crash UI alih-alih toast rapi.
 * Test ini memverifikasi alur simpan kategori baru sekarang menampilkan
 * toast error dan TIDAK crash saat localStorage gagal.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CategoryManager } from '../CategoryManager';
import { useAppStore } from '@/lib/store/appStore';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({
    customCats: [],
    masterPw: 'dummy-master-pw',
    vault: [],
    recycleBin: [],
    lockedIds: [],
    lockedCatIds: [],
    vaultMeta: { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('CategoryManager — handleSave saat addCustomCat gagal (v1.7.0 fix)', () => {
  it('menampilkan toast error, bukan crash, saat localStorage penuh di titik addCustomCat', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    render(<CategoryManager />);

    fireEvent.click(screen.getByText('Tambah Kategori'));

    const input = await screen.findByPlaceholderText('contoh: Kerja, Pribadi, Sekolah…');
    fireEvent.change(input, { target: { value: 'Kategori Baru' } });

    // Ini titik yang sebelumnya crash: addCustomCat() throw tanpa
    // try/catch pembungkus di handleSave.
    fireEvent.click(screen.getByText('Tambah'));

    expect(await screen.findByText('Gagal menyimpan kategori, coba lagi')).toBeInTheDocument();
    // State tidak berubah — kategori baru tidak "setengah tersimpan"
    expect(useAppStore.getState().customCats).toEqual([]);
  });
});

/**
 * v1.10.0: Lock/Unlock kategori (default maupun custom) agar tidak
 * sengaja terhapus/berubah. Tiga lapis proteksi diverifikasi: atribut
 * disabled pada tombol, guard di dalam handler itu sendiri (openEdit/
 * handleDelete), dan tidak berubahnya store saat aksi dicoba pada
 * kategori terkunci.
 */
describe('CategoryManager — Lock/Unlock Kategori (v1.10.0)', () => {
  const dummyCustomCat = {
    id: 'cat_dummy_1',
    label: 'Kategori Dummy',
    emoji: 'Tag',
    iconKey: 'Tag',
  };

  it('kategori default menampilkan tombol kunci (unlocked secara default)', () => {
    render(<CategoryManager />);
    // Kategori default pertama dari DEFAULT_CATEGORIES adalah "Sosmed"
    expect(screen.getByLabelText('Kunci kategori Sosmed')).toBeInTheDocument();
  });

  it('mengklik tombol kunci pada kategori default mengubah label tombol ke "buka kunci" dan menyimpan ke store', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kunci kategori Sosmed'));

    expect(screen.getByLabelText('Buka kunci kategori Sosmed')).toBeInTheDocument();
    expect(useAppStore.getState().lockedCatIds).toContain('sosmed');
  });

  it('mengklik tombol kunci dua kali (kunci lalu buka kunci) mengembalikan ke keadaan semula', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kunci kategori Sosmed'));
    fireEvent.click(screen.getByLabelText('Buka kunci kategori Sosmed'));

    expect(screen.getByLabelText('Kunci kategori Sosmed')).toBeInTheDocument();
    expect(useAppStore.getState().lockedCatIds).not.toContain('sosmed');
  });

  it('kategori custom yang TIDAK terkunci: tombol Edit & Hapus aktif (bisa diklik)', () => {
    useAppStore.setState({ customCats: [dummyCustomCat] });
    render(<CategoryManager />);

    const editBtn = screen.getByLabelText('Edit Kategori Dummy');
    const delBtn  = screen.getByLabelText('Hapus Kategori Dummy');
    expect(editBtn).not.toBeDisabled();
    expect(delBtn).not.toBeDisabled();
  });

  it('mengunci kategori custom menonaktifkan tombol Edit & Hapus (atribut disabled)', () => {
    useAppStore.setState({ customCats: [dummyCustomCat] });
    render(<CategoryManager />);

    fireEvent.click(screen.getByLabelText('Kunci kategori Kategori Dummy'));

    expect(screen.getByLabelText('Edit Kategori Dummy')).toBeDisabled();
    expect(screen.getByLabelText('Hapus Kategori Dummy')).toBeDisabled();
  });

  it('mengklik tombol Edit yang disabled TIDAK membuka form edit', () => {
    useAppStore.setState({ customCats: [dummyCustomCat], lockedCatIds: ['cat_dummy_1'] });
    render(<CategoryManager />);

    // Elemen disabled -- browser/React tidak pernah memanggil onClick
    // sama sekali (dikonfirmasi: menghapus atribut disabled dari DOM
    // secara manual TIDAK membuat React tetap memanggil handler --
    // React melacak status disabled dari prop render, bukan atribut
    // DOM). Proteksi guard di dalam openEdit sendiri (lapis kedua,
    // untuk kondisi di luar interaksi UI normal) diuji terpisah
    // sebagai pure function di lib/__tests__/utils.test.ts.
    fireEvent.click(screen.getByLabelText('Edit Kategori Dummy'));

    expect(screen.queryByText('Edit Kategori')).not.toBeInTheDocument();
  });

  it('mengklik tombol Hapus yang disabled TIDAK memicu dialog konfirmasi hapus', () => {
    useAppStore.setState({ customCats: [dummyCustomCat], lockedCatIds: ['cat_dummy_1'] });
    render(<CategoryManager />);

    fireEvent.click(screen.getByLabelText('Hapus Kategori Dummy'));

    expect(screen.queryByText('Hapus Kategori?')).not.toBeInTheDocument();
  });

  it('membuka kunci kategori custom mengaktifkan kembali tombol Edit & Hapus', () => {
    useAppStore.setState({ customCats: [dummyCustomCat], lockedCatIds: ['cat_dummy_1'] });
    render(<CategoryManager />);

    expect(screen.getByLabelText('Edit Kategori Dummy')).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Buka kunci kategori Kategori Dummy'));

    expect(screen.getByLabelText('Edit Kategori Dummy')).not.toBeDisabled();
    expect(screen.getByLabelText('Hapus Kategori Dummy')).not.toBeDisabled();
  });

  it('lock kategori satu tidak memengaruhi kategori lain (independen per-ID)', () => {
    const secondCat = { id: 'cat_dummy_2', label: 'Kategori Kedua', emoji: 'Tag', iconKey: 'Tag' };
    useAppStore.setState({ customCats: [dummyCustomCat, secondCat] });
    render(<CategoryManager />);

    fireEvent.click(screen.getByLabelText('Kunci kategori Kategori Dummy'));

    expect(screen.getByLabelText('Edit Kategori Dummy')).toBeDisabled();
    expect(screen.getByLabelText('Edit Kategori Kedua')).not.toBeDisabled();
  });
});

/**
 * v1.10.0: Editor field per kategori (default & custom). Mesin
 * penggabungan field (getFieldsForCat) diuji terpisah secara unit di
 * components/entries/__tests__/dynamicFields.test.ts — test di sini
 * fokus ke alur UI: buka editor, tambah/hapus field, validasi, simpan,
 * dan guard kategori terkunci.
 */
describe('CategoryManager — Editor Field Kategori (v1.10.0)', () => {
  it('tombol "Kelola field" muncul untuk kategori default', () => {
    render(<CategoryManager />);
    expect(screen.getByLabelText('Kelola field Sosmed')).toBeInTheDocument();
  });

  it('membuka editor field kategori default menampilkan field bawaannya (mis. "Username")', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));

    expect(screen.getByText('Field: Sosmed')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Username')).toBeInTheDocument();
  });

  it('field bawaan ditandai badge "Bawaan" dan tidak punya tombol hapus', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));

    const badges = screen.getAllByText('Bawaan');
    expect(badges.length).toBeGreaterThan(0);
    // Field bawaan tidak boleh punya tombol hapus sama sekali di baris
    // manapun yang menampilkan badge "Bawaan" — dicek tidak ada tombol
    // "Hapus field Username" spesifik.
    expect(screen.queryByLabelText('Hapus field Username')).not.toBeInTheDocument();
  });

  it('menekan "Tambah Field" menambahkan baris input kosong baru', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));

    const before = screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja').length;
    fireEvent.click(screen.getByText('Tambah Field'));
    const after = screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja').length;

    expect(after).toBe(before + 1);
  });

  it('field kustom baru yang sudah diberi nama punya tombol hapus, dan menghapusnya mengurangi jumlah baris', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByText('Tambah Field'));

    const inputs = screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja');
    const newInput = inputs[inputs.length - 1];
    fireEvent.change(newInput, { target: { value: 'Nomor Meja' } });

    const delBtn = screen.getByLabelText('Hapus field Nomor Meja');
    expect(delBtn).toBeInTheDocument();

    fireEvent.click(delBtn);
    expect(screen.queryByDisplayValue('Nomor Meja')).not.toBeInTheDocument();
  });

  it('menyimpan dengan field baru yang labelnya masih kosong menampilkan error, tidak menutup form', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByText('Tambah Field'));

    fireEvent.click(screen.getByText('Simpan'));

    expect(screen.getByText(/harus punya nama|belum diberi nama/)).toBeInTheDocument();
    // Form tidak menutup — masih di halaman editor field.
    expect(screen.getByText('Field: Sosmed')).toBeInTheDocument();
  });

  it('"Kembalikan ke field bawaan" mengisi ulang draft dengan field asli tanpa perlu Simpan dulu', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByText('Tambah Field'));
    expect(screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja')).toHaveLength(
      screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja').length
    );

    fireEvent.click(screen.getByText('Kembalikan ke field bawaan'));

    // Field baru yang belum diberi nama (kosong) hilang — draft kembali
    // persis ke field bawaan asli.
    const emptyInputs = screen.getAllByPlaceholderText('Nama field kamu sendiri, mis. Nomor Meja')
      .filter((el) => (el as HTMLInputElement).value === '');
    expect(emptyInputs).toHaveLength(0);
  });

  it('kategori default yang terkunci: tombol "Kelola field" disabled', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kunci kategori Sosmed'));

    expect(screen.getByLabelText('Kelola field Sosmed')).toBeDisabled();
  });

  it('kategori custom tanpa fields tersimpan membuka editor dengan field "lainnya" sebagai default', () => {
    const catNoFields = { id: 'cat_x', label: 'Server', emoji: 'Database', iconKey: 'Database' };
    useAppStore.setState({ customCats: [catNoFields] });
    render(<CategoryManager />);

    fireEvent.click(screen.getByLabelText('Kelola field Server'));
    expect(screen.getByText('Field: Server')).toBeInTheDocument();
    // Field 'lainnya' bawaan dimulai dengan Username — dicek starting point-nya benar.
    expect(screen.getByDisplayValue('Username')).toBeInTheDocument();
  });

  it('tombol Batal kembali ke daftar tanpa menyimpan perubahan draft', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByText('Tambah Field'));

    fireEvent.click(screen.getByText('Batal'));

    expect(screen.getByText('Kelola Kategori')).toBeInTheDocument();
    expect(useAppStore.getState().defaultCatFieldOverrides['sosmed']).toBeUndefined();
  });
});

/**
 * v1.10.1: BUG FIX — dropdown tipe field sebelumnya <select> native,
 * rusak visual di WebView Android (dilaporkan pengguna via screenshot:
 * kotak menciut kosong tak terbaca, badge "Bawaan" tampak menyatu ke
 * input di sampingnya). Diganti dropdown kustom (tombol trigger + popup
 * + backdrop, pola sama vault-sort-menu). Test ini memverifikasi
 * dropdown BARU berfungsi — bukan menguji <select> lama yang sudah
 * tidak ada.
 */
describe('CategoryManager — Dropdown Tipe Field kustom (v1.10.1 fix)', () => {
  it('tombol trigger tipe field menampilkan label tipe saat ini ("Teks" untuk field default)', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));

    // Field pertama (key 'user') defaultnya type text -> tombol label "Teks"
    expect(screen.getByLabelText(/Tipe field Username: Teks/)).toBeInTheDocument();
  });

  it('mengklik tombol trigger membuka menu pilihan tipe', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));

    // Menu menampilkan semua 6 pilihan tipe sebagai tombol terpisah —
    // query di dalam .field-type-menu secara eksplisit karena beberapa
    // label tipe (mis. "Password", "Teks panjang") juga muncul sebagai
    // label tombol trigger field LAIN di halaman yang sama (field 'pass'
    // defaultnya bertipe password, field 'note' defaultnya textarea).
    const menu = document.querySelector('.field-type-menu') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(within(menu).getByText('Password')).toBeInTheDocument();
    expect(within(menu).getByText('Email')).toBeInTheDocument();
    expect(within(menu).getByText('URL')).toBeInTheDocument();
    expect(within(menu).getByText('Teks panjang')).toBeInTheDocument();
    expect(within(menu).getByText('Multi-isian')).toBeInTheDocument();
  });

  it('memilih tipe baru dari menu mengubah label tombol trigger dan menutup menu', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));

    const menu = document.querySelector('.field-type-menu') as HTMLElement;
    fireEvent.click(within(menu).getByText('Password'));

    expect(screen.getByLabelText(/Tipe field Username: Password/)).toBeInTheDocument();
    // Menu tertutup — elemen .field-type-menu sudah tidak ada di DOM sama sekali.
    expect(document.querySelector('.field-type-menu')).toBeNull();
  });

  it('mengklik backdrop menutup menu tanpa mengubah tipe', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));

    const backdrop = document.querySelector('.field-type-backdrop');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);

    expect(screen.getByLabelText(/Tipe field Username: Teks/)).toBeInTheDocument();
    expect(document.querySelector('.field-type-menu')).toBeNull();
  });

  it('mengklik tombol trigger yang sedang terbuka menutup menu lagi (toggle)', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    const trigger = screen.getByLabelText(/Tipe field Username: Teks/);

    fireEvent.click(trigger);
    expect(document.querySelector('.field-type-menu')).not.toBeNull();

    fireEvent.click(trigger);
    expect(document.querySelector('.field-type-menu')).toBeNull();
  });

  it('memilih tipe "Multi-isian" menampilkan input jumlah isian dengan default 10', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));
    fireEvent.click(screen.getByText('Multi-isian'));

    const countInput = screen.getByLabelText('Jumlah isian:') as HTMLInputElement;
    expect(countInput).toBeInTheDocument();
    expect(countInput.value).toBe('10');
  });

  it('mengubah jumlah isian memperbarui nilainya, dibatasi 2–30', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));
    fireEvent.click(screen.getByText('Multi-isian'));

    const countInput = screen.getByLabelText('Jumlah isian:') as HTMLInputElement;
    fireEvent.change(countInput, { target: { value: '15' } });
    expect(countInput.value).toBe('15');

    fireEvent.change(countInput, { target: { value: '99' } });
    expect(countInput.value).toBe('30'); // dibatasi maksimum 30

    fireEvent.change(countInput, { target: { value: '0' } });
    expect(countInput.value).toBe('2'); // dibatasi minimum 2
  });

  it('berganti dari "Multi-isian" ke tipe lain menyembunyikan input jumlah isian lagi', () => {
    render(<CategoryManager />);
    fireEvent.click(screen.getByLabelText('Kelola field Sosmed'));
    fireEvent.click(screen.getByLabelText(/Tipe field Username: Teks/));
    fireEvent.click(screen.getByText('Multi-isian'));
    expect(screen.getByLabelText('Jumlah isian:')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Tipe field Username: Multi-isian/));
    fireEvent.click(screen.getByText('Teks'));

    expect(screen.queryByLabelText('Jumlah isian:')).not.toBeInTheDocument();
  });
});
