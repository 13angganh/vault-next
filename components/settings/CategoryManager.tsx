'use client';

/**
 * Vault Next — CategoryManager
 * Sesi D: emoji picker diganti Lucide icon picker (M-13).
 * Backward-compat: data lama dengan emoji field di-handle via iconKey fallback.
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, Check, Lock, Unlock, ListChecks, GripVertical } from 'lucide-react';
import { useAppStore }           from '@/lib/store/appStore';
import { DEFAULT_CATEGORIES }    from '@/lib/types';
import type { CustomCategory, CategoryFieldDef } from '@/lib/types';
import { isCategoryLocked }      from '@/lib/utils';
import { Button, IconButton, ConfirmDialog } from '@/components/ui/primitives';
import { useToast }              from '@/components/ui/Toast';
import { CUSTOM_CAT_ICONS, CategoryIcon } from '@/components/entries/CategoryIcon';
import { getBuiltinFieldsForCat, KNOWN_ENTRY_KEYS } from '@/components/entries/EntryForm';
import { saveVault }             from '@/lib/vaultService';

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
const DEFAULT_COLOR    = '#9ca3af'; // abu — nilai default, tidak disimpan ke DB

/** Palet warna preset untuk ikon kategori custom (12 warna harmonis) */
const PRESET_COLORS = [
  '#f0a500', // gold
  '#4d8eff', // blue
  '#ff4d6d', // red
  '#00d4aa', // teal
  '#a78bfa', // purple
  '#fb923c', // orange
  '#34d399', // green
  '#f472b6', // pink
  '#60a5fa', // light blue
  '#facc15', // yellow
  '#94a3b8', // slate
  '#9ca3af', // grey (default)
] as const;

interface CategoryManagerProps {
  onClose?: () => void;
}

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const customCats      = useAppStore((s) => s.customCats);
  const addCustomCat    = useAppStore((s) => s.addCustomCat);
  const removeCustomCat = useAppStore((s) => s.removeCustomCat);
  const setCustomCats   = useAppStore((s) => s.setCustomCats);
  // Diperlukan untuk saveVault agar customCats tersimpan di vault terenkripsi
  const masterPw        = useAppStore((s) => s.masterPw);
  const vault           = useAppStore((s) => s.vault);
  const recycleBin      = useAppStore((s) => s.recycleBin);
  const vaultMeta       = useAppStore((s) => s.vaultMeta);
  const lockedIds       = useAppStore((s) => s.lockedIds);
  // v1.10.0: state & action untuk lock/unlock KATEGORI (bukan entri) —
  // supaya tidak sengaja terhapus/berubah, mirip lockedIds untuk entri.
  const lockedCatIds       = useAppStore((s) => s.lockedCatIds);
  const toggleLockedCatId  = useAppStore((s) => s.toggleLockedCatId);
  // v1.10.0: dibutuhkan saat memanggil saveVault — parameter ke-8,
  // WAJIB disertakan agar tidak menimpa override field kategori default
  // jadi kosong secara diam-diam (pelajaran dari celah data-loss
  // lockedCatIds sebelumnya).
  const defaultCatFieldOverrides = useAppStore((s) => s.defaultCatFieldOverrides);
  const setDefaultCatFieldOverrides = useAppStore((s) => s.setDefaultCatFieldOverrides);

  const [mode,          setMode]          = useState<'list' | 'add' | 'edit' | 'edit-fields'>('list');
  const [editTarget,    setEditTarget]    = useState<CustomCategory | null>(null);
  const [label,         setLabel]         = useState('');
  const [iconKey,       setIconKey]       = useState(DEFAULT_ICON_KEY);
  const [color,         setColor]         = useState(DEFAULT_COLOR);
  const [labelErr,      setLabelErr]      = useState('');
  const [showPicker,    setShowPicker]    = useState(false);
  // v1.10.0: editor field per kategori (default maupun custom).
  // fieldsTargetId: id kategori yang sedang diedit field-nya (null = tidak
  // sedang mengedit). fieldsIsDefault: true jika target kategori default
  // (simpan ke defaultCatFieldOverrides), false jika custom (simpan ke
  // CustomCategory.fields). formFields: draft field yang sedang diedit,
  // belum disimpan sampai pengguna menekan Simpan.
  const [fieldsTargetId,  setFieldsTargetId]  = useState<string | null>(null);
  const [fieldsIsDefault, setFieldsIsDefault] = useState(false);
  const [formFields,      setFormFields]      = useState<CategoryFieldDef[]>([]);
  const [fieldsError,     setFieldsError]     = useState('');
  const [deleteTarget,  setDeleteTarget]  = useState<CustomCategory | null>(null);
  const [saving,        setSaving]        = useState(false); // v1.4.0: loading state
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    if (mode === 'add') {
      setLabel(''); setIconKey(DEFAULT_ICON_KEY); setColor(DEFAULT_COLOR);
      setLabelErr(''); setShowPicker(false); setEditTarget(null);
    }
  }, [mode]);

  const openEdit = (cat: CustomCategory) => {
    // v1.10.0: guard sama seperti handleDelete di atas.
    if (isCategoryLocked(cat.id, lockedCatIds)) return;
    setEditTarget(cat);
    setLabel(cat.label);
    setIconKey(cat.iconKey || DEFAULT_ICON_KEY);
    setColor(cat.color || DEFAULT_COLOR);
    setLabelErr(''); setShowPicker(false); setMode('edit');
  };

  /**
   * v1.10.0: buka editor field untuk kategori default ATAU custom.
   * isDefault menentukan tempat penyimpanan saat handleSaveFields
   * dipanggil nanti (defaultCatFieldOverrides vs CustomCategory.fields).
   * Guard isCategoryLocked sama seperti openEdit — kategori terkunci
   * tidak boleh diubah field-nya juga, bukan cuma nama/icon/warna.
   */
  const openFieldsEditor = (catId: string, isDefault: boolean, customCat?: CustomCategory) => {
    if (isCategoryLocked(catId, lockedCatIds)) return;
    setFieldsTargetId(catId);
    setFieldsIsDefault(isDefault);
    setFieldsError('');
    if (isDefault) {
      const override = defaultCatFieldOverrides[catId];
      setFormFields(override && override.length > 0 ? override : getBuiltinFieldsForCat(catId));
    } else {
      const existing = customCat?.fields;
      setFormFields(existing && existing.length > 0 ? existing : getBuiltinFieldsForCat('lainnya'));
    }
    setMode('edit-fields');
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
      color:   color !== DEFAULT_COLOR ? color : undefined,
    };

    // customCats sebelum diubah — untuk rollback jika saveVault gagal
    const prevCats = customCats;

    // v1.7.0: addCustomCat/setCustomCats bisa throw kalau localStorage
    // gagal (mis. kuota penuh) — lihat lib/store/appStore.ts. Sebelumnya
    // panggilan ini telanjang di sini, jadi exception-nya lolos ke luar
    // handleSave sebagai uncaught error di onClick handler. State memori
    // sendiri sudah aman (lsSetJson gagal → set() Zustand tidak pernah
    // tercapai), tapi pengguna tetap perlu tahu simpannya gagal, bukan
    // form macet tanpa penjelasan.
    let nextCats: CustomCategory[];
    try {
      if (mode === 'add') {
        nextCats = [...customCats, newCat];
        addCustomCat(newCat);
      } else {
        nextCats = customCats.map((c) => c.id === editTarget?.id ? newCat : c);
        setCustomCats(nextCats);
      }
    } catch {
      showToast('Gagal menyimpan kategori, coba lagi', 'error');
      return;
    }

    // Simpan ke vault terenkripsi agar persistens setelah restart
    if (masterPw && vaultMeta) {
      setSaving(true);
      saveVault(masterPw, vault, recycleBin, vaultMeta, nextCats, lockedIds, lockedCatIds, defaultCatFieldOverrides)
        .then(() => setMode('list'))
        .catch(() => {
          // Gagal simpan — rollback state kategori agar konsisten dgn disk,
          // dan beri tahu pengguna (sebelumnya ditelan diam-diam sambil UI
          // sudah terlanjur pindah ke tampilan list seolah sukses).
          // setCustomCats sendiri menulis ke localStorage — jika penyebab
          // kegagalan adalah kuota penuh, rollback ini pun bisa melempar,
          // jadi dibungkus agar tidak jadi exception baru yang tak tertangani.
          try { setCustomCats(prevCats); } catch { /* state memori tetap salah, tapi UI sudah diberi tahu */ }
          showToast('Gagal menyimpan kategori, coba lagi', 'error');
        })
        .finally(() => setSaving(false));
      return;
    }

    setMode('list');
  }, [label, iconKey, color, mode, editTarget, customCats, addCustomCat, setCustomCats,
      masterPw, vault, recycleBin, vaultMeta, lockedIds, lockedCatIds, defaultCatFieldOverrides, showToast]);

  const handleDelete = (id: string) => {
    // v1.10.0: guard defense-in-depth — tombol Hapus sudah disabled di UI
    // saat kategori terkunci, tapi cek ini memastikan aksi tetap
    // terblokir di sumbernya, bukan cuma mengandalkan atribut disabled
    // pada elemen tombol.
    if (isCategoryLocked(id, lockedCatIds)) return;
    const cat = customCats.find((c) => c.id === id);
    if (cat) setDeleteTarget(cat);
  };

  /**
   * v1.10.0: ubah label field kustom menjadi key yang aman dipakai
   * sebagai identifier di VaultEntry.customFields — lowercase, spasi/
   * karakter non-alfanumerik jadi underscore, prefix "custom_" agar
   * tidak mungkin bertabrakan dengan properti VaultEntry manapun
   * (dicek juga secara eksplisit terhadap KNOWN_ENTRY_KEYS saat validasi
   * simpan, ini lapis pertama pencegahan di titik pembuatan key).
   */
  const slugifyFieldKey = (label: string): string => {
    const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `custom_${slug || Date.now()}`;
  };

  const addNewField = () => {
    setFormFields((prev) => [
      ...prev,
      { key: `custom_new_${Date.now()}`, label: '', type: 'text' },
    ]);
  };

  const removeField = (key: string) => {
    setFormFields((prev) => prev.filter((f) => f.key !== key));
  };

  const updateFieldLabel = (key: string, label: string) => {
    setFormFields((prev) => prev.map((f) => {
      if (f.key !== key) return f;
      // v1.10.0: field BAWAAN (key sudah dikenal, mis. 'user'/'pass')
      // key-nya TIDAK ikut berubah walau labelnya diedit — key itu
      // menentukan properti VaultEntry mana yang dipakai, mengubahnya
      // akan memutus koneksi ke data lama yang sudah tersimpan. Hanya
      // field KUSTOM baru (key belum ada di KNOWN_ENTRY_KEYS DAN belum
      // pernah disimpan — ditandai prefix 'custom_new_') yang key-nya
      // ikut disinkronkan dari label saat pertama kali diketik.
      const isUnsavedNewCustomField = f.key.startsWith('custom_new_');
      return {
        ...f,
        label,
        key: isUnsavedNewCustomField ? slugifyFieldKey(label) : f.key,
      };
    }));
  };

  const updateFieldType = (key: string, type: CategoryFieldDef['type']) => {
    setFormFields((prev) => prev.map((f) => f.key === key ? { ...f, type } : f));
  };

  /**
   * v1.10.0: simpan draft formFields ke tujuan yang tepat — 
   * defaultCatFieldOverrides[fieldsTargetId] untuk kategori default,
   * atau CustomCategory.fields untuk kategori custom (update objek
   * kategori itu di dalam array customCats). Validasi: setiap field
   * harus punya label, tidak boleh ada key duplikat, dan key field
   * kustom tidak boleh bertabrakan dengan KNOWN_ENTRY_KEYS (yang akan
   * membuatnya salah dianggap field bawaan saat dirender).
   */
  const handleSaveFields = () => {
    if (!fieldsTargetId) return;

    const trimmedFields = formFields.map((f) => ({ ...f, label: f.label.trim() }));

    if (trimmedFields.length === 0) {
      setFieldsError('Minimal harus ada 1 field');
      return;
    }
    if (trimmedFields.some((f) => !f.label)) {
      setFieldsError('Semua field harus punya nama, tidak boleh kosong');
      return;
    }
    const keys = trimmedFields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      setFieldsError('Ada nama field yang menghasilkan key sama — ubah salah satu nama agar berbeda');
      return;
    }
    // Field kustom baru (belum disimpan, masih prefix custom_new_) tidak
    // boleh lolos ke penyimpanan dengan key sementara itu — seharusnya
    // sudah tersinkron dari label di updateFieldLabel, tapi field yang
    // ditambah lalu langsung disimpan tanpa sempat diketik labelnya akan
    // gagal di validasi label kosong di atas duluan, jadi baris ini
    // murni jaring pengaman kedua.
    if (keys.some((k) => k.startsWith('custom_new_'))) {
      setFieldsError('Ada field baru yang belum diberi nama');
      return;
    }

    const prevOverrides = defaultCatFieldOverrides;
    const prevCats = customCats;

    try {
      if (fieldsIsDefault) {
        setDefaultCatFieldOverrides(fieldsTargetId, trimmedFields);
      } else {
        const nextCats = customCats.map((c) =>
          c.id === fieldsTargetId ? { ...c, fields: trimmedFields } : c
        );
        setCustomCats(nextCats);
      }
    } catch {
      showToast('Gagal menyimpan field, coba lagi', 'error');
      return;
    }

    if (masterPw && vaultMeta) {
      setSaving(true);
      const nextOverrides = fieldsIsDefault
        ? { ...defaultCatFieldOverrides, [fieldsTargetId]: trimmedFields }
        : defaultCatFieldOverrides;
      const nextCats = fieldsIsDefault
        ? customCats
        : customCats.map((c) => c.id === fieldsTargetId ? { ...c, fields: trimmedFields } : c);
      saveVault(masterPw, vault, recycleBin, vaultMeta, nextCats, lockedIds, lockedCatIds, nextOverrides)
        .then(() => setMode('list'))
        .catch(() => {
          // Rollback — sama alasannya seperti handleSave di atas.
          try {
            if (fieldsIsDefault) {
              useAppStore.setState({ defaultCatFieldOverrides: prevOverrides });
            } else {
              setCustomCats(prevCats);
            }
          } catch { /* state memori tetap salah, tapi UI sudah diberi tahu */ }
          showToast('Gagal menyimpan field, coba lagi', 'error');
        })
        .finally(() => setSaving(false));
      return;
    }

    setMode('list');
  };

  /**
   * v1.10.0: kembalikan field kategori ke daftar bawaan (menghapus semua
   * kustomisasi). Untuk kategori default: hapus dari
   * defaultCatFieldOverrides sepenuhnya (getFieldsForCat lalu otomatis
   * fallback ke FIELDS_BY_CAT asli). Untuk kategori custom: kembalikan
   * ke draft (belum disimpan) berisi field 'lainnya' bawaan — pengguna
   * tetap perlu menekan Simpan untuk benar-benar menerapkannya, murni
   * mengisi ulang draft form, bukan langsung menulis ke store.
   */
  const resetFieldsToDefault = () => {
    if (!fieldsTargetId) return;
    setFormFields(
      fieldsIsDefault ? getBuiltinFieldsForCat(fieldsTargetId) : getBuiltinFieldsForCat('lainnya')
    );
    setFieldsError('');
  };

  const totalCatCount  = DEFAULT_CATEGORIES.length + customCats.length;
  const customCatCount = customCats.length;

  /* ── Render form edit fields (v1.10.0) ── */
  if (mode === 'edit-fields') {
    const targetLabel = fieldsIsDefault
      ? DEFAULT_CATEGORIES.find((c) => c.id === fieldsTargetId)?.label ?? ''
      : customCats.find((c) => c.id === fieldsTargetId)?.label ?? '';

    return (
      <>
      <div className="cat-manager-page">
        <div className="page-header">
          <button className="page-header__back" onClick={() => setMode('list')} aria-label="Kembali">
            <ArrowLeft size={18} />
          </button>
          <h2 className="page-header__title">Field: {targetLabel}</h2>
        </div>

        <div className="cat-manager-form-body">
          <p className="form-hint">
            Atur field apa saja yang muncul di form saat menambah/edit entri kategori ini.
            Field bawaan tidak bisa dihapus, tapi namanya bisa diubah.
          </p>

          <div className="field-editor-list">
            {formFields.map((f) => {
              const isBuiltin = KNOWN_ENTRY_KEYS.has(f.key);
              return (
                <div key={f.key} className="field-editor-item">
                  <GripVertical size={14} className="field-editor-item__handle" aria-hidden="true" />
                  <div className="field-editor-item__inputs">
                    <input
                      type="text"
                      className="input"
                      value={f.label}
                      placeholder="Nama field, mis. Nomor Meja"
                      onChange={(e) => updateFieldLabel(f.key, e.target.value)}
                      maxLength={32}
                    />
                    <select
                      className="settings-select"
                      value={f.type ?? 'text'}
                      onChange={(e) => updateFieldType(f.key, e.target.value as CategoryFieldDef['type'])}
                      aria-label={`Tipe field ${f.label || 'baru'}`}
                    >
                      <option value="text">Teks</option>
                      <option value="password">Password</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                      <option value="textarea">Teks panjang</option>
                    </select>
                  </div>
                  {isBuiltin
                    ? <span className="field-editor-item__badge" title="Field bawaan — tidak bisa dihapus">Bawaan</span>
                    : (
                      <IconButton
                        icon={<Trash2 size={14} />}
                        size="sm" colorHover="del"
                        onClick={() => removeField(f.key)}
                        aria-label={`Hapus field ${f.label || 'ini'}`}
                      />
                    )
                  }
                </div>
              );
            })}
          </div>

          {fieldsError && <p className="form-error">{fieldsError}</p>}

          <Button variant="ghost" onClick={addNewField} style={{ width: '100%' }}>
            <Plus size={14} /> Tambah Field
          </Button>

          <button type="button" className="field-editor__reset-link" onClick={resetFieldsToDefault}>
            Kembalikan ke field bawaan
          </button>

          <div className="cat-manager-form__actions">
            <Button variant="ghost" onClick={() => setMode('list')}>Batal</Button>
            <Button variant="primary" onClick={handleSaveFields} loading={saving} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </div>
      </div>
      <ToastContainer />
      </>
    );
  }

  /* ── Render form add/edit ── */
  if (mode === 'add' || mode === 'edit') {
    const SelectedIcon = CUSTOM_CAT_ICONS[iconKey] ?? CUSTOM_CAT_ICONS['Tag'];

    return (
      <>
      <div className="cat-manager-page">
        {/* Sticky header — konsisten dengan SettingsView & EntryForm */}
        <div className="page-header">
          <button className="page-header__back" onClick={() => setMode('list')} aria-label="Kembali">
            <ArrowLeft size={18} />
          </button>
          <h2 className="page-header__title">
            {mode === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}
          </h2>
        </div>

        <div className="cat-manager-form-body">
          {/* Icon selector button */}
          <div className="cat-manager-form__icon-row">
            <button
              className="cat-manager-form__icon-btn"
              onClick={() => setShowPicker((v) => !v)}
              aria-label="Pilih icon kategori"
              type="button"
            >
              <span className="cat-manager-form__icon-preview"
                style={{ backgroundColor: color !== DEFAULT_COLOR ? `${color}26` : undefined }}>
                <SelectedIcon size={22} color={color} strokeWidth={1.8} />
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

          {/* Color picker — pilih warna ikon */}
          <div className="form-group">
            <label className="form-label">Warna Ikon</label>
            <div className="color-picker" role="listbox" aria-label="Pilih warna ikon">
              {PRESET_COLORS.map((c) => {
                const isActive = c === color || (c === DEFAULT_COLOR && !color);
                return (
                  <button
                    key={c}
                    className={`color-picker__swatch${isActive ? ' color-picker__swatch--active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    type="button"
                    aria-selected={isActive}
                    aria-label={`Warna ${c}`}
                    title={c}
                  >
                    {isActive && <Check size={10} strokeWidth={3} color="#fff" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label input */}
          <div className="form-group">
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
            <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>{saving ? 'Menyimpan…' : (mode === 'add' ? 'Tambah' : 'Simpan')}</Button>
          </div>
        </div>
      </div>
      <ToastContainer />
      </>
    );
  }

  /* ── Render list ── */
  return (
    <>
    <div className="cat-manager-page">
      {/* Sticky header */}
      <div className="page-header">
        {onClose && (
          <button className="page-header__back" onClick={onClose} aria-label="Kembali ke pengaturan">
            <ArrowLeft size={18} />
          </button>
        )}
        <h2 className="page-header__title">Kelola Kategori</h2>
        <span className="cat-manager__count page-header__action">{totalCatCount}</span>
      </div>

      <div className="cat-manager-list-body">
        <div className="cat-manager__section-label">Bawaan</div>
        <div className="cat-manager__list">
          {DEFAULT_CATEGORIES.map((cat) => {
            const isLocked = isCategoryLocked(cat.id, lockedCatIds);
            return (
              <div key={cat.id} className="cat-manager__item cat-manager__item--default">
                <CategoryIcon catId={cat.id} size="sm" />
                <span className="cat-manager__item-label">{cat.label}</span>
                <span className="cat-manager__item-badge">Default</span>
                <div className="cat-manager__item-actions">
                  <IconButton
                    icon={<ListChecks size={14} />}
                    size="sm"
                    onClick={() => openFieldsEditor(cat.id, true)}
                    aria-label={`Kelola field ${cat.label}`}
                    disabled={isLocked}
                    title={isLocked ? 'Buka kunci dulu untuk kelola field' : 'Kelola field'}
                  />
                  <IconButton
                    icon={isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    size="sm"
                    colorHover="lock"
                    onClick={() => toggleLockedCatId(cat.id)}
                    aria-label={isLocked ? `Buka kunci kategori ${cat.label}` : `Kunci kategori ${cat.label}`}
                    title={isLocked ? 'Buka kunci' : 'Kunci'}
                  />
                </div>
              </div>
            );
          })}
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
              const iconK   = cat.iconKey || cat.emoji || DEFAULT_ICON_KEY;
              const CatIcon = CUSTOM_CAT_ICONS[iconK] ?? CUSTOM_CAT_ICONS['Tag'];
              const iconColor = cat.color ?? 'var(--muted)';
              const iconBg    = cat.color
                ? `${cat.color}26`   /* hex + alpha 15% */
                : 'rgba(156,163,175,0.15)';
              const isLocked = isCategoryLocked(cat.id, lockedCatIds);
              return (
                <div key={cat.id} className="cat-manager__item">
                  <span
                    className="cat-manager__item-icon-wrap"
                    style={{ backgroundColor: iconBg }}
                  >
                    <CatIcon size={14} color={iconColor} strokeWidth={1.8} />
                  </span>
                  <span className="cat-manager__item-label">{cat.label}</span>
                  <div className="cat-manager__item-actions">
                    <IconButton
                      icon={isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                      size="sm"
                      colorHover="lock"
                      onClick={() => toggleLockedCatId(cat.id)}
                      aria-label={isLocked ? `Buka kunci kategori ${cat.label}` : `Kunci kategori ${cat.label}`}
                      title={isLocked ? 'Buka kunci' : 'Kunci'}
                    />
                    <IconButton
                      icon={<ListChecks size={14} />}
                      size="sm"
                      onClick={() => openFieldsEditor(cat.id, false, cat)}
                      aria-label={`Kelola field ${cat.label}`}
                      disabled={isLocked}
                      title={isLocked ? 'Buka kunci dulu untuk kelola field' : 'Kelola field'}
                    />
                    <IconButton
                      icon={<Pencil size={14} />}
                      size="sm"
                      onClick={() => openEdit(cat)}
                      aria-label={`Edit ${cat.label}`}
                      disabled={isLocked}
                      title={isLocked ? 'Buka kunci dulu untuk edit' : 'Edit'}
                    />
                    <IconButton
                      icon={<Trash2 size={14} />}
                      size="sm" colorHover="del"
                      onClick={() => handleDelete(cat.id)}
                      aria-label={`Hapus ${cat.label}`}
                      disabled={isLocked}
                      title={isLocked ? 'Buka kunci dulu untuk hapus' : 'Hapus'}
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
    </div>

    {/* ── Confirm: Hapus Kategori ── */}
    <ConfirmDialog
      open={!!deleteTarget}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={() => {
        if (deleteTarget) {
          const prevCats = customCats; // untuk rollback jika saveVault gagal
          removeCustomCat(deleteTarget.id);
          // Simpan ke vault terenkripsi setelah hapus
          const nextCats = customCats.filter((c) => c.id !== deleteTarget.id);
          if (masterPw && vaultMeta) {
            saveVault(masterPw, vault, recycleBin, vaultMeta, nextCats, lockedIds, lockedCatIds, defaultCatFieldOverrides).catch(() => {
              try { setCustomCats(prevCats); } catch { /* state memori tetap salah, tapi UI sudah diberi tahu */ }
              showToast('Gagal menghapus kategori, coba lagi', 'error');
            });
          }
        }
        setDeleteTarget(null);
      }}
      title="Hapus Kategori?"
      message={
        deleteTarget
          ? <>Kategori <strong>{deleteTarget.label}</strong> akan dihapus. Entri dengan kategori ini tidak berubah.</>
          : undefined
      }
      confirmLabel="Hapus Kategori"
      variant="danger"
    />
    <ToastContainer />
    </>
  );
}
