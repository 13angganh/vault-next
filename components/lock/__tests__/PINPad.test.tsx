/**
 * components/lock/__tests__/PINPad.test.tsx — Vault Next
 *
 * v1.7.0: auto-submit (80ms setelah digit ke-maxLen) dan Enter key bisa
 * race — kalau user menekan Enter dalam window 80ms itu, onSubmit
 * terpanggil dua kali untuk satu PIN yang sama. Di LockScreen.tsx ini
 * berarti satu kesalahan PIN dihitung sebagai dua percobaan lewat
 * incrementPinAttempts, mempercepat lockout secara tidak adil. Test ini
 * memverifikasi guard submitOnce menutup race itu, sambil memastikan PIN
 * yang identik di percobaan BERIKUTNYA (setelah value di-reset) tetap
 * bisa disubmit — bukan terblokir permanen oleh guard-nya sendiri.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { PINPad } from '../PINPad';

// Harness controlled component, meniru cara LockScreen memakai PINPad:
// value/onDigit/onDelete dikelola parent, onSubmit dipanggil saat selesai.
function Harness({ onSubmit, maxLen = 6 }: { onSubmit: () => void; maxLen?: number }) {
  const [value, setValue] = useState('');
  return (
    <PINPad
      value={value}
      maxLen={maxLen}
      onDigit={(d) => setValue((v) => (v.length < maxLen ? v + d : v))}
      onDelete={() => setValue((v) => v.slice(0, -1))}
      onSubmit={onSubmit}
    />
  );
}

function typeDigits(digits: string) {
  for (const d of digits) {
    fireEvent.click(screen.getByLabelText(`Digit ${d}`));
  }
}

function clickDelete() {
  fireEvent.click(screen.getByLabelText('Hapus digit terakhir'));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PINPad — double-submit race guard (v1.7.0 fix)', () => {
  it('onSubmit dipanggil hanya sekali saat Enter ditekan dalam window auto-submit 80ms', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    act(() => {
      typeDigits('123456'); // mengisi ke maxLen, menjadwalkan auto-submit 80ms
    });

    // User menekan Enter 30ms kemudian — well within window 80ms
    act(() => {
      vi.advanceTimersByTime(30);
      fireEvent.keyDown(window, { key: 'Enter' });
    });

    // Auto-submit timer selesai
    act(() => {
      vi.advanceTimersByTime(60); // total 90ms, lewat 80ms
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('onSubmit tetap terpanggil normal via auto-submit saja (tanpa race)', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    act(() => {
      typeDigits('123456');
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('PIN yang identik di percobaan BERIKUTNYA tetap bisa submit — guard tidak permanen', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    // Percobaan 1: isi "111111", auto-submit
    act(() => {
      typeDigits('111111');
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Simulasikan LockScreen meng-clear pinBuf setelah gagal (clearPin()
    // di LockScreen.tsx menghapus semua digit, PINPad tidak di-unmount),
    // lalu user mengetik PIN yang SAMA persis lagi ("111111").
    act(() => {
      for (let i = 0; i < 6; i++) clickDelete();
    });
    act(() => {
      typeDigits('111111');
    });
    act(() => {
      vi.advanceTimersByTime(80);
    });

    // Percobaan kedua harus tetap memanggil onSubmit — bukan terblokir
    // oleh guard dari percobaan pertama.
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('menghapus lalu mengisi ulang sebelum auto-submit selesai membatalkan submit lama', () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    act(() => {
      typeDigits('123456'); // menjadwalkan auto-submit
    });
    act(() => {
      vi.advanceTimersByTime(50); // belum sampai 80ms
    });
    act(() => {
      clickDelete(); // value jadi '12345'
    });
    act(() => {
      vi.advanceTimersByTime(100); // andai timer lama masih hidup, ini akan memicunya
    });

    // Auto-submit effect lama sudah di-cleanup oleh React saat value
    // berubah (useEffect cleanup pada value dependency) — tidak submit
    // untuk PIN yang belum lengkap.
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
