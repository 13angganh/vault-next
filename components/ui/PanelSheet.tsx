'use client';

/** Sheet panel generik (bottom sheet di HP) — pola tunggal untuk PIN, Kesehatan Password, Backup, dll. */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function PanelSheet({ title, icon, onClose, children }: { title: string; icon?: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="modal-overlay ps-overlay" onClick={onClose}>
      <div className="modal ps-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <span className="modal__title">{icon && <span className="ps-icon">{icon}</span>}{title}</span>
          <button type="button" className="modal__close ibtn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
