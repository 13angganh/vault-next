/**
 * components/settings/__tests__/SettingsView.test.tsx — Aurum Vault v2.0.0 (Tahap 4, diperbarui Tahap 5)
 *
 * PERUBAHAN TAHAP 5 (alasan tertulis; test TIDAK dilemahkan): keputusan D3 menambah layar
 * "Atribusi & lisensi" sebagai SATU baris navigasi baru. Ia ditempatkan di kelompok baru "Tentang"
 * (bukan disisipkan ke kelompok yang tidak sepadan), sehingga test "tepat tiga kelompok" diperketat
 * menjadi "tepat empat kelompok" (urutan terkunci, Tentang terakhir) dan ditambah describe baru
 * "Tentang" untuk baris itu: tipe baris, sheet, penutupan, tanpa kunci penyimpanan baru.
 *
 * RIWAYAT. v1.10.3 menulis test ini untuk Pengaturan yang terdiri dari tiga section
 * collapsible (Keamanan/Tampilan/Data) + kotak "Info Vault" + guard ResizeObserver.
 * Pengaturan v2 (SettingsView v2.1) dirombak total, sehingga 9 dari 12 test lama gagal
 * dan 3 lainnya (footer "100% Offline", dua guard ResizeObserver) lolos tetapi KOSONG:
 * v2 tidak memakai ResizeObserver sama sekali.
 *
 * MAKSUD yang dijaga (dipindahkan ke struktur v2, bukan dihapus):
 *  - pengelompokan: satu tempat per tema — Tampilan, Keamanan, Data & cadangan
 *    (judul section lama Biometrik/Penyimpanan/Backup & Sync tidak boleh kembali);
 *  - isi tiap kelompok: Kunci otomatis, PIN, Sidik jari, Kesehatan password / Tema,
 *    Kategori / Simpan otomatis, Pengingat backup, satu menu "Cadangan & sinkronisasi";
 *  - ringkasan "Info Vault" kini hero "Brankas terlindungi": statis, tanpa klik,
 *    angka Entri/Favorit/Sampah selalu terlihat; versi aplikasi di footer;
 *  - tidak ada footer duplikat "100% Offline";
 *  - Kesehatan password tetap berfungsi penuh di lokasi barunya (kini sheet).
 *
 * BARU di v2 (keputusan desain terkunci): hanya DUA jenis baris — saklar (boolean) atau
 * navigasi (nilai + panah → sheet/halaman); tidak ada segmented, select native, atau
 * blok yang mengembang di tempat. Tiap baris navigasi dites sampai efek nyatanya
 * (store + localStorage + tampilan), bukan hanya "sheet terbuka".
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { SettingsView } from '../SettingsView';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { useAppStore } from '@/lib/store/appStore';
import { useNavMode } from '@/lib/navMode';
import { APP_NAME, APP_VERSION } from '@/lib/constants';

function renderSettings(props: { onClose?: () => void } = {}) {
  return render(
    <ThemeProvider>
      <SettingsView {...props} />
    </ThemeProvider>,
  );
}

/** Baris navigasi: tombol yang namanya diawali label (ikon SVG aria-hidden tidak menambah nama). */
const barisNav = (label: string) => screen.getByRole('button', { name: new RegExp(`^${label}`) });
/** Kelompok = <section> dengan judul h3. */
const kelompok = (judul: string) => {
  const section = screen.getByRole('heading', { level: 3, name: judul }).closest('section');
  if (!section) throw new Error(`Kelompok "${judul}" tidak ditemukan`);
  return section;
};

function setWebAuthn(ada: boolean) {
  if (ada) Object.defineProperty(window, 'PublicKeyCredential', { value: function () {}, configurable: true, writable: true });
  else Reflect.deleteProperty(window, 'PublicKeyCredential');
}

beforeEach(() => {
  localStorage.clear();
  // Di aplikasi nyata skrip anti-kedip sudah mengisi data-theme sebelum hidrasi; jsdom tidak punya
  // window.matchMedia (jalur cadangan ThemeProvider), jadi test meniru keadaan produksi itu.
  document.documentElement.setAttribute('data-theme', 'dark');
  useNavMode.setState({ mode: 'bottom' });
  useAppStore.setState({
    customCats: [], vault: [], recycleBin: [],
    autoLockMinutes: 5, backupIntervalHrs: 24, autoSaveEnabled: true,
    biometricEnabled: false, biometricCredId: null, masterPw: 'pw-uji',
  });
});
afterEach(() => { setWebAuthn(false); });

describe('SettingsView — pengelompokan v2 (menggantikan 3 section collapsible v1.10.3)', () => {
  it('tepat empat kelompok berjudul Tampilan, Keamanan, Data & cadangan, Tentang (urutan itu)', () => {
    renderSettings();
    const judul = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(judul).toEqual(['Tampilan', 'Keamanan', 'Data & cadangan', 'Tentang']);
  });

  it('judul section lama (Biometrik, Penyimpanan, Backup & Sync, Kategori) TIDAK kembali sebagai section terpisah', () => {
    renderSettings();
    const judul = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    for (const lama of ['Biometrik', 'Penyimpanan', 'Backup & Sync', 'Kategori', 'Data']) {
      expect(judul).not.toContain(lama);
    }
    // "Kategori" kini hanya BARIS di dalam Tampilan, bukan header
    expect(within(kelompok('Tampilan')).getByRole('button', { name: /^Kategori/ })).toBeInTheDocument();
  });

  it('Keamanan memuat Kunci otomatis, PIN, Sidik jari, dan Kesehatan password — tanpa perlu diklik dulu', () => {
    setWebAuthn(true);
    renderSettings();
    const k = within(kelompok('Keamanan'));
    expect(k.getByRole('button', { name: /^Kunci otomatis/ })).toBeInTheDocument();
    expect(k.getByRole('button', { name: /^PIN/ })).toBeInTheDocument();
    expect(k.getByRole('button', { name: /^Sidik jari/ })).toBeInTheDocument();
    expect(k.getByRole('button', { name: /^Kesehatan password/ })).toBeInTheDocument();
  });

  it('Tampilan memuat Tema, Gaya navigasi, dan Kategori', () => {
    renderSettings();
    const t = within(kelompok('Tampilan'));
    expect(t.getByRole('button', { name: /^Tema/ })).toBeInTheDocument();
    expect(t.getByRole('button', { name: /^Gaya navigasi/ })).toBeInTheDocument();
    expect(t.getByRole('button', { name: /^Kategori/ })).toBeInTheDocument();
  });

  it('Data & cadangan memuat saklar Simpan otomatis, Pengingat backup, dan SATU menu Cadangan & sinkronisasi', () => {
    renderSettings();
    const d = within(kelompok('Data & cadangan'));
    expect(d.getByRole('switch', { name: 'Toggle simpan otomatis' })).toBeInTheDocument();
    expect(d.getByRole('button', { name: /^Pengingat backup/ })).toBeInTheDocument();
    expect(d.getAllByRole('button', { name: /^Cadangan & sinkronisasi/ })).toHaveLength(1);
    // Export/Import dan Sinkron dulu dua baris terpisah — kini satu menu
    expect(screen.queryByText('Export & Import')).not.toBeInTheDocument();
    expect(screen.queryByText('Sinkron Antar Perangkat')).not.toBeInTheDocument();
  });
});

describe('SettingsView — hanya dua jenis baris, tanpa blok yang mengembang', () => {
  it('tidak ada select native, segmented/radiogroup, tablist, maupun elemen aria-expanded di halaman utama', () => {
    const { container } = renderSettings();
    expect(container.querySelector('select')).toBeNull();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-expanded]')).toBeNull();
  });

  it('setiap baris adalah saklar (role=switch) ATAU tombol navigasi; saklar boolean memakai aria-checked', () => {
    setWebAuthn(true);
    localStorage.setItem('vault_bio_cred', 'cred-uji');
    renderSettings();
    for (const sw of screen.getAllByRole('switch')) {
      expect(['true', 'false']).toContain(sw.getAttribute('aria-checked'));
    }
    // dengan biometrik terdaftar ada tepat dua saklar: Sidik jari + Simpan otomatis
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });

  it('tidak bergantung pada ResizeObserver (v2 tidak memakainya): tetap render di lingkungan tanpa dukungan', () => {
    const asli = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
    try {
      expect(() => renderSettings()).not.toThrow();
      expect(screen.getByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
    } finally {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = asli;
    }
  });
});

describe('SettingsView — hero ringkasan "Brankas terlindungi" (pengganti Info Vault v1.10.3)', () => {
  it('selalu terlihat tanpa diklik, dan judulnya BUKAN tombol', () => {
    renderSettings();
    const hero = screen.getByRole('region', { name: 'Ringkasan keamanan' });
    const judul = within(hero).getByText('Brankas terlindungi');
    expect(judul.closest('button')).toBeNull();
    expect(within(hero).queryAllByRole('button')).toHaveLength(0);
  });

  it('angka Entri / Favorit / Sampah berasal dari store', () => {
    useAppStore.setState({
      vault: [
        { id: '1', cat: 'sosmed', name: 'A', fav: true },
        { id: '2', cat: 'email', name: 'B' },
        { id: '3', cat: 'bank', name: 'C' },
      ],
      recycleBin: [{ id: '9', cat: 'game', name: 'Z' }],
    });
    renderSettings();
    expect(screen.getByText('Entri').parentElement).toHaveTextContent(/^3Entri$/);
    expect(screen.getByText('Favorit').parentElement).toHaveTextContent(/^1Favorit$/);
    expect(screen.getByText('Sampah').parentElement).toHaveTextContent(/^1Sampah$/);
  });

  it('lencana mengikuti keadaan nyata: PIN belum/aktif, Biometrik belum, Auto-lock sesuai pilihan', () => {
    const { unmount } = renderSettings();
    expect(screen.getByText('PIN belum')).toBeInTheDocument();
    expect(screen.getByText('Biometrik belum')).toBeInTheDocument();
    expect(screen.getByText('Auto-lock 5 menit')).toBeInTheDocument();
    unmount();

    localStorage.setItem('vault_pin', 'pin-terenkripsi-uji');
    useAppStore.setState({ autoLockMinutes: 30 });
    renderSettings();
    expect(screen.getByText('PIN aktif')).toBeInTheDocument();
    expect(screen.getByText('Auto-lock 30 menit')).toBeInTheDocument();
  });

  it('versi aplikasi tampil di footer; footer duplikat lama "100% Offline" tetap tidak ada', () => {
    renderSettings();
    expect(screen.getByText(new RegExp(`${APP_NAME} v${APP_VERSION.replace(/\./g, '\\.')} ·`))).toBeInTheDocument();
    expect(screen.queryByText(/100% Offline/)).not.toBeInTheDocument();
  });
});

describe('SettingsView — baris navigasi membuka sheet pilihan dan benar-benar mengubah pengaturan', () => {
  it('Tema: sheet menandai pilihan aktif; memilih Terang mengubah data-theme, localStorage, dan nilai baris', async () => {
    renderSettings();
    expect(barisNav('Tema')).toHaveTextContent('Gelap');

    fireEvent.click(barisNav('Tema'));
    const sheet = screen.getByRole('dialog', { name: 'Tema' });
    expect(within(sheet).getByRole('option', { name: /Gelap/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(sheet).getByRole('option', { name: /Terang/ })).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(within(sheet).getByRole('option', { name: /Terang/ }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('vault_theme')).toBe('light');
    expect(screen.queryByRole('dialog', { name: 'Tema' })).not.toBeInTheDocument(); // sheet menutup sendiri
    await waitFor(() => expect(barisNav('Tema')).toHaveTextContent('Terang'));
  });

  it('Gaya navigasi: bawaan Bar bawah; memilih Sidebar menyimpan vault_nav_mode dan memperbarui nilai baris', () => {
    renderSettings();
    expect(barisNav('Gaya navigasi')).toHaveTextContent('Bar bawah');

    fireEvent.click(barisNav('Gaya navigasi'));
    const sheet = screen.getByRole('dialog', { name: 'Gaya navigasi' });
    expect(within(sheet).getAllByRole('option')).toHaveLength(2); // hanya satu gaya dipilih — tidak pernah dobel
    fireEvent.click(within(sheet).getByRole('option', { name: /^Sidebar/ }));

    expect(useNavMode.getState().mode).toBe('sidebar');
    expect(localStorage.getItem('vault_nav_mode')).toBe('sidebar');
    expect(barisNav('Gaya navigasi')).toHaveTextContent('Sidebar');
  });

  it('Kunci otomatis: sheet memuat semua pilihan; memilih 10 menit mengubah store, vault_autolock, dan lencana', () => {
    renderSettings();
    fireEvent.click(barisNav('Kunci otomatis'));
    const sheet = screen.getByRole('dialog', { name: 'Kunci otomatis' });
    expect(within(sheet).getAllByRole('option').map((o) => o.textContent)).toEqual(
      ['Nonaktif', '1 menit', '5 menit', '10 menit', '30 menit', '1 jam'],
    );
    expect(within(sheet).getByRole('option', { name: '5 menit' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(within(sheet).getByRole('option', { name: '10 menit' }));
    expect(useAppStore.getState().autoLockMinutes).toBe(10);
    expect(localStorage.getItem('vault_autolock')).toBe('10');
    expect(barisNav('Kunci otomatis')).toHaveTextContent('10 menit');
    expect(screen.getByText('Auto-lock 10 menit')).toBeInTheDocument();
  });

  it('Pengingat backup: bawaan Setiap hari; memilih Setiap minggu = 168 jam dan tersimpan di vault_bkp_ivl', () => {
    renderSettings();
    expect(barisNav('Pengingat backup')).toHaveTextContent('Setiap hari');
    fireEvent.click(barisNav('Pengingat backup'));
    const sheet = screen.getByRole('dialog', { name: 'Pengingat backup' });
    expect(within(sheet).getAllByRole('option')).toHaveLength(4);

    fireEvent.click(within(sheet).getByRole('option', { name: 'Setiap minggu' }));
    expect(useAppStore.getState().backupIntervalHrs).toBe(168);
    expect(localStorage.getItem('vault_bkp_ivl')).toBe('168');
    expect(barisNav('Pengingat backup')).toHaveTextContent('Setiap minggu');
  });

  it('Kategori: menampilkan halaman Kelola Kategori; tombol kembali memulihkan Pengaturan', () => {
    renderSettings();
    fireEvent.click(barisNav('Kategori'));
    expect(screen.getByRole('heading', { name: 'Kelola Kategori' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pengaturan' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke pengaturan' }));
    expect(screen.getByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
  });
});

describe('SettingsView — baris saklar', () => {
  it('Simpan otomatis: aktif bawaan; mengetuk mematikannya dan menyimpan ke vault_autosave', () => {
    renderSettings();
    const sw = screen.getByRole('switch', { name: 'Toggle simpan otomatis' });
    expect(sw).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(sw);
    expect(useAppStore.getState().autoSaveEnabled).toBe(false);
    expect(localStorage.getItem('vault_autosave')).toBe('false');
    expect(screen.getByRole('switch', { name: 'Toggle simpan otomatis' })).toHaveAttribute('aria-checked', 'false');
  });
});

describe('SettingsView — Keamanan: PIN, biometrik, kesehatan password', () => {
  it('PIN: nilai "Belum diatur" → "Aktif" bila ada vault_pin; mengetuk membuka sheet PIN', () => {
    const { unmount } = renderSettings();
    expect(barisNav('PIN')).toHaveTextContent('Belum diatur');
    unmount();

    localStorage.setItem('vault_pin', 'pin-terenkripsi-uji');
    renderSettings();
    expect(barisNav('PIN')).toHaveTextContent('Aktif');
    fireEvent.click(barisNav('PIN'));
    expect(screen.getByRole('dialog', { name: 'PIN' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog', { name: 'PIN' })).not.toBeInTheDocument();
  });

  it('tanpa dukungan WebAuthn baris Sidik jari TIDAK tampil sama sekali', () => {
    setWebAuthn(false);
    renderSettings();
    expect(screen.queryByRole('button', { name: /^Sidik jari/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /biometrik/i })).not.toBeInTheDocument();
  });

  it('WebAuthn ada tapi belum terdaftar: nilai "Belum didaftarkan", lencana "Biometrik belum"', () => {
    setWebAuthn(true);
    renderSettings();
    expect(barisNav('Sidik jari')).toHaveTextContent('Belum didaftarkan');
    expect(screen.getByText('Biometrik belum')).toBeInTheDocument();
  });

  it('sidik jari terdaftar: muncul saklar + baris "Hapus registrasi"; saklar mengubah store dan vault_bio_enabled', () => {
    setWebAuthn(true);
    localStorage.setItem('vault_bio_cred', 'cred-uji');
    renderSettings();
    expect(screen.getByText('Biometrik mati')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'Aktifkan biometrik' }));
    expect(useAppStore.getState().biometricEnabled).toBe(true);
    expect(localStorage.getItem('vault_bio_enabled')).toBe('true');
    expect(screen.getByRole('switch', { name: 'Nonaktifkan biometrik' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Biometrik aktif')).toBeInTheDocument();
  });

  it('hapus registrasi: dialog konfirmasi — Batal tidak menghapus; konfirmasi menghapus kredensial dan mematikan biometrik', async () => {
    setWebAuthn(true);
    localStorage.setItem('vault_bio_cred', 'cred-uji');
    useAppStore.setState({ biometricEnabled: true, biometricCredId: 'cred-uji' });
    renderSettings();

    fireEvent.click(barisNav('Hapus registrasi sidik jari'));
    let dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Hapus Registrasi Biometrik?')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByText('Batal'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('vault_bio_cred')).toBe('cred-uji');

    fireEvent.click(barisNav('Hapus registrasi sidik jari'));
    dialog = screen.getByRole('alertdialog');
    fireEvent.click(within(dialog).getByText('Hapus Registrasi'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('vault_bio_cred')).toBeNull();
    expect(useAppStore.getState().biometricEnabled).toBe(false);
    expect(useAppStore.getState().biometricCredId).toBeNull();
    expect(barisNav('Sidik jari')).toHaveTextContent('Belum didaftarkan');
  });

  it('Kesehatan password tetap berfungsi penuh di lokasi barunya: sheet merender HealthCheckPanel dari isi vault', () => {
    useAppStore.setState({ vault: [{ id: '1', cat: 'sosmed', name: 'Test', pass: '123' }] });
    renderSettings();
    expect(barisNav('Kesehatan password')).toHaveTextContent('1 entri');

    fireEvent.click(barisNav('Kesehatan password'));
    const sheet = screen.getByRole('dialog', { name: 'Kesehatan password' });
    // teks ini dirender HealthCheckPanel sendiri (bukan baris Pengaturan): membuktikan isinya benar-benar dihitung
    // dari vault. (v1.11.0: "1 entri diperiksa" adalah deskripsi BARIS; di v2 nilai baris = "1 entri".)
    expect(within(sheet).getByText('1 entri dipindai')).toBeInTheDocument();
  });
});

describe('SettingsView — Tentang: Atribusi & lisensi (Tahap 5, D3)', () => {
  it('kelompok Tentang berisi tepat SATU baris: tombol navigasi "Atribusi & lisensi" (bukan saklar)', () => {
    renderSettings();
    const t = within(kelompok('Tentang'));
    expect(t.getAllByRole('button')).toHaveLength(1);
    expect(t.getByRole('button', { name: /^Atribusi & lisensi/ })).toBeInTheDocument();
    expect(t.getByText('Sumber logo dan lisensi aplikasi')).toBeInTheDocument();
    expect(t.queryAllByRole('switch')).toHaveLength(0);
  });

  it('Tentang berada paling akhir: setelah Data & cadangan dan sebelum footer versi', () => {
    renderSettings();
    const data = kelompok('Data & cadangan');
    const tentang = kelompok('Tentang');
    const footer = screen.getByText(new RegExp(`^${APP_NAME} v${APP_VERSION.replace(/\./g, '\\.')} ·`));
    expect(data.compareDocumentPosition(tentang) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tentang.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('mengetuk membuka sheet berisi versi, lisensi aplikasi, dan enam sumber logo; tombol Tutup menutupnya', () => {
    renderSettings();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(barisNav('Atribusi & lisensi'));
    const dialog = screen.getByRole('dialog', { name: 'Atribusi & lisensi' });
    expect(within(dialog).getByText(`Versi ${APP_VERSION}`)).toBeInTheDocument();
    expect(within(dialog).getByText('Seluruh hak dilindungi.')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('heading', { level: 5 })).toHaveLength(6);
    fireEvent.click(within(dialog).getByRole('button', { name: /^Tutup/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // halaman Pengaturan tetap utuh setelah sheet ditutup
    expect(screen.getByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument();
  });

  it('Escape menutup sheet Atribusi', () => {
    renderSettings();
    fireEvent.click(barisNav('Atribusi & lisensi'));
    expect(screen.getByRole('dialog', { name: 'Atribusi & lisensi' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('membuka dan menutup TIDAK menulis kunci penyimpanan apa pun (localStorage dan sessionStorage identik)', () => {
    localStorage.setItem('vault_autolock', '5');
    const sebelumLocal = JSON.stringify(Object.entries(localStorage).sort());
    const sebelumSession = JSON.stringify(Object.entries(sessionStorage).sort());
    renderSettings();
    fireEvent.click(barisNav('Atribusi & lisensi'));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Atribusi & lisensi' })).getByRole('button', { name: /^Tutup/ }));
    expect(JSON.stringify(Object.entries(localStorage).sort())).toBe(sebelumLocal);
    expect(JSON.stringify(Object.entries(sessionStorage).sort())).toBe(sebelumSession);
  });
});

describe('SettingsView — tombol kembali', () => {
  it('ada hanya bila onClose diberikan, dan memanggilnya', () => {
    const { unmount } = renderSettings();
    expect(screen.queryByRole('button', { name: 'Kembali ke vault' })).not.toBeInTheDocument();
    unmount();

    const onClose = vi.fn();
    renderSettings({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Kembali ke vault' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
