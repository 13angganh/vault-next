'use client';

/**
 * Vault Next — CategoryManager
 * Kelola kategori custom: tambah, edit, hapus.
 * Sesi 5: Emoji picker inline + validasi.
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Pencil, Plus, LayoutGrid, X, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore }         from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES }  from '@/lib/types';
import type { CustomCategory } from '@/lib/types';

// Daftar emoji populer untuk picker
const EMOJI_LIST = [
  '🔐','🔑','💡','📱','💻','🖥️','🌐','📧','📞','📷',
  '🎵','🎮','🎯','🏦','💳','💰','🛒','✈️','🏠','🚗',
  '🏥','📚','📝','🔧','⚙️','🎓','👔','🌟','❤️','🔥',
  '🍎','☕','🎨','🎪','🌈','⚡','🛡️','🗝️','📦','🌿',
  '🦊','🐉','🚀','🌙','☀️','💎','🎭','🏆','📌','🔔',
];

interface CategoryManagerProps {
  onClose?: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const customCats    = useAppStore((s) => s.customCats);
  const addCustomCat  = useAppStore((s) => s.addCustomCat);
  const removeCustomCat = useAppStore((s) => s.removeCustomCat);
  const setCustomCats = useAppStore((s) => s.setCustomCats);

  // Form state
  const [mode,      setMode]      = useState<'list' | 'add' | 'edit'>('list');
  const [editTarget, setEditTarget] = useState<CustomCategory | null>(null);
  const [label,     setLabel]     = useState('');
  const [emoji,     setEmoji]     = useState('🔑');
  const [labelErr,  setLabelErr]  = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Reset form when mode changes
  useEffect(() => {
    if (mode === 'add') {
      setLabel(''); setEmoji('🔑'); setLabelErr(''); setShowPicker(false);
      setEditTarget(null);
    }
  }, [mode]);

  const openEdit = (cat: CustomCategory) => {
    setEditTarget(cat);
    setLabel(cat.label);
    setEmoji(cat.emoji);
    setLabelErr('');
    setShowPicker(false);
    setMode('edit');
  };

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) { setLabelErr('Nama kategori wajib diisi'); return; }
    if (trimmed.length > 24) { setLabelErr('Maksimal 24 karakter'); return; }

    const allLabels = [
      ...DEFAULT_CATEGORIES.map((c) => c.label.toLowerCase()),
      ...customCats.filter((c) => c.id !== editTarget?.id).map((c) => c.label.toLowerCase()),
    ];
    if (allLabels.includes(trimmed.toLowerCase())) {
      setLabelErr('Nama kategori sudah ada'); return;
    }

    if (mode === 'add') {
      const newCat: CustomCategory = {
        id:    `cat_${Date.now()}`,
        label: trimmed,
        emoji,
      };
      addCustomCat(newCat);
    } else if (mode === 'edit' && editTarget) {
      const updated = customCats.map((c) =>
        c.id === editTarget.id ? { ...c, label: trimmed, emoji } : c,
      );
      setCustomCats(updated);
    }

    setMode('list');
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      removeCustomCat(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const defaultCatCount  = DEFAULT_CATEGORIES.length;
  const customCatCount   = customCats.length;
  const totalCatCount    = defaultCatCount + customCatCount;

  // ── Render: Form (add/edit) ──────────────────────────────────────────────────
  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="cat-manager-form">
        <div className="cat-manager-form__header">
          <button className="icon-btn" onClick={() => setMode('list')} aria-label="Kembali">
            <ArrowLeft size={16} />
          </button>
          <h3>{mode === 'add' ? <><Plus size={16} /> Tambah Kategori</> : <><Pencil size={16} /> Edit Kategori</>}</h3>
        </div>

        {/* Emoji preview + picker toggle */}
        <div className="cat-manager-form__emoji-row">
          <button
            className="cat-manager-form__emoji-btn"
            onClick={() => setShowPicker((v) => !v)}
            aria-label="Pilih emoji"
            type="button"
          >
            <span className="cat-manager-form__emoji-preview">{emoji}</span>
            <span className="cat-manager-form__emoji-hint">Tap untuk ganti</span>
          </button>
        </div>

        {/* Emoji picker inline grid */}
        {showPicker && (
          <div className="emoji-picker">
            {EMOJI_LIST.map((e) => (
              <button
                key={e}
                className={`emoji-picker__item ${e === emoji ? 'emoji-picker__item--active' : ''}`}
                onClick={() => { setEmoji(e); setShowPicker(false); }}
                type="button"
                aria-label={e}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Label input */}
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label" htmlFor="cat-label">
            Nama Kategori <span style={{ color: 'var(--c-error)' }}>*</span>
          </label>
          <input
            id="cat-label"
            className={`input ${labelErr ? 'input--error' : ''}`}
            type="text"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setLabelErr(''); }}
            placeholder="contoh: Kerja, Pribadi, Sekolah…"
            maxLength={24}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setMode('list'); }}
          />
          {labelErr && <p className="form-error">{labelErr}</p>}
          <p className="form-hint">{label.trim().length}/24 karakter</p>
        </div>

        {/* Preview */}
        <div className="cat-manager-form__preview">
          <span>Preview:</span>
          <span className="cat-manager-form__preview-badge">
            {emoji} {label.trim() || 'Nama Kategori'}
          </span>
        </div>

        <div className="cat-manager-form__actions">
          <button className="btn btn-ghost" onClick={() => setMode('list')}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {mode === 'add' ? 'Tambah' : 'Simpan'}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: List ─────────────────────────────────────────────────────────────
  return (
    <div className="cat-manager">
      <div className="cat-manager__header">
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Kembali"><ArrowLeft size={16} /></button>
        )}
        <h3><LayoutGrid size={16} style={{display:"inline",verticalAlign:"middle",marginRight:6}} />Kategori</h3>
        <span className="cat-manager__count">{totalCatCount}</span>
      </div>

      {/* Default categories (read-only) */}
      <div className="cat-manager__section-label">Bawaan</div>
      <div className="cat-manager__list">
        {DEFAULT_CATEGORIES.map((cat) => (
          <div key={cat.id} className="cat-manager__item cat-manager__item--default">
            <span className="cat-manager__item-emoji">{cat.emoji}</span>
            <span className="cat-manager__item-label">{cat.label}</span>
            <span className="cat-manager__item-badge">Default</span>
          </div>
        ))}
      </div>

      {/* Custom categories */}
      <div className="cat-manager__section-label">
        Custom
        <span className="cat-manager__section-count">{customCatCount}</span>
      </div>

      {customCatCount === 0 ? (
        <div className="cat-manager__empty">
          <p>Belum ada kategori custom.</p>
          <p>Tap tombol + di bawah untuk menambahkan.</p>
        </div>
      ) : (
        <div className="cat-manager__list">
          {customCats.map((cat) => (
            <div key={cat.id} className="cat-manager__item">
              <span className="cat-manager__item-emoji">{cat.emoji}</span>
              <span className="cat-manager__item-label">{cat.label}</span>
              <div className="cat-manager__item-actions">
                <button
                  className="icon-btn icon-btn--sm"
                  onClick={() => openEdit(cat)}
                  aria-label={`Edit ${cat.label}`}
                ><Pencil size={14} /></button>
                <button
                  className={`icon-btn icon-btn--sm ${deleteConfirm === cat.id ? 'icon-btn--danger' : ''}`}
                  onClick={() => handleDelete(cat.id)}
                  aria-label={deleteConfirm === cat.id ? `Konfirmasi hapus ${cat.label}` : `Hapus ${cat.label}`}
                  title={deleteConfirm === cat.id ? 'Tap sekali lagi untuk konfirmasi' : 'Hapus'}
                >
                  {deleteConfirm === cat.id ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        className="btn btn-primary cat-manager__add-btn"
        onClick={() => setMode('add')}
      >
        <><Plus size={16} /> Tambah Kategori</>
      </button>
    </div>
  );
}
