'use client';

/**
 * Vault Next — SettingsView (Sesi 5 - LENGKAP)
 */

import { useState }            from 'react';
import { Settings, ArrowLeft, Cloud } from 'lucide-react';
import { useAppStore }         from '@/lib/store/appStore';
import { useTheme }            from '@/components/providers/ThemeProvider';
import { PINSettingsPanel }    from '@/components/views/PINSettingsPanel';
import { CategoryManager }     from '@/components/views/CategoryManager';
import { BackupModal }         from '@/components/views/BackupModal';

interface SettingsViewProps {
  onClose?: () => void;
}

type SubView = 'main' | 'categories';

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
  const lock              = useAppStore((s) => s.lock);
  const { theme, toggleTheme } = useTheme();

  const [subView,     setSubView]     = useState<SubView>('main');
  const [showBackup,  setShowBackup]  = useState(false);

  const autoLockOptions = [
    { value: 0,   label: 'Nonaktif' },
    { value: 1,   label: '1 menit' },
    { value: 5,   label: '5 menit' },
    { value: 10,  label: '10 menit' },
    { value: 30,  label: '30 menit' },
    { value: 60,  label: '1 jam' },
  ];

  const backupOptions = [
    { value: 0,   label: 'Nonaktif' },
    { value: 24,  label: 'Setiap hari' },
    { value: 72,  label: 'Setiap 3 hari' },
    { value: 168, label: 'Setiap minggu' },
  ];

  if (subView === 'categories') {
    return <CategoryManager onClose={() => setSubView('main')} />;
  }

  return (
    <>
      <div className="settings-view">
        <div className="settings-header">
          {onClose && (
            <button className="icon-btn" onClick={onClose} aria-label="Kembali"><ArrowLeft size={18} /></button>
          )}
          <h2 className="settings-title"><Settings size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Pengaturan</h2>
        </div>

        {/* Tampilan */}
        <section className="settings-section">
          <h3 className="settings-section-title">Tampilan</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Tema</span>
              <span className="settings-row__desc">Mode {theme === 'dark' ? 'gelap' : 'terang'} aktif</span>
            </div>
            <button className="btn btn-ghost settings-row__action" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
            </button>
          </div>
        </section>

        {/* Keamanan */}
        <section className="settings-section">
          <h3 className="settings-section-title">Keamanan</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Auto-lock</span>
              <span className="settings-row__desc">Kunci otomatis saat tidak aktif</span>
            </div>
            <select
              className="settings-select"
              value={autoLockMinutes}
              onChange={(e) => setAutoLock(Number(e.target.value))}
              aria-label="Pilih waktu auto-lock"
            >
              {autoLockOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="settings-row settings-row--block">
            <div className="settings-row__info">
              <span className="settings-row__label">PIN</span>
              <span className="settings-row__desc">Login cepat dengan kode numerik 4–8 digit</span>
            </div>
            <PINSettingsPanel />
          </div>
        </section>

        {/* Penyimpanan */}
        <section className="settings-section">
          <h3 className="settings-section-title">Penyimpanan</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Auto-save</span>
              <span className="settings-row__desc">Simpan otomatis setiap perubahan</span>
            </div>
            <button
              className={`settings-toggle ${autoSaveEnabled ? 'settings-toggle--on' : ''}`}
              onClick={() => setAutoSave(!autoSaveEnabled)}
              role="switch"
              aria-checked={autoSaveEnabled}
              aria-label="Toggle auto-save"
            >
              <span className="settings-toggle__knob" />
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Pengingat backup</span>
              <span className="settings-row__desc">Ingatkan untuk backup secara berkala</span>
            </div>
            <select
              className="settings-select"
              value={backupIntervalHrs}
              onChange={(e) => setBackupInterval(Number(e.target.value))}
              aria-label="Pilih interval backup"
            >
              {backupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Backup & Sync */}
        <section className="settings-section">
          <h3 className="settings-section-title">Backup & Sync</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Backup & Sync</span>
              <span className="settings-row__desc">Export/Import .vault · Sync manual antar perangkat</span>
            </div>
            <button className="btn btn-ghost settings-row__action" onClick={() => setShowBackup(true)}>
              <Cloud size={14} /> Buka
            </button>
          </div>
        </section>

        {/* Kategori */}
        <section className="settings-section">
          <h3 className="settings-section-title">Kategori</h3>
          <div className="settings-row">
            <div className="settings-row__info">
              <span className="settings-row__label">Kelola Kategori</span>
              <span className="settings-row__desc">{customCats.length} custom · 8 bawaan</span>
            </div>
            <button className="btn btn-ghost settings-row__action" onClick={() => setSubView('categories')}>
              🗂️ Buka
            </button>
          </div>
        </section>

        {/* Info Vault */}
        <section className="settings-section">
          <h3 className="settings-section-title">Info Vault</h3>
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <span className="settings-info-item__val">{vault.length}</span>
              <span className="settings-info-item__label">Entri</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__val">{recycleBin.length}</span>
              <span className="settings-info-item__label">Recycle Bin</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__val">AES-256</span>
              <span className="settings-info-item__label">Enkripsi</span>
            </div>
            <div className="settings-info-item">
              <span className="settings-info-item__val">v1.0</span>
              <span className="settings-info-item__label">Versi</span>
            </div>
          </div>
        </section>

        {/* Sesi */}
        <section className="settings-section">
          <h3 className="settings-section-title">Sesi</h3>
          <button className="btn btn-ghost settings-lock-btn" onClick={lock}>
            🔒 Kunci Vault Sekarang
          </button>
        </section>

        {/* Install Guide */}
        <section className="settings-section">
          <h3 className="settings-section-title">Install Aplikasi (PWA)</h3>
          <div className="settings-install-guide">
            <div className="install-guide__item">
              <span className="install-guide__platform">📱 Android</span>
              <span className="install-guide__step">Chrome → ⋮ → &quot;Tambahkan ke layar utama&quot;</span>
            </div>
            <div className="install-guide__item">
              <span className="install-guide__platform">🍎 iOS</span>
              <span className="install-guide__step">Safari → Share → &quot;Tambahkan ke Layar Utama&quot;</span>
            </div>
            <div className="install-guide__item">
              <span className="install-guide__platform">💻 Desktop</span>
              <span className="install-guide__step">Klik ikon ⊕ di address bar browser</span>
            </div>
          </div>
        </section>

        <div className="settings-signature">
          <span>🔐 Vault Next v1.0</span>
          <span>·</span>
          <span>100% Offline</span>
          <span>·</span>
          <span>AES-256-GCM · PBKDF2</span>
        </div>
      </div>

      {showBackup && <BackupModal onClose={() => setShowBackup(false)} />}
    </>
  );
}
