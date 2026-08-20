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

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntryForm } from '../EntryForm';
import { useAppStore } from '@/lib/store/appStore';

beforeEach(() => {
  // Reset store ke kondisi minimal yang valid — EntryForm langganan
  // penuh ke useAppStore(), customCats perlu array valid untuk allCats.
  useAppStore.setState({ customCats: [] });
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
