/**
 * components/entries/__tests__/EntryForm.test.tsx — Vault Next
 *
 * v1.7.0: README v1.6.2/v1.6.3 mengklaim toggle mata password sudah
 * "diverifikasi via test: elemen DOM node input terbukti identik (toBe,
 * bukan toEqual) sebelum dan sesudah toggle" — tapi audit Aug 2026
 * menemukan TIDAK ADA file .test.tsx sama sekali di proyek ini saat itu.
 * Klaim itu tidak berdasar. Test ini menutup celahnya secara nyata:
 * membuktikan klaim yang sama, kali ini dengan test yang benar-benar ada.
 *
 * Yang diverifikasi (sesuai root cause di changelog v1.6.1-v1.6.3):
 * 1. Elemen <input> adalah DOM node yang SAMA (===) sebelum/sesudah
 *    toggle — bukan sekadar "isinya sama" (toEqual) — membuktikan
 *    tidak ada remount, hanya perubahan className.
 * 2. type atribut input SELALU 'text', tidak pernah 'password' — root
 *    cause asli yang dikonfirmasi MDN (fix v1.6.2).
 * 3. Fokus TIDAK hilang dari input saat toggle diklik saat sedang aktif
 *    fokus di situ — memverifikasi onMouseDown preventDefault (fix v1.6.3).
 * 4. Value yang sedang diketik tidak berubah/hilang akibat toggle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EntryForm } from '../EntryForm';
import { useAppStore } from '@/lib/store/appStore';

beforeEach(() => {
  // Reset store ke kondisi minimal yang valid — EntryForm langganan
  // penuh ke useAppStore(), customCats perlu array valid untuk allCats.
  // v1.10.3: customNetworks juga direset — tanpa ini, jaringan custom
  // yang ditambahkan di satu test (mis. lewat "+ Tambah jaringan baru")
  // bisa bocor dan muncul di dropdown test lain yang berjalan setelahnya.
  useAppStore.setState({ customCats: [], customNetworks: [] });
});

describe('EntryForm — toggle masking password (v1.7.0: klaim README dibuktikan)', () => {
  it('elemen input adalah DOM node yang SAMA (toBe) sebelum dan sesudah toggle — tidak ada remount', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);

    // Kategori default 'sosmed' punya field Password (lihat FIELDS_BY_CAT)
    const inputSebelum = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.click(screen.getByLabelText('Tampilkan Password'));

    const inputSesudah = screen.getByLabelText('Password') as HTMLInputElement;

    // toBe (identitas referensi), BUKAN toEqual (kesamaan isi) — inilah
    // klaim spesifik yang sebelumnya tidak punya test sama sekali.
    expect(inputSesudah).toBe(inputSebelum);
  });

  it('type atribut SELALU text, tidak pernah password, di kedua state toggle', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('text'); // state tersembunyi (default)

    fireEvent.click(screen.getByLabelText('Tampilkan Password'));
    expect(input.type).toBe('text'); // state terlihat — tetap 'text'

    fireEvent.click(screen.getByLabelText('Sembunyikan Password'));
    expect(input.type).toBe('text'); // kembali tersembunyi — tetap 'text'
  });

  it('masking dikendalikan className form-pw-input--masked, bukan type', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.className).toContain('form-pw-input--masked'); // default tersembunyi

    fireEvent.click(screen.getByLabelText('Tampilkan Password'));
    expect(input.className).not.toContain('form-pw-input--masked'); // terlihat
  });

  it('fokus tidak hilang dari input saat tombol toggle diklik sambil input sedang fokus', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    // mousedown lebih dulu (browser sungguhan memicu ini sebelum click),
    // ini yang diblok oleh onMouseDown={(e) => e.preventDefault()}
    fireEvent.mouseDown(screen.getByLabelText('Tampilkan Password'));
    fireEvent.click(screen.getByLabelText('Tampilkan Password'));

    // Fokus harus tetap di input, bukan berpindah ke tombol toggle
    expect(document.activeElement).toBe(input);
  });

  it('value yang sedang diketik tidak hilang/berubah akibat toggle', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'passwordSedangDiketik123' } });
    expect(input.value).toBe('passwordSedangDiketik123');

    fireEvent.click(screen.getByLabelText('Tampilkan Password'));

    expect(input.value).toBe('passwordSedangDiketik123');
  });
});

/**
 * v1.10.0: Verifikasi 2 Langkah (kategori Email) — field baru:
 * twoFAEnabled, twoFAPhone, twoFARecoveryEmail, twoFABackupCodes.
 * Kode cadangan memakai pola input identik dengan seed phrase crypto
 * (grid per-item bernomor / mode teks satu blok), beda hanya jumlah
 * tetap 10 tanpa opsi ganti-panjang.
 */
describe('EntryForm — Verifikasi 2 Langkah kategori Email (v1.10.0)', () => {
  it('section Verifikasi 2 Langkah TIDAK muncul untuk kategori default (sosmed)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    expect(screen.queryByText('Verifikasi 2 Langkah')).not.toBeInTheDocument();
  });

  it('section Verifikasi 2 Langkah muncul setelah pindah ke kategori Email', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(screen.getByText('Verifikasi 2 Langkah')).toBeInTheDocument();
  });

  it('field pemulihan & kode cadangan tersembunyi sampai toggle 2FA diaktifkan', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));

    expect(screen.queryByLabelText('Nomor Telepon Pemulihan')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Email Pemulihan')).not.toBeInTheDocument();
    expect(screen.queryByText(/Kode Cadangan/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    expect(screen.getByLabelText('Nomor Telepon Pemulihan')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Pemulihan')).toBeInTheDocument();
    expect(screen.getByText('Kode Cadangan (10 kode)')).toBeInTheDocument();
  });

  it('mode grid kode cadangan menampilkan tepat 10 kotak input bernomor 1–10', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByPlaceholderText(`kode ${i}`)).toBeInTheDocument();
    }
    // Tidak boleh ada kotak ke-11 — jumlahnya tetap 10, bukan dinamis
    // seperti seed phrase 12/24.
    expect(screen.queryByPlaceholderText('kode 11')).not.toBeInTheDocument();
  });

  it('mengetik di kotak kode cadangan ke-1 hanya mengubah kotak itu, bukan kotak lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    const kode1 = screen.getByPlaceholderText('kode 1') as HTMLInputElement;
    const kode2 = screen.getByPlaceholderText('kode 2') as HTMLInputElement;
    fireEvent.change(kode1, { target: { value: 'ABCD-1234' } });

    expect(kode1.value).toBe('ABCD-1234');
    expect(kode2.value).toBe('');
  });

  it('beralih ke mode Teks lalu kembali ke Per Kode mempertahankan isi kode', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    fireEvent.change(screen.getByPlaceholderText('kode 1'), { target: { value: 'KODE-SATU' } });
    fireEvent.change(screen.getByPlaceholderText('kode 2'), { target: { value: 'KODE-DUA' } });

    fireEvent.click(screen.getByText('Teks'));
    const textarea = screen.getByPlaceholderText(/^kode1/) as HTMLTextAreaElement;
    expect(textarea.value).toBe('KODE-SATU\nKODE-DUA');

    fireEvent.click(screen.getByText('Per Kode'));
    expect((screen.getByPlaceholderText('kode 1') as HTMLInputElement).value).toBe('KODE-SATU');
    expect((screen.getByPlaceholderText('kode 2') as HTMLInputElement).value).toBe('KODE-DUA');
  });

  it('mengetik di mode Teks lalu blur mem-parsing ke kode-kode terpisah (pemisah baris ATAU spasi)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    fireEvent.click(screen.getByText('Teks'));

    const textarea = screen.getByPlaceholderText(/^kode1/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'kodeA kodeB\nkodeC' } });
    fireEvent.blur(textarea);

    fireEvent.click(screen.getByText('Per Kode'));
    expect((screen.getByPlaceholderText('kode 1') as HTMLInputElement).value).toBe('kodeA');
    expect((screen.getByPlaceholderText('kode 2') as HTMLInputElement).value).toBe('kodeB');
    expect((screen.getByPlaceholderText('kode 3') as HTMLInputElement).value).toBe('kodeC');
  });

  it('mematikan toggle menyembunyikan field pemulihan & kode cadangan lagi', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    expect(screen.getByLabelText('Nomor Telepon Pemulihan')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    expect(screen.queryByLabelText('Nomor Telepon Pemulihan')).not.toBeInTheDocument();
  });

  it('pindah dari Email ke kategori lain lalu balik ke Email mereset toggle & kode (tidak menempel)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    fireEvent.change(screen.getByPlaceholderText('kode 1'), { target: { value: 'AKAN-HILANG' } });

    // Kode cadangan yang sudah diisi membuat hasFilledFields() true, jadi
    // ganti kategori memicu dialog konfirmasi "Ganti Kategori?" — perlu
    // dikonfirmasi dulu sebelum doCatChange benar-benar berjalan.
    fireEvent.click(screen.getByTitle('Sosmed'));
    fireEvent.click(screen.getByText('Ganti Kategori'));
    fireEvent.click(screen.getByTitle('Email'));

    expect(screen.queryByLabelText('Nomor Telepon Pemulihan')).not.toBeInTheDocument();
  });

  it('kategori Email TIDAK menampilkan section Seed Phrase (khusus crypto)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(screen.queryByText(/Seed Phrase/)).not.toBeInTheDocument();
  });
});

/**
 * v1.10.1: BUG FIX + fitur — dropdown tipe field editor sebelumnya
 * <select> native rusak visual di WebView Android (dilaporkan pengguna
 * via screenshot). Sekalian ditambahkan tipe field baru "multi" —
 * grid multi-isian bernomor ATAU mode teks satu blok, TERSEDIA untuk
 * field kustom kategori APA PUN (bukan hardcode ke 2FA Email seperti
 * kode cadangan di Bagian 1) — permintaan eksplisit pengguna: "saya
 * kira bisa tambah 10 isian seperti crypto yang 12/24 seed itu".
 * Test dropdown-nya sendiri ada di CategoryManager.test.tsx (mengedit
 * definisi field); test di sini fokus ke RENDERING field multi di form
 * entri, memakai kategori custom dummy yang field-nya sudah diset
 * bertipe multi lewat store (mensimulasikan hasil dari field editor).
 */
describe('EntryForm — Field kustom tipe "multi" (v1.10.1)', () => {
  const dummyCatWithMultiField = {
    id: 'cat_toko',
    label: 'Toko',
    emoji: 'Tag',
    iconKey: 'Tag',
    fields: [
      { key: 'user', label: 'Nama Toko' },
      { key: 'custom_kode_akses', label: 'Kode Akses', type: 'multi' as const, multiCount: 5 },
    ],
  };

  beforeEach(() => {
    useAppStore.setState({ customCats: [dummyCatWithMultiField] });
  });

  it('field bertipe multi muncul dengan label dan jumlah isian yang benar', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));

    expect(screen.getByText('Kode Akses (5 isian)')).toBeInTheDocument();
  });

  it('mode grid menampilkan tepat sejumlah multiCount kotak input, bukan 10 default', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByPlaceholderText(`isian ${i}`)).toBeInTheDocument();
    }
    // multiCount 5, BUKAN 10 (default BACKUP_CODE_COUNT dari fitur 2FA
    // Bagian 1) — memverifikasi jumlah isian benar-benar dari
    // konfigurasi field kustom itu sendiri, bukan angka hardcode lain.
    expect(screen.queryByPlaceholderText('isian 6')).not.toBeInTheDocument();
  });

  it('mengetik di satu kotak hanya mengubah kotak itu, tidak memengaruhi kotak lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));

    const isian1 = screen.getByPlaceholderText('isian 1') as HTMLInputElement;
    const isian2 = screen.getByPlaceholderText('isian 2') as HTMLInputElement;
    fireEvent.change(isian1, { target: { value: 'KODE-A' } });

    expect(isian1.value).toBe('KODE-A');
    expect(isian2.value).toBe('');
  });

  it('beralih ke mode Teks lalu kembali ke Per Isian mempertahankan isi', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));

    fireEvent.change(screen.getByPlaceholderText('isian 1'), { target: { value: 'SATU' } });
    fireEvent.change(screen.getByPlaceholderText('isian 2'), { target: { value: 'DUA' } });

    fireEvent.click(screen.getByText('Teks'));
    const textarea = screen.getByPlaceholderText(/^isian1/) as HTMLTextAreaElement;
    expect(textarea.value).toBe('SATU\nDUA');

    fireEvent.click(screen.getByText('Per Isian'));
    expect((screen.getByPlaceholderText('isian 1') as HTMLInputElement).value).toBe('SATU');
    expect((screen.getByPlaceholderText('isian 2') as HTMLInputElement).value).toBe('DUA');
  });

  it('mengetik di mode Teks lalu blur mem-parsing ke isian terpisah (pemisah baris ATAU spasi)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));
    fireEvent.click(screen.getByText('Teks'));

    const textarea = screen.getByPlaceholderText(/^isian1/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'ax by\ncz' } });
    fireEvent.blur(textarea);

    fireEvent.click(screen.getByText('Per Isian'));
    expect((screen.getByPlaceholderText('isian 1') as HTMLInputElement).value).toBe('ax');
    expect((screen.getByPlaceholderText('isian 2') as HTMLInputElement).value).toBe('by');
    expect((screen.getByPlaceholderText('isian 3') as HTMLInputElement).value).toBe('cz');
  });

  it('field multi milik kategori LAIN tidak menempel — pindah kategori mereset field multi', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Toko'));
    fireEvent.change(screen.getByPlaceholderText('isian 1'), { target: { value: 'AKAN-HILANG' } });

    fireEvent.click(screen.getByTitle('Sosmed'));
    fireEvent.click(screen.getByText('Ganti Kategori'));
    fireEvent.click(screen.getByTitle('Toko'));

    expect((screen.getByPlaceholderText('isian 1') as HTMLInputElement).value).toBe('');
  });
});

/**
 * v1.10.2: permintaan pengguna — perluas Verifikasi 2 Langkah dengan 5
 * opsi baru (video selfie, kunci sandi & kunci keamanan, authenticator
 * app, perintah Google + perangkat, nomor telepon verifikasi 2 langkah
 * terpisah dari nomor pemulihan). Ketiga toggle baru dibangun sebagai
 * state React terpisah (pola sama twoFAEnabled), bukan lewat
 * values/setField yang bertipe string.
 */
describe('EntryForm — Perluasan Verifikasi 2 Langkah, 5 opsi baru (v1.10.2)', () => {
  it('kelima opsi baru muncul setelah toggle Verifikasi 2 Langkah diaktifkan', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    expect(screen.getByLabelText('Video Selfie')).toBeInTheDocument();
    expect(screen.getByLabelText('Kunci Sandi & Kunci Keamanan')).toBeInTheDocument();
    expect(screen.getByLabelText('Authenticator App')).toBeInTheDocument();
    expect(screen.getByLabelText('Perintah Google')).toBeInTheDocument();
    expect(screen.getByLabelText('Nomor Telepon Verifikasi 2 Langkah')).toBeInTheDocument();
  });

  it('nomor telepon verifikasi 2 langkah (opsi 5) TERPISAH dari nomor telepon pemulihan — mengisi satu tidak mengisi yang lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    const pemulihan = screen.getByLabelText('Nomor Telepon Pemulihan') as HTMLInputElement;
    const verifikasi = screen.getByLabelText('Nomor Telepon Verifikasi 2 Langkah') as HTMLInputElement;
    fireEvent.change(verifikasi, { target: { value: '+62811111111' } });

    expect(verifikasi.value).toBe('+62811111111');
    expect(pemulihan.value).toBe('');
  });

  /**
   * v1.10.3: bug fix — Toggle.tsx sebelumnya taruh `label` HANYA di
   * aria-label, tidak pernah dirender sebagai teks di layar. Ketiga
   * toggle ini tampil polos tanpa keterangan (dilaporkan pengguna via
   * screenshot). getByLabelText di atas hanya mencocokkan aria-label —
   * TIDAK cukup untuk menangkap bug ini, karena aria-label memang
   * sudah benar sejak awal; yang hilang adalah teks visual di DOM.
   * Test ini query teks literal via getByText untuk memverifikasi
   * label benar-benar ada sebagai node visual, bukan cuma atribut a11y.
   */
  it('label Video Selfie, Authenticator App, dan Perintah Google tampil sebagai teks visual (bukan cuma aria-label)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    expect(screen.getByText('Video Selfie')).toBeInTheDocument();
    expect(screen.getByText('Authenticator App')).toBeInTheDocument();
    expect(screen.getByText('Perintah Google')).toBeInTheDocument();
  });

  it('toggle Video Selfie, Authenticator App, dan Perintah Google independen satu sama lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    fireEvent.click(screen.getByLabelText('Video Selfie'));

    expect(screen.getByLabelText('Video Selfie')).toBeChecked();
    expect(screen.getByLabelText('Authenticator App')).not.toBeChecked();
    expect(screen.getByLabelText('Perintah Google')).not.toBeChecked();
  });

  it('field Merk & Tipe HP TIDAK muncul sebelum toggle Perintah Google diaktifkan', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    expect(screen.queryByPlaceholderText(/Merk & tipe HP/)).not.toBeInTheDocument();
  });

  it('mengaktifkan toggle Perintah Google menampilkan field Merk & Tipe HP', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    fireEvent.click(screen.getByLabelText('Perintah Google'));

    expect(screen.getByPlaceholderText(/Merk & tipe HP/)).toBeInTheDocument();
  });

  it('mematikan toggle Perintah Google menyembunyikan field Merk & Tipe HP lagi', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    fireEvent.click(screen.getByLabelText('Perintah Google'));
    fireEvent.change(screen.getByPlaceholderText(/Merk & tipe HP/), { target: { value: 'Samsung Galaxy S24' } });

    fireEvent.click(screen.getByLabelText('Perintah Google'));

    expect(screen.queryByPlaceholderText(/Merk & tipe HP/)).not.toBeInTheDocument();
  });

  it('mengetik di Kunci Sandi & Kunci Keamanan tidak memengaruhi field 2FA lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    const kunciKeamanan = screen.getByLabelText('Kunci Sandi & Kunci Keamanan') as HTMLInputElement;
    fireEvent.change(kunciKeamanan, { target: { value: 'YubiKey 5C' } });

    expect(kunciKeamanan.value).toBe('YubiKey 5C');
    expect((screen.getByLabelText('Email Pemulihan') as HTMLInputElement).value).toBe('');
  });

  it('pindah kategori dari Email lalu balik lagi mereset ketiga toggle baru (tidak menempel)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));
    fireEvent.click(screen.getByLabelText('Video Selfie'));
    fireEvent.click(screen.getByLabelText('Authenticator App'));

    fireEvent.click(screen.getByTitle('Sosmed'));
    fireEvent.click(screen.getByTitle('Email'));
    fireEvent.click(screen.getByLabelText('Verifikasi 2 Langkah'));

    expect(screen.getByLabelText('Video Selfie')).not.toBeChecked();
    expect(screen.getByLabelText('Authenticator App')).not.toBeChecked();
  });
});

/**
 * v1.10.2: permintaan pengguna — pisahkan Username dari No. Rekening
 * di kategori Bank default (sebelumnya digabung satu field berlabel
 * "Username / No. Rekening").
 */
describe('EntryForm — Kategori Bank: Username & No. Rekening terpisah (v1.10.2)', () => {
  it('field "Username" dan "No. Rekening" muncul sebagai dua field terpisah, bukan gabungan', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Bank'));

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('No. Rekening')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Username \/ No\. Rekening/)).not.toBeInTheDocument();
  });

  it('mengisi Username tidak memengaruhi No. Rekening, dan sebaliknya', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Bank'));

    const username = screen.getByLabelText('Username') as HTMLInputElement;
    const noRek = screen.getByLabelText('No. Rekening') as HTMLInputElement;
    fireEvent.change(username, { target: { value: 'budi123' } });

    expect(username.value).toBe('budi123');
    expect(noRek.value).toBe('');

    fireEvent.change(noRek, { target: { value: '1234567890' } });
    expect(username.value).toBe('budi123'); // tetap tidak berubah
    expect(noRek.value).toBe('1234567890');
  });
});

/**
 * v1.10.3: Crypto — multi-jaringan, multi-alamat per jaringan. MURNI
 * TAMBAHAN, terpisah dari network/walletAddr/walletPw lama (field itu
 * tetap dirender lewat currentFields.map(renderField) seperti biasa —
 * tidak diuji ulang di sini, sudah dicakup test dynamicFields yang ada).
 *
 * Dua bug ditemukan lewat pengujian save SUNGGUHAN (bukan review kode)
 * saat test file ini pertama ditulis, dan sudah diperbaiki sebelum test
 * ini ditulis:
 * 1. hasFilledFields() tidak memeriksa walletNetworks — mengisi alamat
 *    wallet tanpa field lain dianggap "form kosong", memicu dialog
 *    konfirmasi "Simpan Entri Tanpa Data?" alih-alih langsung save.
 * 2. doCatChange() tidak me-reset walletNetworks — data menempel saat
 *    pindah kategori lalu balik lagi ke Crypto.
 * Test grup terakhir di bawah ("data loss") secara eksplisit memverifikasi
 * kedua fix ini tidak regresi, direproduksi ulang & dikonfirmasi gagal
 * dulu sebelum fix ditambahkan — sama seperti pola verifikasi negatif
 * yang dipakai di seluruh proyek ini.
 */
describe('EntryForm — Crypto: multi-jaringan, multi-alamat per jaringan (v1.10.3)', () => {
  beforeEach(() => {
    useAppStore.setState({ customCats: [], customNetworks: [] });
  });

  it('kategori Crypto TIDAK menampilkan section jaringan sama sekali untuk kategori lain', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Email'));
    expect(screen.queryByText('Jaringan & Alamat Wallet')).not.toBeInTheDocument();
  });

  it('awalnya tidak ada kartu jaringan sama sekali (entri baru)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    expect(screen.getByText('Jaringan & Alamat Wallet')).toBeInTheDocument();
    expect(screen.queryByText('Pilih jaringan…')).not.toBeInTheDocument();
  });

  it('klik "Tambah Jaringan" menampilkan satu kartu jaringan baru dengan satu baris alamat kosong', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));

    expect(screen.getByText('Pilih jaringan…')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Alamat 1')).toBeInTheDocument();
  });

  it('klik "Tambah Jaringan" dua kali menampilkan dua kartu jaringan independen', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));

    expect(screen.getAllByText('Pilih jaringan…')).toHaveLength(2);
  });

  it('dropdown jaringan menampilkan 3 default (BTC, EVM, Solana) dan memilih salah satunya mengisi nama jaringan', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('EVM (ETH, BNB, dll)')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Solana'));
    expect(screen.getByText('Solana')).toBeInTheDocument(); // sekarang jadi label tombol, bukan lagi item menu
    expect(screen.queryByText('Pilih jaringan…')).not.toBeInTheDocument();
  });

  it('klik "+ Tambah Alamat" menambah baris alamat baru pada kartu jaringan yang sama', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));

    expect(screen.queryByPlaceholderText('Alamat 2')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Tambah Alamat'));
    expect(screen.getByPlaceholderText('Alamat 2')).toBeInTheDocument();
  });

  it('mengisi alamat pertama tidak memengaruhi alamat kedua, dan sebaliknya', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Tambah Alamat'));

    const addr1 = screen.getByPlaceholderText('Alamat 1') as HTMLInputElement;
    const addr2 = screen.getByPlaceholderText('Alamat 2') as HTMLInputElement;
    fireEvent.change(addr1, { target: { value: 'addr-satu' } });

    expect(addr1.value).toBe('addr-satu');
    expect(addr2.value).toBe('');

    fireEvent.change(addr2, { target: { value: 'addr-dua' } });
    expect(addr1.value).toBe('addr-satu'); // tetap tidak berubah
    expect(addr2.value).toBe('addr-dua');
  });

  it('tombol hapus alamat TIDAK muncul saat hanya ada satu alamat (mencegah kartu jaringan tanpa baris alamat sama sekali)', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));

    expect(screen.queryByLabelText('Hapus alamat 1')).not.toBeInTheDocument();
  });

  it('tombol hapus alamat muncul dan berfungsi saat ada lebih dari satu alamat', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Tambah Alamat'));
    fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'addr-satu' } });
    fireEvent.change(screen.getByPlaceholderText('Alamat 2'), { target: { value: 'addr-dua' } });

    fireEvent.click(screen.getByLabelText('Hapus alamat 1'));

    // Alamat "addr-dua" yang tersisa sekarang jadi satu-satunya baris,
    // dan harus berada di posisi "Alamat 1" (bukan tetap di "Alamat 2"
    // yang sudah tidak ada lagi setelah baris pertama dihapus).
    expect(screen.getByPlaceholderText('Alamat 1')).toHaveValue('addr-dua');
    expect(screen.queryByPlaceholderText('Alamat 2')).not.toBeInTheDocument();
  });

  it('klik tombol hapus jaringan pada kartu menghapus kartu itu saja, kartu jaringan lain tidak terpengaruh', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));
    fireEvent.click(screen.getByText('BTC'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));
    fireEvent.click(screen.getByText('Solana'));

    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Hapus jaringan BTC'));

    expect(screen.queryByText('BTC')).not.toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();
  });

  it('menambah jaringan custom baru via "+ Tambah jaringan baru" tersimpan ke store dan muncul di dropdown entri Crypto lain berikutnya', () => {
    const { unmount } = render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));
    fireEvent.click(screen.getByText('Tambah jaringan baru'));

    const input = screen.getByPlaceholderText('Nama jaringan baru, mis. Base, Arbitrum…');
    fireEvent.change(input, { target: { value: 'Base' } });
    fireEvent.blur(input);

    // Nama baru langsung terpakai di baris ini
    expect(screen.getByText('Base')).toBeInTheDocument();
    // DAN tersimpan ke store — bukan hanya lokal ke form ini
    expect(useAppStore.getState().customNetworks.some((n) => n.label === 'Base')).toBe(true);

    unmount();

    // Render form BARU (entri Crypto lain) — "Base" harus sudah muncul
    // di dropdown tanpa perlu ditambahkan ulang.
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));
    expect(screen.getByText('Base')).toBeInTheDocument();
  });

  it('menambah nama jaringan yang sudah ada (case-insensitive) TIDAK membuat duplikat di store', () => {
    render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
    fireEvent.click(screen.getByTitle('Crypto'));
    fireEvent.click(screen.getByText('Tambah Jaringan'));
    fireEvent.click(screen.getByText('Pilih jaringan…'));
    fireEvent.click(screen.getByText('Tambah jaringan baru'));

    const input = screen.getByPlaceholderText('Nama jaringan baru, mis. Base, Arbitrum…');
    fireEvent.change(input, { target: { value: 'btc' } }); // huruf kecil, "BTC" sudah ada sbg default
    fireEvent.blur(input);

    // Dipakai label yang sudah ada apa adanya ("BTC"), bukan "btc" baru
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.queryByText('btc')).not.toBeInTheDocument();
    // TIDAK ditambahkan ke customNetworks — "BTC" adalah default bawaan,
    // bukan custom.
    expect(useAppStore.getState().customNetworks).toHaveLength(0);
  });

  /**
   * Test save sungguhan — masterPw & vaultMeta perlu diisi valid karena
   * doSave() memanggil saveVault() (lib/vaultService.ts) yang sungguhan
   * menjalankan encrypt() (Web Crypto API, PBKDF2). Ini BUKAN mock —
   * dikonfirmasi cepat (~150-500ms) saat ditulis, jadi aman dijalankan
   * di test tanpa memperlambat suite secara berarti.
   */
  describe('payload save', () => {
    beforeEach(() => {
      useAppStore.setState({
        customCats: [], customNetworks: [],
        masterPw: 'test-master-pw-untuk-suite-ini',
        vaultMeta: { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' },
        vault: [], recycleBin: [],
      });
    });

    it('walletNetworks TIDAK disertakan sama sekali di payload saat tidak ada jaringan diisi', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Wallet Kosong' } });
      // Isi field lama (network) supaya hasFilledFields() true tanpa
      // perlu walletNetworks — memverifikasi walletNetworks murni
      // opsional, tidak wajib ada untuk bisa save.
      fireEvent.change(screen.getByLabelText('Jaringan (Network)'), { target: { value: 'Ethereum' } });
      fireEvent.click(screen.getByText('Tambah Entri'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const saved = onSaved.mock.calls[0][0];
      expect(saved.walletNetworks).toBeUndefined();
      expect(saved.network).toBe('Ethereum'); // field lama tetap tersimpan normal
    });

    it('baris alamat kosong dibuang dari payload saat save (hanya alamat terisi yang tersimpan)', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Wallet Solana' } });
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.click(screen.getByText('Pilih jaringan…'));
      fireEvent.click(screen.getByText('Solana'));
      fireEvent.click(screen.getByText('Tambah Alamat')); // baris kedua, sengaja dibiarkan kosong
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'sol-addr-1' } });
      fireEvent.click(screen.getByText('Tambah Entri'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const saved = onSaved.mock.calls[0][0];
      expect(saved.walletNetworks).toEqual([
        expect.objectContaining({ network: 'Solana', addresses: ['sol-addr-1'] }),
      ]);
    });

    it('jaringan yang semua alamatnya kosong dibuang seluruhnya dari payload (tidak menyisakan kartu kosong)', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Wallet Campuran' } });
      // Jaringan pertama: diisi
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.click(screen.getByText('Pilih jaringan…'));
      fireEvent.click(screen.getByText('BTC'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'btc-addr' } });
      // Jaringan kedua: dipilih tapi alamat dibiarkan kosong (mis.
      // pengguna klik "+ Tambah Jaringan" lalu berubah pikiran)
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.click(screen.getByText('Pilih jaringan…'));
      fireEvent.click(screen.getByText('Solana'));

      fireEvent.click(screen.getByText('Tambah Entri'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const saved = onSaved.mock.calls[0][0];
      expect(saved.walletNetworks).toHaveLength(1);
      expect(saved.walletNetworks[0].network).toBe('BTC');
    });

    it('bisa save dengan LEBIH DARI SATU alamat pada jaringan yang SAMA (satu seed, beberapa alamat)', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Wallet Multi-Alamat' } });
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.click(screen.getByText('Pilih jaringan…'));
      fireEvent.click(screen.getByText('Solana'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'sol-addr-1' } });
      fireEvent.click(screen.getByText('Tambah Alamat'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 2'), { target: { value: 'sol-addr-2' } });
      fireEvent.click(screen.getByText('Tambah Entri'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const saved = onSaved.mock.calls[0][0];
      expect(saved.walletNetworks).toHaveLength(1);
      expect(saved.walletNetworks[0].addresses).toEqual(['sol-addr-1', 'sol-addr-2']);
    });

    it('field lama network/walletAddr/walletPw TETAP tersimpan normal bersamaan dengan walletNetworks baru, tidak saling menimpa', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Wallet Campuran Lama Baru' } });
      fireEvent.change(screen.getByLabelText('Jaringan (Network)'), { target: { value: 'Ethereum Lama' } });
      fireEvent.change(screen.getByLabelText('Alamat Wallet'), { target: { value: '0xLamaAlamat' } });
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.click(screen.getByText('Pilih jaringan…'));
      fireEvent.click(screen.getByText('Solana'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'sol-addr-baru' } });
      fireEvent.click(screen.getByText('Tambah Entri'));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      const saved = onSaved.mock.calls[0][0];
      expect(saved.network).toBe('Ethereum Lama');
      expect(saved.walletAddr).toBe('0xLamaAlamat');
      expect(saved.walletNetworks).toEqual([
        expect.objectContaining({ network: 'Solana', addresses: ['sol-addr-baru'] }),
      ]);
    });
  });

  /**
   * Verifikasi negatif untuk 2 bug data-loss yang ditemukan saat test
   * ini pertama ditulis (lihat komentar di atas describe utama). Kedua
   * test ini dibuktikan GAGAL saat fix-nya sengaja dihapus sementara,
   * sebelum ditulis final di sini — pola yang sama dipakai konsisten
   * di seluruh proyek ini untuk setiap fix (lihat CLAUDE.md/README
   * changelog versi-versi sebelumnya).
   */
  describe('mencegah regresi data-loss', () => {
    beforeEach(() => {
      useAppStore.setState({
        customCats: [], customNetworks: [],
        masterPw: 'test-master-pw-untuk-suite-ini',
        vaultMeta: { hint: '', recoveryHash: '', recovery: '', encMasterBySeed: '' },
        vault: [], recycleBin: [],
      });
    });

    it('mengisi HANYA alamat wallet (tanpa field lain) langsung ter-save tanpa dialog konfirmasi "Simpan Entri Tanpa Data?"', async () => {
      const onSaved = vi.fn();
      render(<EntryForm onClose={() => {}} onSaved={onSaved} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.change(screen.getByLabelText(/^Nama/), { target: { value: 'Hanya Alamat' } });
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'addr-saja' } });
      fireEvent.click(screen.getByText('Tambah Entri'));

      // Dialog "Simpan Entri Tanpa Data?" TIDAK boleh muncul — kalau
      // hasFilledFields() regresi (lupa cek walletNetworks lagi), test
      // ini akan gagal di titik waitFor karena onSaved tidak pernah
      // terpanggil (form macet menunggu klik "Simpan Tetap" yang tidak
      // pernah dilakukan test ini secara sengaja).
      expect(screen.queryByText('Simpan Entri Tanpa Data?')).not.toBeInTheDocument();
      await waitFor(() => expect(onSaved).toHaveBeenCalled());
    });

    it('pindah dari Crypto ke kategori lain lalu balik lagi ke Crypto MENGOSONGKAN jaringan yang sudah diisi sebelumnya', async () => {
      render(<EntryForm onClose={() => {}} onSaved={() => {}} />);
      fireEvent.click(screen.getByTitle('Crypto'));
      fireEvent.click(screen.getByText('Tambah Jaringan'));
      fireEvent.change(screen.getByPlaceholderText('Alamat 1'), { target: { value: 'addr-yang-harus-hilang' } });

      // hasFilledFields() true (alamat terisi) → pindah kategori memicu
      // dialog konfirmasi "Ganti Kategori?" — perlu dikonfirmasi dulu.
      fireEvent.click(screen.getByTitle('Sosmed'));
      fireEvent.click(screen.getByText('Ganti Kategori'));
      // Tunggu dialog benar-benar selesai unmount sebelum lanjut — tanpa
      // ini, sisa render AnimatePresence dari dialog ini bisa membuat
      // getByText('Ganti Kategori') pada langkah berikutnya salah
      // menangkap elemen basi ini alih-alih dialog baru yang sungguhan
      // (ditemukan lewat debug logging saat test ini pertama ditulis —
      // doCatChange & hasFilledFields TERBUKTI benar lewat log manual,
      // kegagalan sebelumnya murni soal timing di test, bukan bug nyata).
      await waitFor(() => {
        expect(screen.queryByText('Simpan Entri Tanpa Data?')).not.toBeInTheDocument();
      });

      // Klik balik ke Crypto. Kalau doCatChange BENAR mereset
      // walletNetworks (fix bekerja), hasFilledFields() sudah false,
      // maka pindah kategori terjadi LANGSUNG tanpa dialog apa pun.
      fireEvent.click(screen.getByTitle('Crypto'));

      await waitFor(() => {
        expect(screen.getByText('Jaringan & Alamat Wallet')).toBeInTheDocument();
      });
      expect(screen.queryByText('Pilih jaringan…')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Alamat 1')).not.toBeInTheDocument();
    });
  });
});
