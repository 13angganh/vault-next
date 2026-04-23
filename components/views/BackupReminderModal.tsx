'use client';

/**
 * Vault Next — BackupReminderModal
 * Modal pengingat backup otomatis.
 * Muncul jika (now - lastBackup) > backupIntervalHrs dan belum dismiss hari ini.
 * Sesi 5. Sesi 6: + focus trap, ARIA alertdialog.
 */

import { useEffect, useState } from 'react';
import { useAppStore }          from '@/lib/store/appStore';
import { lsGet, lsSet, lsGetNum, LS_BACKUP, LS_BKPDISM, LS_BKPIVL } from '@/lib/storage';
import { useFocusTrap }         from '@/lib/hooks/useFocusTrap';

interface BackupReminderModalProps {
  onOpenBackup: () => void; // buka BackupModal
}

export function BackupReminderModal({ onOpenBackup }: BackupReminderModalProps) {
  const [visible, setVisible] = useState(false);
  const backupIntervalHrs = useAppStore((s) => s.backupIntervalHrs);
  const isUnlocked        = useAppStore((s) => s.isUnlocked);

  useEffect(() => {
    if (!isUnlocked) return;

    const interval = lsGetNum(LS_BKPIVL, backupIntervalHrs);
    if (interval === 0) return; // Nonaktif

    const lastBackup   = lsGetNum(LS_BACKUP, 0);
    const lastDismiss  = lsGetNum(LS_BKPDISM, 0);
    const now          = Date.now();

    // Belum pernah backup → tampilkan setelah 24 jam pertama
    const intervalMs = interval * 60 * 60 * 1000;
    const overdueMs  = lastBackup === 0
      ? 24 * 60 * 60 * 1000  // first time: tampilkan setelah 24 jam
      : intervalMs;

    const isOverdue  = (now - lastBackup) > overdueMs;
    // Dismiss per-hari: hanya tampilkan sekali per 24 jam meski overdue
    const dismissedToday = (now - lastDismiss) < 24 * 60 * 60 * 1000;

    if (isOverdue && !dismissedToday) {
      // Delay sedikit agar tidak langsung muncul saat unlock
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, backupIntervalHrs]);

  const handleDismiss = () => {
    lsSet(LS_BKPDISM, String(Date.now()));
    setVisible(false);
  };

  const handleBackupNow = () => {
    lsSet(LS_BKPDISM, String(Date.now()));
    setVisible(false);
    onOpenBackup();
  };

  // Focus trap aktif hanya saat visible
  const trapRef = useFocusTrap<HTMLDivElement>(visible, handleDismiss);

  if (!visible) return null;

  const lastBackupTs = lsGetNum(LS_BACKUP, 0);
  const lastBackupStr = lastBackupTs === 0
    ? 'Belum pernah'
    : new Date(lastBackupTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      className="modal-overlay backup-reminder-overlay"
      style={{ zIndex: 9999 }}
      onClick={handleDismiss}
    >
      <div
        ref={trapRef}
        className="modal backup-reminder-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="backup-reminder-title"
        aria-describedby="backup-reminder-desc"
        onClick={(e) => e.stopPropagation()}
      >
        
        <h3 className="backup-reminder__title" id="backup-reminder-title">Sudah waktunya backup!</h3>
        <p className="backup-reminder__desc" id="backup-reminder-desc">
          Backup terakhir: <strong>{lastBackupStr}</strong>
        </p>
        <p className="backup-reminder__desc" style={{ fontSize: 'var(--text-sm)', opacity: 0.7, marginTop: 4 }}>
          Backup rutin melindungi data kamu dari kehilangan yang tidak terduga.
        </p>

        <div className="backup-reminder__actions">
          <button className="btn btn-ghost" onClick={handleDismiss}>
            Nanti saja
          </button>
          <button className="btn btn-primary" onClick={handleBackupNow} autoFocus>
            Backup Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
