/**
 * components/lock/__tests__/SetupFlow.test.tsx — Aurum Vault v2.0.0 (Tahap 4)
 *
 * Pembuatan vault 4 langkah: Master Password → Petunjuk (opsional) → Recovery Phrase → Selesai.
 * Keputusan terkunci yang dijaga: recovery phrase = 5 kata Inggris acak OTOMATIS, WAJIB dicentang
 * "sudah dicatat", TIDAK bisa diketik/dibuat sendiri; frasa yang tampil = frasa yang dikirim ke
 * onComplete (jika berbeda, pengguna tidak akan pernah bisa memulihkan vault-nya).
 * Hash/enkripsi frasa TIDAK diuji di sini (tetap tanggung jawab dataCompat.test.ts).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SetupFlow } from '../SetupFlow';
import { WORDLIST } from '@/lib/wordlist';

const pwInput = () => screen.getByPlaceholderText('Master password…') as HTMLInputElement;
const confirmInput = () => screen.getByPlaceholderText('Konfirmasi password…') as HTMLInputElement;
const lanjut = () => fireEvent.click(screen.getByRole('button', { name: 'Lanjut' }));
const kata = () => screen.getAllByRole('listitem').map((li) => li.querySelector('.rp-word__val')?.textContent ?? '');

function isiPassword(pw = 'rahasia-uji', konfirmasi = pw) {
  fireEvent.change(pwInput(), { target: { value: pw } });
  fireEvent.change(confirmInput(), { target: { value: konfirmasi } });
}
/** Maju sampai langkah Recovery (langkah 3). */
function keRecovery(pw = 'rahasia-uji', hint = '') {
  isiPassword(pw);
  lanjut();
  if (hint) fireEvent.change(screen.getByPlaceholderText(/Contoh: nama hewan/), { target: { value: hint } });
  lanjut();
}
/** Maju sampai langkah Selesai (langkah 4), mencentang konfirmasi catatan. */
function keSelesai(pw = 'rahasia-uji', hint = '') {
  keRecovery(pw, hint);
  fireEvent.click(screen.getByRole('checkbox'));
  lanjut();
}

afterEach(() => { vi.restoreAllMocks(); });

describe('SetupFlow — langkah 1: Master Password', () => {
  it('tampil dengan 4 penanda langkah; "Lanjut" nonaktif sampai kedua kolom terisi', () => {
    const { container } = render(<SetupFlow onComplete={async () => {}} />);
    expect(screen.getByRole('heading', { name: 'Buat Master Password' })).toBeInTheDocument();
    expect(container.querySelectorAll('.setup-step__dot')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();

    fireEvent.change(pwInput(), { target: { value: 'abcdef' } });
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
    fireEvent.change(confirmInput(), { target: { value: 'abcdef' } });
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeEnabled();
  });

  it('password kurang dari 6 karakter ditolak dengan pesan, tidak berpindah langkah', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword('abcde');
    lanjut();
    expect(screen.getByText('Password minimal 6 karakter')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Buat Master Password' })).toBeInTheDocument();
  });

  it('tepat 6 karakter diterima', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword('abcdef');
    lanjut();
    expect(screen.getByRole('heading', { name: /Petunjuk Password/ })).toBeInTheDocument();
  });

  it('konfirmasi berbeda ditolak dengan pesan "Password tidak cocok"; mengetik lagi menghapus pesan', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword('abcdef', 'abcdeg');
    lanjut();
    expect(screen.getByText('Password tidak cocok')).toBeInTheDocument();
    fireEvent.change(confirmInput(), { target: { value: 'abcdef' } });
    expect(screen.queryByText('Password tidak cocok')).not.toBeInTheDocument();
  });

  it('menekan Enter di kolom konfirmasi sama dengan menekan Lanjut', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword('abcdef');
    fireEvent.keyDown(confirmInput(), { key: 'Enter' });
    expect(screen.getByRole('heading', { name: /Petunjuk Password/ })).toBeInTheDocument();
  });

  it('tombol mata menampilkan/menyembunyikan tiap kolom secara independen', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    expect(pwInput()).toHaveAttribute('type', 'password');
    expect(confirmInput()).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getAllByRole('button', { name: 'Tampilkan password' })[0]);
    expect(pwInput()).toHaveAttribute('type', 'text');
    expect(confirmInput()).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Sembunyikan password' })).toBeInTheDocument();
  });

  it('meter kekuatan hanya muncul setelah mengetik: 7 batang dan label sesuai skor', () => {
    const { container } = render(<SetupFlow onComplete={async () => {}} />);
    expect(container.querySelector('.setup-strength')).toBeNull();

    fireEvent.change(pwInput(), { target: { value: 'abc' } });
    expect(container.querySelectorAll('.setup-strength__bar')).toHaveLength(7);
    expect(screen.getByText('Lemah')).toBeInTheDocument();

    fireEvent.change(pwInput(), { target: { value: 'Abcdefgh1!xyzABC' } }); // 16 karakter, 4 tipe
    expect(screen.getByText('Tak Tertandingi')).toBeInTheDocument();
  });
});

describe('SetupFlow — langkah 2: Petunjuk (opsional)', () => {
  it('opsional: bisa dilewati tanpa mengisi; batas 100 karakter', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword();
    lanjut();
    expect(screen.getByText('(opsional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contoh: nama hewan/)).toHaveAttribute('maxLength', '100');
    lanjut();
    expect(screen.getByRole('heading', { name: 'Recovery Phrase' })).toBeInTheDocument();
  });

  it('"Kembali" ke langkah 1 mempertahankan password yang sudah diketik', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    isiPassword('rahasia-uji');
    lanjut();
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(pwInput().value).toBe('rahasia-uji');
    expect(confirmInput().value).toBe('rahasia-uji');
  });
});

describe('SetupFlow — langkah 3: Recovery Phrase 5 kata otomatis', () => {
  it('menampilkan tepat 5 kata bernomor 1–5, semuanya dari daftar 2048 kata', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    const daftar = kata();
    expect(daftar).toHaveLength(5);
    for (const k of daftar) expect(WORDLIST).toContain(k);
    expect(screen.getAllByRole('listitem').map((li) => li.querySelector('.rp-word__num')?.textContent)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('tidak ada kolom teks: frasa tidak bisa diketik/dibuat sendiri', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('"Lanjut" nonaktif sampai kotak "Saya sudah mencatat 5 kata ini" dicentang; centang dilepas → nonaktif lagi', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Saya sudah mencatat 5 kata ini/ }));
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeEnabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
  });

  it('"Buat ulang" menghasilkan frasa baru DAN melepas centang (frasa baru harus dicatat ulang)', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    fireEvent.click(screen.getByRole('checkbox'));
    const lama = kata().join(' ');

    // peluang frasa baru identik ≈ 2^-55 → anggap berbeda
    fireEvent.click(screen.getByRole('button', { name: /Buat ulang/ }));
    expect(kata().join(' ')).not.toBe(lama);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Lanjut' })).toBeDisabled();
  });

  it('bolak-balik antar langkah TIDAK mengganti frasa yang sudah dibuat', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    const awal = kata().join(' ');
    fireEvent.click(screen.getByRole('button', { name: 'Kembali' }));
    lanjut();
    expect(kata().join(' ')).toBe(awal);
  });

  it('"Salin" menulis kelima kata (dipisah spasi) ke clipboard dan menampilkan "Tersalin"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery();
    const frasa = kata().join(' ');

    fireEvent.click(screen.getByRole('button', { name: /Salin/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(frasa));
    await waitFor(() => expect(screen.getByRole('button', { name: /Tersalin/ })).toBeInTheDocument());
  });
});

describe('SetupFlow — langkah 4: Selesai', () => {
  it('ringkasan: password disamarkan sepanjang aslinya (min 6 titik), petunjuk, dan recovery TANPA menampilkan frasa', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keRecovery('abcdefgh', 'Nama kucing');
    const kelimaKata = kata(); // kata yang benar-benar tampil di langkah 3
    fireEvent.click(screen.getByRole('checkbox'));
    lanjut();

    const ringkasan = document.querySelector('.setup-summary') as HTMLElement;
    expect(within(ringkasan).getByText('•'.repeat(8))).toBeInTheDocument();
    expect(within(ringkasan).getByText('Nama kucing')).toBeInTheDocument();
    expect(within(ringkasan).getByText('5 kata (dibuat otomatis)')).toBeInTheDocument();
    // frasa tidak dibocorkan ke ringkasan. Pencocokan TEKS UTUH per elemen (bukan substring): kata acak bisa
    // kebetulan menjadi bagian label ("word" ⊂ "Password", "over" ⊂ "Recovery") dan membuat test flaky.
    for (const k of kelimaKata) expect(within(ringkasan).queryByText(k)).toBeNull();
    expect(within(ringkasan).queryByText(kelimaKata.join(' '))).toBeNull();
  });

  it('password pendek (6) tetap tampil 6 titik; petunjuk kosong tampil "(tidak diset)"', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keSelesai('abcdef', '');
    expect(screen.getByText('•'.repeat(6))).toBeInTheDocument();
    expect(screen.getByText('(tidak diset)')).toBeInTheDocument();
  });

  it('"Buat Vault Sekarang" memanggil onComplete(password, petunjuk, frasa) dengan frasa YANG SAMA dengan yang ditampilkan', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<SetupFlow onComplete={onComplete} />);
    keRecovery('rahasia-uji', 'Nama kucing');
    const frasaTampil = kata().join(' ');
    fireEvent.click(screen.getByRole('checkbox'));
    lanjut();

    fireEvent.click(screen.getByRole('button', { name: /Buat Vault Sekarang/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith('rahasia-uji', 'Nama kucing', frasaTampil);
  });

  it('frasa setelah "Buat ulang" adalah yang dikirim (bukan frasa pertama)', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<SetupFlow onComplete={onComplete} />);
    keRecovery();
    fireEvent.click(screen.getByRole('button', { name: /Buat ulang/ }));
    const frasaBaru = kata().join(' ');
    fireEvent.click(screen.getByRole('checkbox'));
    lanjut();
    fireEvent.click(screen.getByRole('button', { name: /Buat Vault Sekarang/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(onComplete.mock.calls[0][2]).toBe(frasaBaru);
  });

  it('onComplete gagal → pesan galat ditampilkan dan tombol kembali bisa dipakai ulang', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('gagal'));
    render(<SetupFlow onComplete={onComplete} />);
    keSelesai();
    fireEvent.click(screen.getByRole('button', { name: /Buat Vault Sekarang/ }));

    await waitFor(() => expect(screen.getByText('Gagal membuat vault. Coba lagi.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Buat Vault Sekarang/ })).toBeEnabled();
  });

  it('tombol kembali (ikon panah) di langkah akhir membawa ke Recovery Phrase', () => {
    render(<SetupFlow onComplete={async () => {}} />);
    keSelesai();
    const baris = document.querySelector('.setup-panel__row') as HTMLElement;
    fireEvent.click(baris.querySelector('button') as HTMLButtonElement);
    expect(screen.getByRole('heading', { name: 'Recovery Phrase' })).toBeInTheDocument();
  });
});
