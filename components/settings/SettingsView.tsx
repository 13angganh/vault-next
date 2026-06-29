'use client';

/**
 * Vault Next — SettingsView
 * Sesi B: refactor pakai Button + Toggle primitives.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Cloud, LayoutGrid, Shield, Sun, Moon, Fingerprint, ChevronDown } from 'lucide-react';
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
            initial={{ opacity: 0, height: dynamicHeight ? "auto" : 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: dynamicHeight ? "auto" : 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.22, ease: EASE.inOut }}
            style={{ overflow: dynamicHeight ? "visible" : "hidden" }}
          >
            {children}
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    tampilan: false, biometrik: false, keamanan: false,
    penyimpanan: false, backup: false, kategori: false, info: false, health: false,
  });
  const prefersReduced = useReducedMotion();
  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);
  const [showBackup,        setShowBackup]        = useState(false);
  const [showBioModal,      setShowBioModal]      = useState(false);
  const [confirmDeleteBio,  setConfirmDeleteBio]  = useState(false);

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

          {/* ── Tampilan ── */}
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
          </SectionItem>

          {/* ── Biometrik ── */}
          {isWebAuthnSupported && (
            <SectionItem skey="biometrik" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Biometrik" badge={hasBioCredential ? (biometricEnabled ? "Aktif" : "Nonaktif") : "Belum Terdaftar"}>
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
            </SectionItem>
          )}

          {/* ── Keamanan ── */}
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
          </SectionItem>

          {/* ── Penyimpanan ── */}
          <SectionItem skey="penyimpanan" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Penyimpanan" badge={autoSaveEnabled ? "Auto-save Aktif" : "Auto-save Mati"}>
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
          </SectionItem>

          {/* ── Backup & Sync ── */}
          <SectionItem skey="backup" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Backup & Sync">
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Export &amp; Import</span>
                <span className="settings-row__desc">Simpan file .vault atau pulihkan dari backup</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action"
                onClick={() => setShowBackup(true)} leftIcon={<Cloud size={14} />}>
                Buka
              </Button>
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <span className="settings-row__label">Sinkron Antar Perangkat</span>
                <span className="settings-row__desc">Salin teks terenkripsi ke perangkat lain</span>
              </div>
              <Button variant="ghost" size="sm" className="settings-row__action"
                onClick={() => setShowBackup(true)} leftIcon={<Cloud size={14} />}>
                Buka
              </Button>
            </div>
          </SectionItem>

          {/* ── Kategori ── */}
          <SectionItem skey="kategori" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Kategori" badge={customCats.length > 0 ? `+${customCats.length} custom` : "8 bawaan"}>
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

          {/* ── Info Vault ── */}
          <SectionItem skey="info" openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced} title="Info Vault" badge={`${vault.length} entri`}>
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
          </SectionItem>

          <SectionItem skey="health" title="Kesehatan Password"
            badge={`${vault.length} entri`}
            openSections={openSections} onToggle={toggleSection} prefersReduced={!!prefersReduced}>
            <HealthCheckPanel />
          </SectionItem>

          <div className="settings-signature">
            <Shield size={13} />
            <span>Vault Next v{APP_VERSION}</span>
            <span>·</span>
            <span>100% Offline · AES-256-GCM</span>
          </div>
        </div>
      </div>

      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
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
