'use client';

/** Bottom-sheet pilihan (pengganti dropdown/geser). Dipakai: filter kategori, urutan, kategori di form entri. */
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

export interface SheetOption { id: string; label: string; icon?: ReactNode; meta?: string | number; hint?: string }

interface OptionSheetProps {
  open:     boolean;
  title:    string;
  options:  SheetOption[];
  value:    string;
  onSelect: (id: string) => void;
  onClose:  () => void;
}

export function OptionSheet({ open, title, options, value, onSelect, onClose }: OptionSheetProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="os-overlay" onClick={onClose}>
      <div className="os-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="os-grab" aria-hidden="true" />
        <div className="os-head">
          <h3>{title}</h3>
          <button type="button" className="os-close" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="os-list" role="listbox" aria-label={title}>
          {options.map((o) => (
            <button key={o.id} type="button" role="option" aria-selected={value === o.id}
              className={`os-row${value === o.id ? ' os-row--on' : ''}`}
              onClick={() => { onSelect(o.id); onClose(); }}>
              {o.icon && <span className="os-row__icon">{o.icon}</span>}
              <span className="os-row__text"><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</span>
              {o.meta != null && <em>{o.meta}</em>}
              <span className="os-row__check">{value === o.id && <Check size={18} />}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
