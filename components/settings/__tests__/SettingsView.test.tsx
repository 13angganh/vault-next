/**
 * components/settings/__tests__/SettingsView.test.tsx — Vault Next
 *
 * v1.10.3: SettingsView.tsx sebelumnya TIDAK PERNAH punya file test sama
 * sekali di proyek ini (dikonfirmasi via pencarian sebelum sesi ini
 * dimulai) — restrukturisasi 8 section flat menjadi 3 section
 * dikelompokkan (Keamanan/Tampilan/Data) + Info Vault statis, dan fix
 * animasi collapsible laggy (height:"auto" → pengukuran piksel via ref +
 * ResizeObserver), berjalan tanpa jaring pengaman test sama sekali
 * sebelum file ini ada. Test ini menutup celah itu.
 *
 * Yang diverifikasi:
 * 1. Struktur baru: 3 judul section collapsible baru muncul (Keamanan,
 *    Tampilan, Data), judul-judul section lama yang sudah dihapus TIDAK
 *    lagi ada sebagai section terpisah (Biometrik, Penyimpanan,
 *    Backup & Sync, Kategori — sekarang sub-item di dalam section lain).
 * 2. Pengelompokan: membuka section Keamanan menampilkan Auto-lock, PIN,
 *    Login Sidik Jari, DAN Kesehatan Password sekaligus (4 sub-item dari
 *    3 section lama yang berbeda, sekarang di satu tempat).
 * 3. Info Vault: tidak lagi collapsible (tidak ada tombol dengan
 *    aria-expanded untuk itu), kontennya (4 kotak info) selalu terlihat
 *    tanpa perlu diklik.
 * 4. Footer duplikat (.settings-signature, teks "100% Offline") sudah
 *    tidak ada — dihapus karena redundan dengan Info Vault.
 * 5. Guard ResizeObserver: section dynamicHeight (Keamanan) tidak crash
 *    baik saat ResizeObserver tersedia (mock global di vitest.setup.ts)
 *    MAUPUN saat sengaja dibuat tidak tersedia (reproduksi kondisi
 *    lingkungan tanpa dukungan ResizeObserver) — jalur fallback yang
 *    ditambahkan khusus untuk itu benar-benar teruji, bukan cuma ada.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsView } from '../SettingsView';
import { useAppStore } from '@/lib/store/appStore';

beforeEach(() => {
  useAppStore.setState({ customCats: [], vault: [], recycleBin: [] });
});

describe('SettingsView — struktur baru 3 section (v1.10.3)', () => {
  it('3 judul section baru (Keamanan, Tampilan, Data) ada di halaman', () => {
    render(<SettingsView />);
    expect(screen.getByText('Keamanan')).toBeInTheDocument();
    expect(screen.getByText('Tampilan')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });

  it('judul section lama yang sudah digabung TIDAK lagi ada sebagai section terpisah', () => {
    render(<SettingsView />);
    // "Biometrik", "Penyimpanan", "Backup & Sync", "Kategori" dulu judul
    // section sendiri-sendiri — sekarang isinya pindah jadi sub-item di
    // dalam Keamanan/Tampilan/Data, judul sebagai HEADER SECTION tidak
    // boleh ada lagi (kontennya sendiri, mis. label "Kelola Kategori",
    // boleh tetap ada sebagai sub-item — itu diverifikasi terpisah).
    expect(screen.queryByText('Biometrik')).not.toBeInTheDocument();
    expect(screen.queryByText('Penyimpanan')).not.toBeInTheDocument();
    expect(screen.queryByText('Backup & Sync')).not.toBeInTheDocument();
    expect(screen.queryByText('Kategori')).not.toBeInTheDocument();
  });

  it('section Keamanan berisi Auto-lock, PIN, Login Sidik Jari, dan Kesehatan Password sekaligus', () => {
    // isWebAuthnSupported bergantung pada window.PublicKeyCredential, yang
    // tidak ada secara native di jsdom (dikonfirmasi via kegagalan test
    // ini sebelum mock ditambahkan) — di-mock di sini secara spesifik
    // untuk menguji jalur Biometrik benar-benar pindah ke dalam Keamanan.
    const original = (window as { PublicKeyCredential?: unknown }).PublicKeyCredential;
    (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = function () {};

    render(<SettingsView />);
    fireEvent.click(screen.getByText('Keamanan'));

    expect(screen.getByText('Auto-lock')).toBeInTheDocument();
    expect(screen.getByText('PIN')).toBeInTheDocument();
    expect(screen.getByText('Login Sidik Jari')).toBeInTheDocument();
    expect(screen.getByText('Kesehatan Password')).toBeInTheDocument();

    (window as { PublicKeyCredential?: unknown }).PublicKeyCredential = original;
  });

  it('section Tampilan berisi Tema Tampilan dan Kelola Kategori', () => {
    render(<SettingsView />);
    fireEvent.click(screen.getByText('Tampilan'));

    expect(screen.getByText('Tema Tampilan')).toBeInTheDocument();
    expect(screen.getByText('Kelola Kategori')).toBeInTheDocument();
  });

  it('section Data berisi Auto-save, Pengingat backup, Export & Import, dan Sinkron Antar Perangkat', () => {
    render(<SettingsView />);
    fireEvent.click(screen.getByText('Data'));

    expect(screen.getByText('Auto-save')).toBeInTheDocument();
    expect(screen.getByText('Pengingat backup')).toBeInTheDocument();
    expect(screen.getByText('Export & Import')).toBeInTheDocument();
    expect(screen.getByText('Sinkron Antar Perangkat')).toBeInTheDocument();
  });
});

describe('SettingsView — Info Vault statis, bukan lagi collapsible (v1.10.3)', () => {
  it('label "Info Vault" ada TANPA perlu diklik terlebih dahulu (selalu terbuka)', () => {
    render(<SettingsView />);
    expect(screen.getByText('Info Vault')).toBeInTheDocument();
    // Kontennya (label "Entri") harus langsung terlihat tanpa interaksi apa pun.
    expect(screen.getByText('Entri')).toBeInTheDocument();
  });

  it('header "Info Vault" BUKAN elemen <button> (tidak bisa diklik/di-toggle, beda dari section collapsible lain)', () => {
    render(<SettingsView />);
    const infoLabel = screen.getByText('Info Vault');
    // Section collapsible: judul ada di dalam <button role... aria-expanded>.
    // Section statis: judul ada di dalam <span> biasa, parent terdekatnya
    // bukan <button>. closest('button') harus null untuk membuktikan ini.
    expect(infoLabel.closest('button')).toBeNull();
  });

  it('4 kotak info (Entri, Sampah, Enkripsi, Versi) semuanya langsung terlihat', () => {
    render(<SettingsView />);
    expect(screen.getByText('Entri')).toBeInTheDocument();
    expect(screen.getByText('Sampah')).toBeInTheDocument();
    expect(screen.getByText('Enkripsi')).toBeInTheDocument();
    expect(screen.getByText('Versi')).toBeInTheDocument();
  });
});

describe('SettingsView — footer duplikat dihapus (v1.10.3)', () => {
  it('teks footer lama ("100% Offline · AES-256-GCM") tidak lagi ada di mana pun', () => {
    render(<SettingsView />);
    expect(screen.queryByText(/100% Offline/)).not.toBeInTheDocument();
  });
});

describe('SettingsView — guard ResizeObserver tidak crash di kedua kondisi (v1.10.3)', () => {
  it('section dynamicHeight (Keamanan) render dan terbuka tanpa throw SAAT ResizeObserver TERSEDIA (mock global)', () => {
    // vitest.setup.ts sudah memasang mock ResizeObserver secara global —
    // ini menguji jalur "ResizeObserver ada", observer.observe() harus
    // benar-benar terpanggil tanpa exception.
    expect(() => {
      render(<SettingsView />);
      fireEvent.click(screen.getByText('Keamanan'));
    }).not.toThrow();
  });

  it('section dynamicHeight (Keamanan) render dan terbuka tanpa throw SAAT ResizeObserver TIDAK TERSEDIA (reproduksi lingkungan tanpa dukungan)', () => {
    // Override sementara: hapus ResizeObserver dari global scope untuk
    // test ini secara spesifik, mereproduksi persis kondisi yang
    // menyebabkan crash asli ("ResizeObserver is not defined") sebelum
    // guard typeof ditambahkan — membuktikan guard-nya benar-benar
    // mencegah crash, bukan cuma ada di kode tanpa pernah dieksekusi
    // jalurnya oleh test mana pun.
    const original = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    // @ts-expect-error -- sengaja unset untuk simulasi lingkungan tanpa ResizeObserver
    delete globalThis.ResizeObserver;

    expect(() => {
      render(<SettingsView />);
      fireEvent.click(screen.getByText('Keamanan'));
    }).not.toThrow();

    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
  });
});

describe('SettingsView — Kesehatan Password tetap berfungsi penuh di lokasi barunya (v1.10.3)', () => {
  it('HealthCheckPanel tetap render kontennya (bukan cuma judul) di dalam section Keamanan', () => {
    // v1.10.0/v1.8.0: HealthCheckPanel render badge jumlah entri sendiri
    // dan area masalah. Ini memverifikasi pemindahan ke dalam section
    // Keamanan tidak memutus render internal komponennya.
    useAppStore.setState({
      vault: [
        { id: '1', cat: 'sosmed', name: 'Test', pass: '123' },
      ],
    });
    render(<SettingsView />);
    fireEvent.click(screen.getByText('Keamanan'));

    // "Kesehatan Password" label ada (sub-item), dan komponen anaknya
    // ikut ter-render (dibuktikan lewat badge count "1 entri" di header
    // section — deskripsi baris "Kesehatan Password" — dan tidak ada
    // error saat HealthCheckPanel mencoba compute dari vault berisi 1 entri).
    expect(screen.getByText('Kesehatan Password')).toBeInTheDocument();
    expect(screen.getByText('1 entri diperiksa')).toBeInTheDocument();
  });
});
