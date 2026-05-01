'use client';

/**
 * Vault Next — CategoryManager
 * Sesi D: emoji picker diganti Lucide icon picker (M-13).
 * Backward-compat: data lama dengan emoji field di-handle via iconKey fallback.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Pencil, Plus, LayoutGrid, Trash2, AlertTriangle, Check } from 'lucide-react';
import { useAppStore }           from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES }    from '@/lib/types';
import type { CustomCategory }   from '@/lib/types';
import { Button, IconButton }    from '@/components/ui/primitives';
import { CUSTOM_CAT_ICONS, CategoryIcon } from '@/components/entries/CategoryIcon';

/* ── Daftar icon yang tersedia di picker ── */
const ICON_LIST: Array<{ key: string; label: string }> = [
  { key: 'Tag',          label: 'Tag'          },
  { key: 'Briefcase',    label: 'Kerja'        },
  { key: 'Home',         label: 'Rumah'        },
  { key: 'Heart',        label: 'Favorit'      },
  { key: 'Star',         label: 'Bintang'      },
  { key: 'Zap',          label: 'Kilat'        },
  { key: 'Shield',       label: 'Perisai'      },
  { key: 'ShieldCheck',  label: 'Shield cek'   },
  { key: 'Globe',        label: 'Web'          },
  { key: 'Camera',       label: 'Kamera'       },
  { key: 'Music',        label: 'Musik'        },
  { key: 'ShoppingCart', label: 'Belanja'      },
  { key: 'Car',          label: 'Mobil'        },
  { key: 'Plane',        label: 'Pesawat'      },
  { key: 'GraduationCap', label: 'Sekolah'    },
  { key: 'Wrench',       label: 'Teknis'       },
  { key: 'BookOpen',     label: 'Buku'         },
  { key: 'Coffee',       label: 'Kopi'         },
  { key: 'Palette',      label: 'Desain'       },
  { key: 'Users',        label: 'Tim'          },
  { key: 'Phone',        label: 'Telepon'      },
  { key: 'Key',          label: 'Kunci'        },
  { key: 'Lock',         label: 'Gembok'       },
  { key: 'Database',     label: 'Database'     },
  { key: 'Cloud',        label: 'Cloud'        },
  { key: 'Smartphone',   label: 'HP'           },
  { key: 'Monitor',      label: 'Komputer'     },
  { key: 'Headphones',   label: 'Headset'      },
  { key: 'DollarSign',   label: 'Uang'         },
  { key: 'PiggyBank',    label: 'Tabungan'     },
  { key: 'Wallet',       label: 'Dompet'       },
  { key: 'Receipt',      label: 'Nota'         },
  { key: 'TrendingUp',   label: 'Investasi'    },
  { key: 'Trophy',       label: 'Trofi'        },
  { key: 'Joystick',     label: 'Game'         },
  { key: 'Puzzle',       label: 'Puzzle'       },
  { key: 'Leaf',         label: 'Alam'         },
  { key: 'Flame',        label: 'Api'          },
  { key: 'Box',          label: 'Kotak'        },
  { key: 'Folder',       label: 'Folder'       },
  { key: 'Bookmark',     label: 'Bookmark'     },
  { key: 'Bell',         label: 'Notifikasi'   },
  { key: 'MapPin',       label: 'Lokasi'       },
  { key: 'Compass',      label: 'Kompas'       },
  { key: 'Send',         label: 'Kirim'        },
  { key: 'FileText',     label: 'Dokumen'      },
  { key: 'Mail',         label: 'Email'        },
  { key: 'Fingerprint',  label: 'Sidik jari'   },
];

const DEFAULT_ICON_KEY = 'Tag';

interface CategoryManagerProps {
  onClose?: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const customCats      = useAppStore((s) => s.customCats);
  const addCustomCat    = useAppStore((s) => s.addCustomCat);
  const removeCustomCat = useAppStore((s) => s.removeCustomCat);
  const setCustomCats   = useAppStore((s) => s.setCustomCats);

  const [mode,          setMode]          = useState<'list' | 'add' | 'edit'>('list');
  const [editTarget,    setEditTarget]    = useState<CustomCategory | null>(null);
  const [label,         setLabel]         = useState('');
  const [iconKey,       setIconKey]       = useState(DEFAULT_ICON_KEY);
  const [labelErr,      setLabelErr]      = useState('');
  const [showPicker,    setShowPicker]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'add') {
      setLabel(''); setIconKey(DEFAULT_ICON_KEY);
      setLabelErr(''); setShowPicker(false); setEditTarget(null);
    }
  }, [mode]);

  const openEdit = (cat: CustomCategory) => {
    setEditTarget(cat);
    setLabel(cat.label);
    setIconKey(cat.iconKey || DEFAULT_ICON_KEY);
    setLabelErr(''); setShowPicker(false); setMode('edit');
  };

  const handleSave = useCallback(() => {
    const trimmed = label.trim();
    if (!trimmed) { setLabelErr('Nama kategori wajib diisi'); return; }
    if (trimmed.length > 24) { setLabelErr('Maksimal 24 karakter'); return; }
    const allLabels = [
      ...DEFAULT_CATEGORIES.map((c) => c.label.toLowerCase()),
      ...customCats.filter((c) => c.id !== editTarget?.id).map((c) => c.label.toLowerCase()),
    ];
    if (allLabels.includes(trimmed.toLowerCase())) { setLabelErr('Nama kategori sudah ada'); return; }

    const newCat: CustomCategory = {
      id:      mode === 'add' ? `cat_${Date.now()}` : (editTarget?.id ?? `cat_${Date.now()}`),
      label:   trimmed,
      emoji:   iconKey,   // keep emoji field filled for backward-compat
      iconKey: iconKey,
    };

    if (mode === 'add') {
      addCustomCat(newCat);
    } else if (mode === 'edit' && editTarget) {
      setCustomCats(customCats.map((c) => c.id === editTarget.id ? newCat : c));
    }
    setMode('list');
  }, [label, iconKey, mode, editTarget, customCats, addCustomCat, setCustomCats]);

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) { removeCustomCat(id); setDeleteConfirm(null); }
    else setDeleteConfirm(id);
  };

  const totalCatCount  = DEFAULT_CATEGORIES.length + customCats.length;
  const customCatCount = customCats.length;

  /* ── Render form add/edit ── */
  if (mode === 'add' || mode === 'edit') {
    const SelectedIcon = CUSTOM_CAT_ICONS[iconKey] ?? CUSTOM_CAT_ICONS['Tag'];

    return (
      <div className="cat-manager-form">
        <div className="cat-manager-form__header">
          <IconButton icon={<ArrowLeft size={16} />} onClick={() => setMode('list')} aria-label="Kembali" />
          <h3>
            {mode === 'add'
              ? <><Plus size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Tambah Kategori</>
              : <><Pencil size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Edit Kategori</>
            }
          </h3>
        </div>

        {/* Icon selector button */}
        <div className="cat-manager-form__icon-row">
          <button
            className="cat-manager-form__icon-btn"
            onClick={() => setShowPicker((v) => !v)}
            aria-label="Pilih icon"
            aria-expanded={showPicker}
            type="button"
          >
            <span className="cat-manager-form__icon-preview">
              <SelectedIcon size={22} color="var(--gold)" strokeWidth={1.8} />
            </span>
            <span className="cat-manager-form__icon-hint">Tap untuk ganti icon</span>
          </button>
        </div>

        {/* Lucide icon picker */}
        {showPicker && (
          <div className="icon-picker" role="listbox" aria-label="Pilih icon kategori">
            {ICON_LIST.map(({ key, label: iconLabel }) => {
              const Icon = CUSTOM_CAT_ICONS[key];
              const isActive = key === iconKey;
              if (!Icon) return null;
              return (
                <button
                  key={key}
                  className={`icon-picker__item${isActive ? ' icon-picker__item--active' : ''}`}
                  onClick={() => { setIconKey(key); setShowPicker(false); }}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-label={iconLabel}
                  title={iconLabel}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {isActive && (
                    <span className="icon-picker__check">
                      <Check size={10} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Label input */}
        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label" htmlFor="cat-label">
            Nama Kategori <span style={{ color: 'var(--red)' }}>*</span>
          </label>
          <input
            id="cat-label"
            type="text"
            value={label}
            onChange={(e) => { setLabel(e.target.value); setLabelErr(''); }}
            placeholder="contoh: Kerja, Pribadi, Sekolah…"
            maxLength={24}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setMode('list');
            }}
          />
          {labelErr && <p className="form-error">{labelErr}</p>}
          <p className="form-hint">{label.trim().length}/24 karakter</p>
        </div>

        {/* Preview */}
        <div className="cat-manager-form__preview">
          <span>Preview:</span>
          <span className="cat-manager-form__preview-badge">
            <SelectedIcon size={14} strokeWidth={1.8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {label.trim() || 'Nama Kategori'}
          </span>
        </div>

        <div className="cat-manager-form__actions">
          <Button variant="ghost" onClick={() => setMode('list')}>Batal</Button>
          <Button variant="primary" onClick={handleSave}>{mode === 'add' ? 'Tambah' : 'Simpan'}</Button>
        </div>
      </div>
    );
  }

  /* ── Render list ── */
  return (
    <div className="cat-manager">
      <div className="cat-manager__header">
        {onClose && <IconButton icon={<ArrowLeft size={16} />} onClick={onClose} aria-label="Kembali" />}
        <h3>
          <LayoutGrid size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Kategori
        </h3>
        <span className="cat-manager__count">{totalCatCount}</span>
      </div>

      <div className="cat-manager__section-label">Bawaan</div>
      <div className="cat-manager__list">
        {DEFAULT_CATEGORIES.map((cat) => (
          <div key={cat.id} className="cat-manager__item cat-manager__item--default">
            <CategoryIcon catId={cat.id} size="sm" />
            <span className="cat-manager__item-label">{cat.label}</span>
            <span className="cat-manager__item-badge">Default</span>
          </div>
        ))}
      </div>

      <div className="cat-manager__section-label">
        Custom <span className="cat-manager__section-count">{customCatCount}</span>
      </div>

      {customCatCount === 0 ? (
        <div className="cat-manager__empty">
          <p>Belum ada kategori custom.</p>
          <p>Tap tombol + di bawah untuk menambahkan.</p>
        </div>
      ) : (
        <div className="cat-manager__list">
          {customCats.map((cat) => {
            const iconK = cat.iconKey || cat.emoji || DEFAULT_ICON_KEY;
            const CatIcon = CUSTOM_CAT_ICONS[iconK] ?? CUSTOM_CAT_ICONS['Tag'];
            return (
              <div key={cat.id} className="cat-manager__item">
                <span className="cat-manager__item-icon-wrap">
                  <CatIcon size={14} color="var(--muted)" strokeWidth={1.8} />
                </span>
                <span className="cat-manager__item-label">{cat.label}</span>
                <div className="cat-manager__item-actions">
                  <IconButton icon={<Pencil size={14} />} size="sm" onClick={() => openEdit(cat)} aria-label={`Edit ${cat.label}`} />
                  <IconButton
                    icon={deleteConfirm === cat.id ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                    size="sm" colorHover="del"
                    onClick={() => handleDelete(cat.id)}
                    aria-label={deleteConfirm === cat.id ? `Konfirmasi hapus ${cat.label}` : `Hapus ${cat.label}`}
                    title={deleteConfirm === cat.id ? 'Tap sekali lagi untuk konfirmasi' : 'Hapus'}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button variant="primary" className="cat-manager__add-btn" onClick={() => setMode('add')} leftIcon={<Plus size={16} />}>
        Tambah Kategori
      </Button>
    </div>
  );
}
