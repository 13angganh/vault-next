'use client';

/**
 * SettingsView v2.2 (Tahap 5: + kelompok "Tentang" berisi satu baris navigasi "Atribusi & lisensi")
 * — satu pola tampilan untuk SEMUA baris:
 *   • baris saklar (boolean)  → toggle di kanan
 *   • baris navigasi          → nilai saat ini + panah; ketuk membuka sheet/halaman
 * Tidak ada lagi segmented, select native, atau blok yang mengembang di tempat.
 */
import { useState, useCallback } from 'react';
import {
  ArrowLeft, ChevronRight, Cloud, Fingerprint, HeartPulse, LayoutGrid, Moon, Sun, Timer, Save, Bell,
  ShieldCheck, KeyRound, Navigation, Trash2, Scale,
} from 'lucide-react';
import { lsGet, LS_BIO_CRED_ID } from '@/lib/storage';
import { AUTOLOCK_OPTIONS_MIN, APP_VERSION, APP_NAME } from '@/lib/constants';
import { useAppStore }         from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES }  from '@/lib/types';
import { useTheme }            from '@/components/providers/ThemeProvider';
import { useNavMode, type NavMode } from '@/lib/navMode';
import { hasPinSetup }         from '@/lib/vaultService';
import { PINSettingsPanel }    from '@/components/settings/PINSettingsPanel';
import { CategoryManager }     from '@/components/settings/CategoryManager';
import { BackupModal }         from '@/components/settings/BackupModal';
import { HealthCheckPanel }    from '@/components/settings/HealthCheckPanel';
import { AttributionPanel }    from '@/components/settings/AttributionPanel';
import { BiometricHintModal, clearBioSession } from '@/components/lock/BiometricHintModal';
import { Toggle, ConfirmDialog } from '@/components/ui/primitives';
import { OptionSheet }         from '@/components/ui/OptionSheet';
import { PanelSheet }          from '@/components/ui/PanelSheet';

interface SettingsViewProps { onClose?: () => void }
type Tone = 'gold' | 'teal' | 'blue' | 'red' | 'violet';
type Sheet = null | 'theme' | 'nav' | 'lock' | 'backupInt' | 'pin' | 'health' | 'attribution';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="st-group">
      <h3 className="st-group__title">{title}</h3>
      <div className="st-card">{children}</div>
    </section>
  );
}

/** Satu-satunya komponen baris. `toggle` → saklar; selain itu → baris navigasi. */
function Row({ icon, tone = 'gold', label, desc, value, onClick, toggle, danger }: {
  icon: React.ReactNode; tone?: Tone; label: string; desc?: string; value?: string;
  onClick?: () => void; toggle?: React.ReactNode; danger?: boolean;
}) {
  const body = (
    <>
      <span className={`st-ico st-ico--${danger ? 'red' : tone}`}>{icon}</span>
      <span className="st-row__info">
        <span className="st-row__label">{label}</span>
        {desc && <span className="st-row__desc">{desc}</span>}
      </span>
      {toggle ?? (
        <>
          {value && <span className="st-row__value">{value}</span>}
          <ChevronRight size={18} className="st-row__chev" />
        </>
      )}
    </>
  );
  return (
    <div className="st-rowwrap">
      {toggle
        ? <div className="st-row">{body}</div>
        : <button type="button" className={`st-row st-row--tap${danger ? ' st-row--danger' : ''}`} onClick={onClick}>{body}</button>}
    </div>
  );
}

const NAV_LABEL: Record<NavMode, string> = { bottom: 'Bar bawah', sidebar: 'Sidebar' };
const BACKUP_OPTIONS = [
  { value: 0, label: 'Nonaktif' }, { value: 24, label: 'Setiap hari' },
  { value: 72, label: 'Setiap 3 hari' }, { value: 168, label: 'Setiap minggu' },
];

export function SettingsView({ onClose }: SettingsViewProps) {
  const autoLockMinutes     = useAppStore((s) => s.autoLockMinutes);
  const setAutoLock         = useAppStore((s) => s.setAutoLockMinutes);
  const autoSaveEnabled     = useAppStore((s) => s.autoSaveEnabled);
  const setAutoSave         = useAppStore((s) => s.setAutoSaveEnabled);
  const backupIntervalHrs   = useAppStore((s) => s.backupIntervalHrs);
  const setBackupInterval   = useAppStore((s) => s.setBackupIntervalHrs);
  const vault               = useAppStore((s) => s.vault);
  const recycleBin          = useAppStore((s) => s.recycleBin);
  const customCats          = useAppStore((s) => s.customCats);
  const biometricEnabled    = useAppStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);
  const setBiometricCredId  = useAppStore((s) => s.setBiometricCredId);
  const masterPw            = useAppStore((s) => s.masterPw);
  const { theme, setTheme } = useTheme();
  const navMode    = useNavMode((s) => s.mode);
  const setNavMode = useNavMode((s) => s.setMode);

  const [subView,          setSubView]          = useState<'main' | 'categories'>('main');
  const [sheet,            setSheet]            = useState<Sheet>(null);
  const [showBackup,       setShowBackup]       = useState(false);
  const [showBioModal,     setShowBioModal]     = useState(false);
  const [confirmDeleteBio, setConfirmDeleteBio] = useState(false);
  const closeSheet  = useCallback(() => setSheet(null), []);
  const closeBackup = useCallback(() => setShowBackup(false), []);

  const isWebAuthnSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const hasBioCredential    = typeof window !== 'undefined' && !!lsGet(LS_BIO_CRED_ID);
  const pinOn   = hasPinSetup();
  const favs    = vault.filter((e) => e.fav).length;
  const lockLbl = AUTOLOCK_OPTIONS_MIN.find((o) => o.value === autoLockMinutes)?.label ?? '';
  const backupLbl = BACKUP_OPTIONS.find((o) => o.value === backupIntervalHrs)?.label ?? '';

  if (subView === 'categories') return <CategoryManager onClose={() => setSubView('main')} />;

  return (
    <>
      <div className="st-page">
        <div className="st-inner">
          <div className="st-head">
            {onClose && <button className="st-back" onClick={onClose} aria-label="Kembali ke vault"><ArrowLeft size={19} /></button>}
            <h2 className="st-title">Pengaturan</h2>
          </div>

          <section className="st-hero" aria-label="Ringkasan keamanan">
            <div className="st-hero__top">
              <span className="st-hero__shield"><ShieldCheck size={26} /></span>
              <div>
                <div className="st-hero__title">Brankas terlindungi</div>
                <div className="st-hero__sub">AES-256-GCM · PBKDF2 dua lapis · tanpa server</div>
              </div>
            </div>
            <div className="st-hero__chips">
              <span className={`st-chip${pinOn ? ' st-chip--ok' : ''}`}><KeyRound size={13} />PIN {pinOn ? 'aktif' : 'belum'}</span>
              <span className={`st-chip${hasBioCredential && biometricEnabled ? ' st-chip--ok' : ''}`}><Fingerprint size={13} />Biometrik {hasBioCredential ? (biometricEnabled ? 'aktif' : 'mati') : 'belum'}</span>
              <span className="st-chip st-chip--ok"><Timer size={13} />Auto-lock {lockLbl}</span>
            </div>
            <div className="st-hero__stats">
              <div><b>{vault.length}</b><span>Entri</span></div>
              <div><b>{favs}</b><span>Favorit</span></div>
              <div><b>{recycleBin.length}</b><span>Sampah</span></div>
            </div>
          </section>

          <Group title="Tampilan">
            <Row icon={theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} tone="violet" label="Tema" value={theme === 'dark' ? 'Gelap' : 'Terang'} onClick={() => setSheet('theme')} />
            <Row icon={<Navigation size={18} />} tone="blue" label="Gaya navigasi" desc="Hanya satu yang tampil" value={NAV_LABEL[navMode]} onClick={() => setSheet('nav')} />
            <Row icon={<LayoutGrid size={18} />} tone="gold" label="Kategori" value={`${customCats.length + DEFAULT_CATEGORIES.length} kategori`} onClick={() => setSubView('categories')} />
          </Group>

          <Group title="Keamanan">
            <Row icon={<Timer size={18} />} tone="gold" label="Kunci otomatis" value={lockLbl} onClick={() => setSheet('lock')} />
            <Row icon={<KeyRound size={18} />} tone="teal" label="PIN" value={pinOn ? 'Aktif' : 'Belum diatur'} onClick={() => setSheet('pin')} />
            {isWebAuthnSupported && (hasBioCredential ? (
              <>
                <Row icon={<Fingerprint size={18} />} tone="teal" label="Sidik jari" desc="Buka brankas dengan biometrik"
                  toggle={<Toggle checked={biometricEnabled} onChange={setBiometricEnabled} label={biometricEnabled ? 'Nonaktifkan biometrik' : 'Aktifkan biometrik'} />} />
                <Row icon={<Trash2 size={18} />} danger label="Hapus registrasi sidik jari" onClick={() => setConfirmDeleteBio(true)} />
              </>
            ) : (
              <Row icon={<Fingerprint size={18} />} tone="teal" label="Sidik jari" value="Belum didaftarkan" onClick={() => { if (masterPw) setShowBioModal(true); }} />
            ))}
            <Row icon={<HeartPulse size={18} />} tone="red" label="Kesehatan password" value={`${vault.length} entri`} onClick={() => setSheet('health')} />
          </Group>

          <Group title="Data & cadangan">
            <Row icon={<Save size={18} />} tone="teal" label="Simpan otomatis" desc="Simpan setiap ada perubahan"
              toggle={<Toggle checked={autoSaveEnabled} onChange={setAutoSave} label="Toggle simpan otomatis" />} />
            <Row icon={<Bell size={18} />} tone="gold" label="Pengingat backup" value={backupLbl} onClick={() => setSheet('backupInt')} />
            <Row icon={<Cloud size={18} />} tone="blue" label="Cadangan & sinkronisasi" desc="Backup, pulihkan, dan pindah antar perangkat" onClick={() => setShowBackup(true)} />
          </Group>

          <Group title="Tentang">
            <Row icon={<Scale size={18} />} tone="violet" label="Atribusi & lisensi" desc="Sumber logo dan lisensi aplikasi" onClick={() => setSheet('attribution')} />
          </Group>

          <p className="st-foot">{APP_NAME} v{APP_VERSION} · semua data tersimpan di perangkat ini</p>
        </div>
      </div>

      <OptionSheet open={sheet === 'theme'} title="Tema" value={theme} onClose={closeSheet} onSelect={(id) => setTheme(id as 'dark' | 'light')}
        options={[{ id: 'dark', label: 'Gelap', icon: <Moon size={20} /> }, { id: 'light', label: 'Terang', icon: <Sun size={20} /> }]} />
      <OptionSheet open={sheet === 'nav'} title="Gaya navigasi" value={navMode} onClose={closeSheet} onSelect={(id) => setNavMode(id as NavMode)}
        options={[{ id: 'bottom', label: 'Bar bawah', hint: 'Menu di bagian bawah layar, tombol tambah di tengah' }, { id: 'sidebar', label: 'Sidebar', hint: 'Menu geser dari kiri lewat tombol di header' }]} />
      <OptionSheet open={sheet === 'lock'} title="Kunci otomatis" value={String(autoLockMinutes)} onClose={closeSheet} onSelect={(id) => setAutoLock(Number(id))}
        options={AUTOLOCK_OPTIONS_MIN.map((o) => ({ id: String(o.value), label: o.label }))} />
      <OptionSheet open={sheet === 'backupInt'} title="Pengingat backup" value={String(backupIntervalHrs)} onClose={closeSheet} onSelect={(id) => setBackupInterval(Number(id))}
        options={BACKUP_OPTIONS.map((o) => ({ id: String(o.value), label: o.label }))} />

      {sheet === 'pin' && <PanelSheet title="PIN" icon={<KeyRound size={18} />} onClose={closeSheet}><PINSettingsPanel /></PanelSheet>}
      {sheet === 'health' && <PanelSheet title="Kesehatan password" icon={<HeartPulse size={18} />} onClose={closeSheet}><HealthCheckPanel /></PanelSheet>}
      {sheet === 'attribution' && <PanelSheet title="Atribusi & lisensi" icon={<Scale size={18} />} onClose={closeSheet}><AttributionPanel /></PanelSheet>}
      {showBackup && <BackupModal onClose={closeBackup} />}
      {showBioModal && <BiometricHintModal mode="register" masterPw={masterPw} onClose={() => setShowBioModal(false)} />}
      <ConfirmDialog
        open={confirmDeleteBio}
        onCancel={() => setConfirmDeleteBio(false)}
        onConfirm={() => { setBiometricEnabled(false); setBiometricCredId(null); clearBioSession(); setConfirmDeleteBio(false); }}
        title="Hapus Registrasi Biometrik?"
        message="Data sidik jari akan dihapus dari perangkat ini. Login biometrik tidak bisa digunakan sebelum didaftarkan ulang."
        confirmLabel="Hapus Registrasi"
        variant="danger"
      />
    </>
  );
}
