'use client';

/**
 * Vault Next — BackupReminderModal
 * Sesi B: refactor pakai Button primitive.
 */

import { useEffect, useState } from 'react';
import { useAppStore }          from '@/lib/store/appStore';
import { lsSet, lsGetNum, LS_BACKUP, LS_BKPDISM, LS_BKPIVL } from '@/lib/storage';
import { useFocusTrap }         from '@/lib/hooks/useFocusTrap';
import { Button }               from '@/components/ui/primitives';

interface BackupReminderModalProps {
  onOpenBackup: () => void;
}

export function BackupReminderModal({ onOpenBackup }: BackupReminderModalProps) {
  const [visible, setVisible]     = useState(false);
  const backupIntervalHrs         = useAppStore((s) => s.backupIntervalHrs);
  const isUnlocked                = useAppStore((s) => s.isUnlocked);

  useEffect(() => {
    if (!isUnlocked) return;
    const interval = lsGetNum(LS_BKPIVL, backupIntervalHrs);
    if (interval === 0) return;
    const lastBackup  = lsGetNum(LS_BACKUP, 0);
    const lastDismiss = lsGetNum(LS_BKPDISM, 0);
    const now         = Date.now();
    const intervalMs  = interval * 60 * 60 * 1000;
    const overdueMs   = lastBackup === 0 ? 24 * 60 * 60 * 1000 : intervalMs;
    const isOverdue   = (now - lastBackup) > overdueMs;
    const dismissedToday = (now - lastDismiss) < 24 * 60 * 60 * 1000;
    if (isOverdue && !dismissedToday) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, backupIntervalHrs]);

  const handleDismiss   = () => { lsSet(LS_BKPDISM, String(Date.now())); setVisible(false); };
  const handleBackupNow = () => { lsSet(LS_BKPDISM, String(Date.now())); setVisible(false); onOpenBackup(); };

  const trapRef = useFocusTrap<HTMLDivElement>(visible, handleDismiss);
  if (!visible) return null;

  const lastBackupTs  = lsGetNum(LS_BACKUP, 0);
  const lastBackupStr = lastBackupTs === 0
    ? 'Belum pernah'
    : new Date(lastBackupTs).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="modal-overlay backup-reminder-overlay" style={{ zIndex: 9999 }} onClick={handleDismiss}>
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
          <Button variant="ghost" onClick={handleDismiss}>Nanti saja</Button>
          <Button variant="primary" onClick={handleBackupNow} autoFocus>Backup Sekarang</Button>
        </div>
      </div>
    </div>
  );
}
