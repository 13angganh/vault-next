'use client';

/**
 * Vault Next — SettingsView
 * Sesi B: refactor pakai Button + Toggle primitives.
 */

import { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Cloud, LayoutGrid, Sun, Moon, Fingerprint, ChevronDown } from 'lucide-react';
import { lsGet, LS_BIO_CRED_ID } from '@/lib/storage';
import { AUTOLOCK_OPTIONS_MIN, APP_VERSION } from '@/lib/constants';
import { useAppStore }         from '@/lib/store/appStore';
import { useTheme }            from '@/components/providers/ThemeProvider';
import { PINSettingsPanel }    from '@/components/settings/PINSettingsPanel';
import { CategoryManager }     from '@/components/settings/CategoryManager';
import { BackupModal }         from '@/components/settings/BackupModal';
import { BiometricHintModal, clearBioSession } from '@/components/lock/BiometricHintModal';
import { Button, Toggle, ConfirmDialog } from '@/components/ui/primitives';
import { HealthCheckPanel } from '@/components/settings/HealthCheckPanel';
import { EASE } from '@/lib/animation';

interface SettingsViewProps {
  onClose?: () => void;
}

type SubView = 'main' | 'categories';

/* ── SectionItem: komponen section collapsible di luar SettingsView ──────
   Harus di LUAR SettingsView agar tidak dibuat ulang setiap render.
   Re-creation komponen = semua children unmount+mount → berkedip.
   ─────────────────────────────────────────────────────────────────────── */
interface SectionItemProps {
  skey:           string;
  title:          string;
  badge?:         React.ReactNode;
  dynamicHeight?: boolean;
  openSections:   Record<string, boolean>;
  onToggle:       (key: string) => void;
  prefersReduced: boolean;
  children:       React.ReactNode;
}

function SectionItem({
  skey, title, badge, dynamicHeight,
  openSections, onToggle, prefersReduced, children,
}: SectionItemProps) {
  const isOpen = openSections[skey] ?? false;
  const MUTED_BADGES = ['Nonaktif', 'Auto-save Mati', 'Belum Terdaftar'];

  // v1.10.3: fix animasi laggy/kurang smooth — permintaan pengguna.
  // Root cause: height:"auto" bukan nilai yang bisa di-animate secara
  // native oleh browser; Framer Motion terpaksa recalculate layout
  // (reflow) tiap frame untuk mensimulasikannya, alih-alih compositing
  // murni di GPU — inilah yang terasa berat/tersendat terutama di
  // WebView Android. Diganti dengan mengukur tinggi konten sungguhan
  // via ref (contentRef.scrollHeight) sekali saat terbuka, lalu Framer
  // Motion animate ke NILAI PIKSEL PASTI, bukan string "auto" — piksel
  // pasti BISA dianimasikan secara native (transform/height numerik).
  //
  // Sebelumnya prop `dynamicHeight` adalah workaround: section yang
  // isinya bisa berubah tinggi (PIN panel, Health Check panel) di-skip
  // dari animasi tinggi sama sekali (initial/exit height:"auto" instan,
  // hanya opacity yang animate) karena animasi tinggi lama tidak bisa
  // mengikuti ketika konten di dalamnya berubah tinggi. Sekarang
  // ResizeObserver mengatasi akar masalah itu — re-measure otomatis
  // kapan pun konten di dalam section berubah tinggi SAAT section
  // sudah terbuka, jadi animasi tinggi asli tetap berjalan mulus untuk
  // SEMUA section, termasuk yang dynamicHeight. Prop dynamicHeight
  // dipertahankan di interface (tidak breaking untuk call-site lama)
  // tapi sekarang murni sinyal "pasang ResizeObserver", bukan lagi
  // sinyal "skip animasi tinggi".
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useLayoutEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;

    // Ukur sekali segera saat terbuka — mencegah frame pertama animasi
    // start dari 0 tanpa target yang sudah diketahui (flicker).
    setMeasuredHeight(el.scrollHeight);

    if (!dynamicHeight) return;
    // v1.10.3: ResizeObserver tidak ada di semua lingkungan (jsdom test
    // environment proyek ini termasuk salah satunya, dikonfirmasi
    // reproduksi langsung — ReferenceError tanpa guard ini; browser
    // WebView lama berpotensi sama). Guard defensif: tanpa
    // ResizeObserver, section dynamicHeight tetap dapat pengukuran
    // sekali di atas (bukan animasi terpotong seperti mekanisme lama),
    // hanya kehilangan auto-resize saat konten berubah tinggi SAAT
    // section sedang terbuka — aman, bukan crash.
    if (typeof ResizeObserver === 'undefined') return;
    // Hanya section dynamicHeight yang butuh terus mengamati — section
    // biasa isinya statis, ResizeObserver di situ hanya overhead tanpa
    // manfaat (tidak pernah ada perubahan tinggi untuk diamati).
    const observer = new ResizeObserver(() => {
      setMeasuredHeight(el.scrollHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, dynamicHeight]);

  return (
    <div className="settings-section settings-section--collapsible">
      <button
        className={"settings-section__header" + (isOpen ? " settings-section__header--open" : "")}
        onClick={() => onToggle(skey)}
        aria-expanded={isOpen}
        type="button"
      >
        <span className="settings-section-title">{title}</span>
        {badge && !isOpen && (
          <span className={
            "settings-section__badge" +
            (typeof badge === "string" && MUTED_BADGES.includes(badge)
              ? " settings-section__badge--muted" : "")
          }>{badge}</span>
        )}
        <span
          className={"settings-section__chevron" + (isOpen ? " settings-section__chevron--open" : "")}
          aria-hidden="true"
        >
          <ChevronDown size={13} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            className="settings-section__body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: measuredHeight }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.22, ease: EASE.inOut }}
            style={{ overflow: "hidden" }}
          >
            <div ref={contentRef}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SettingsView({ onClose }: SettingsViewProps) {
  const autoLockMinutes   = useAppStore((s) => s.autoLockMinutes);
  const setAutoLock       = useAppStore((s) => s.setAutoLockMinutes);
  const autoSaveEnabled   = useAppStore((s) => s.autoSaveEnabled);
  const setAutoSave       = useAppStore((s) => s.setAutoSaveEnabled);
  const backupIntervalHrs = useAppStore((s) => s.backupIntervalHrs);
  const setBackupInterval = useAppStore((s) => s.setBackupIntervalHrs);
  const vault             = useAppStore((s) => s.vault);
  const recycleBin        = useAppStore((s) => s.recycleBin);
  const customCats        = useAppStore((s) => s.customCats);
  const biometricEnabled  = useAppStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);
  const setBiometricCredId  = useAppStore((s) => s.setBiometricCredId);
  const masterPw          = useAppStore((s) => s.masterPw);
  const { theme, toggleTheme } = useTheme();

  const [subView,           setSubView]           = useState<SubView>('main');

  // Collapsible sections
  // v1.10.3: restrukturisasi — 8 section flat lama (tampilan, biometrik,
  // keamanan, penyimpanan, backup, kategori, health, info) dikelompokkan
  // ulang jadi 3 collapsible (keamanan, tampilan, data) + Info Vault
  // dikeluarkan jadi section statis (bukan collapsible, tidak butuh key
  // openSections lagi — lihat render-nya di bawah, di luar peta ini).
  //   - keamanan: Auto-lock, PIN, Biometrik, Kesehatan Password
  //   - tampilan: Tema, Kategori
  //   - data:     Auto-save, Pengingat Backup, Export & Import, Sync
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    keamanan: false, tampilan: false, data: false,
  });
  const prefersReduced = useReducedMotion();
  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const [showBackup,        setShowBackup]        = useState(false);
  const [showBioModal,      setShowBioModal]      = useState(false);
  const [confirmDeleteBio,  setConfirmDeleteBio]  = useState(false);

  // v1.7.0: sama seperti fix di AppShell.tsx — onClose yang stabil mencegah
  // useFocusTrap di dalam BackupModal re-run efeknya (dan merebut fokus dari
  // textarea sync manual) setiap kali SettingsView re-render.
  const handleOpenBackup  = useCallback(() => setShowBackup(true), []);
  const handleCloseBackup = useCallback(() => setShowBackup(false), []);

  const isWebAuthnSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const hasBioCredential    = typeof window !== 'undefined' && !!lsGet(LS_BIO_CRED_ID);  // F2-07

  const backupOptions = [
    { value: 0, label: 'Nonaktif' },   { value: 24, label: 'Setiap hari' },
    { value: 72, label: 'Setiap 3 hari' }, { value: 168, label: 'Setiap minggu' },
  ];

  if (subView === 'categories') return <CategoryManager onClose={() => setSubView('main')} />;

  return (
    <>
      <div className="settings-page">
        <div className="page-header">
          {onClose && (
            <button className="page-header__back" onClick={onClose} aria-label="Kembali ke vault">
              <ArrowLeft size={18} />
            </button>
          )}
          <h2 className="page-header__title">Pengaturan</h2>
        </div>
        <div className="settings-page__body">

          {/* v1.10.3: restrukturisasi Pengaturan — permintaan pengguna:
              8 section flat lama dikelompokkan jadi 3 collapsible (murni
              pengelompokan tampilan, mekanisme collapsible/Framer Motion
              yang sama dipertahankan, bukan diganti struktur menu/submenu
              2-level). Setiap sub-blok tetap dibungkus .settings-row (atau
              .settings-row--block untuk yang punya panel anak) agar garis
              pemisah otomatis dari CSS ".settings-row + .settings-row"
              tetap berlaku sebagai pemisah visual antar sub-blok. */}

          {/* ── Keamanan: Auto-lock, PIN, Biometrik, Kesehatan Password ──
              dynamicHeight dipertahankan (sebelumnya hanya untuk PIN) —
              sekarang WAJIB karena section ini juga berisi HealthCheckPanel,
              yang punya expand/collapse internal sendiri ("+N masalah
              lainnya"); height:auto tetap perlu bisa mengikuti kapan pun
              salah satu dari dua sub-panel ini berubah tinggi. */}
          <SectionItem skey="keamanan" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Keamanan" badge={AUTOLOCK_OPTIONS_MIN.find((o) => o.value === autoLockMinutes)?.label ?? ""} dynamicHeight>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Auto-lock</span>
                <span className="settings-row__desc">Kunci otomatis saat tidak aktif</span>
              </div>
              <select className="settings-select" value={autoLockMinutes}
                onChange={(e) => setAutoLock(Number(e.target.value))} aria-label="Pilih waktu auto-lock">
                {AUTOLOCK_OPTIONS_MIN.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="settings-row settings-row--block">
              <div className="settings-row__info">
                <span className="settings-row__label">PIN</span>
                <span className="settings-row__desc">Login cepat dengan kode numerik 4–8 digit</span>
              </div>
              <PINSettingsPanel />
            </div>
            {isWebAuthnSupported && (
              <>
                <div className="settings-row">
                  <div className="settings-row__info">
                    <span className="settings-row__label">
                      <Fingerprint size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                      Login Sidik Jari
                    </span>
                    <span className="settings-row__desc">
                      {hasBioCredential
                        ? biometricEnabled ? "Aktif — buka vault dengan sidik jari" : "Terdaftar tapi nonaktif"
                        : "Belum didaftarkan"}
                    </span>
                  </div>
                  {hasBioCredential ? (
                    <Toggle checked={biometricEnabled} onChange={setBiometricEnabled}
                      label={biometricEnabled ? "Nonaktifkan biometrik" : "Aktifkan biometrik"} />
                  ) : (
                    <Button variant="ghost" size="sm" className="settings-row__action"
                      onClick={() => setShowBioModal(true)} disabled={!masterPw}
                      title={!masterPw ? "Tidak bisa mendaftarkan — sesi tidak aktif" : undefined}>
                      Daftarkan
                    </Button>
                  )}
                </div>
                {hasBioCredential && (
                  <div className="settings-row">
                    <div className="settings-row__info">
                      <span className="settings-row__label">Hapus Registrasi</span>
                      <span className="settings-row__desc">Hapus data sidik jari dari perangkat ini</span>
                    </div>
                    <Button variant="danger" size="sm" className="settings-row__action"
                      onClick={() => setConfirmDeleteBio(true)}>
                      Hapus
                    </Button>
                  </div>
                )}
              </>
            )}
            <div className="settings-row settings-row--block">
              <div className="settings-row__info">
                <span className="settings-row__label">Kesehatan Password</span>
                <span className="settings-row__desc">{vault.length} entri diperiksa</span>
              </div>
              <HealthCheckPanel />
            </div>
          </SectionItem>

          {/* ── Tampilan: Tema, Kategori ── */}
          <SectionItem skey="tampilan" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Tampilan" badge={theme === "dark" ? "Gelap" : "Terang"}>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Tema Tampilan</span>
                <span className="settings-row__desc">Aktif: <strong>{theme === "dark" ? "Gelap" : "Terang"}</strong> — klik untuk mengganti</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action" onClick={toggleTheme}
                leftIcon={theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}>
                {theme === "dark" ? "Ke Terang" : "Ke Gelap"}
              </Button>
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Kelola Kategori</span>
                <span className="settings-row__desc">{customCats.length} custom · 8 bawaan</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action"
                onClick={() => setSubView("categories")} leftIcon={<LayoutGrid size={14} />}>
                Buka
              </Button>
            </div>
          </SectionItem>

          {/* ── Data: Auto-save, Pengingat Backup, Export & Import, Sync ── */}
          <SectionItem skey="data" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Data" badge={autoSaveEnabled ? "Auto-save Aktif" : "Auto-save Mati"}>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Auto-save</span>
                <span className="settings-row__desc">Simpan otomatis setiap perubahan</span>
              </div>
              <Toggle checked={autoSaveEnabled} onChange={setAutoSave} label="Toggle auto-save" />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Pengingat backup</span>
                <span className="settings-row__desc">Ingatkan untuk backup secara berkala</span>
              </div>
              <select className="settings-select" value={backupIntervalHrs}
                onChange={(e) => setBackupInterval(Number(e.target.value))} aria-label="Pilih interval backup">
                {backupOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Export &amp; Import</span>
                <span className="settings-row__desc">Simpan file .vault atau pulihkan dari backup</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action"
                onClick={handleOpenBackup} leftIcon={<Cloud size={14} />}>
                Buka
              </Button>
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Sinkron Antar Perangkat</span>
                <span className="settings-row__desc">Salin teks terenkripsi ke perangkat lain</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action"
                onClick={handleOpenBackup} leftIcon={<Cloud size={14} />}>
                Buka
              </Button>
            </div>
          </SectionItem>

          {/* ── Info Vault: dikeluarkan dari collapsible, section statis
              paling bawah (permintaan pengguna eksplisit) — bukan lagi
              memakai SectionItem/openSections sama sekali. Footer
              .settings-signature duplikatif (info yang sama, di luar
              sejak awal) DIHAPUS di bawah karena section statis ini
              sekarang jadi satu-satunya sumber info versi/enkripsi. ── */}
          <div className="settings-section settings-section--static">
            <div className="settings-section__header settings-section__header--static">
              <span className="settings-section-title">Info Vault</span>
            </div>
            <div className="settings-section__body" style={{ overflow: "visible" }}>
              <div className="settings-info-grid-wrap">
                <div className="settings-info-grid">
                  <div className="settings-info-item">
                    <span className="settings-info-item__val">{vault.length}</span>
                    <span className="settings-info-item__label">Entri</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-item__val">{recycleBin.length}</span>
                    <span className="settings-info-item__label">Sampah</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-item__val">AES-256</span>
                    <span className="settings-info-item__label">Enkripsi</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="settings-info-item__val">v{APP_VERSION}</span>
                    <span className="settings-info-item__label">Versi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showBackup && <BackupModal onClose={handleCloseBackup} />}
      {showBioModal && (
        <BiometricHintModal mode="register" masterPw={masterPw} onClose={() => setShowBioModal(false)} />
      )}

      {/* ── Confirm: Hapus Registrasi Biometrik ── */}
      <ConfirmDialog
        open={confirmDeleteBio}
        onCancel={() => setConfirmDeleteBio(false)}
        onConfirm={() => {
          setBiometricEnabled(false);
          setBiometricCredId(null);
          clearBioSession();
          setConfirmDeleteBio(false);
        }}
        title="Hapus Registrasi Biometrik?"
        message="Data sidik jari akan dihapus dari perangkat ini. Login biometrik tidak bisa digunakan sebelum didaftarkan ulang."
        confirmLabel="Hapus Registrasi"
        variant="danger"
      />

    </>
  );
}
