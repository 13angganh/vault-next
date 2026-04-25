'use client';

/**
 * Vault Next — BackupModal
 * Export backup .vault, Import backup .vault, Sync manual (copy-paste teks).
 * Sesi 5.
 */

import { useState, useRef }  from 'react';
import { X, Cloud, Upload, Download, RefreshCw, Eye, EyeOff, Copy, Check, AlertTriangle, Package, Plus, FolderOpen, ShieldCheck , Loader2 } from 'lucide-react';
import { useAppStore }        from '@/lib/store/appStore';
import { exportBackup, importBackup, saveVault } from '@/lib/vaultService';
import { lsSet, LS_BACKUP }  from '@/lib/storage';
import { useFocusTrap }       from '@/lib/hooks/useFocusTrap';
import type { VaultEntry, CustomCategory, VaultMeta } from '@/lib/types';

type Tab = 'export' | 'import' | 'sync';

interface BackupModalProps {
  onClose: () => void;
}

export function BackupModal({ onClose }: BackupModalProps) {
  const store      = useAppStore();
  const [tab, setTab] = useState<Tab>('export');

  // ── Export ───────────────────────────────────────────────────────────────────
  const [exporting,   setExporting]   = useState(false);
  const [exportDone,  setExportDone]  = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExport = async () => {
    setExporting(true); setExportError(''); setExportDone(false);
    try {
      const backup = await exportBackup(
        store.masterPw,
        store.vault,
        store.recycleBin,
        store.vaultMeta!,
        store.customCats,
        store.lockedIds,
      );
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const ts   = new Date().toISOString().slice(0, 10);
      a.href     = url;
      a.download = `vault-backup-${ts}.vault`;
      a.click();
      URL.revokeObjectURL(url);
      // Simpan timestamp backup
      lsSet(LS_BACKUP, String(Date.now()));
      setExportDone(true);
    } catch (e) {
      setExportError((e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // ── Focus Trap ────────────────────────────────────────────────────────────────
  const trapRef = useFocusTrap<HTMLDivElement>(true, onClose);

  // ── Import ───────────────────────────────────────────────────────────────────
  const fileRef     = useRef<HTMLInputElement>(null);
  const [importPw,      setImportPw]      = useState('');
  const [importPwShow,  setImportPwShow]  = useState(false);
  const [importFile,    setImportFile]    = useState<File | null>(null);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState<string>('');
  const [importError,   setImportError]   = useState('');
  const [importMode,    setImportMode]    = useState<'replace' | 'merge'>('replace');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImportFile(f);
    setImportResult(''); setImportError('');
  };

  const handleImport = async () => {
    if (!importFile) { setImportError('Pilih file .vault terlebih dahulu'); return; }
    if (!importPw)   { setImportError('Masukkan master password file backup'); return; }
    setImporting(true); setImportError(''); setImportResult('');
    try {
      const text    = await importFile.text();
      const payload = await importBackup(text, importPw);

      let finalVault   = payload.vault;
      let finalBin     = payload.recycleBin;
      let finalCats    = payload.customCats;
      let finalLocked  = payload.lockedIds;

      if (importMode === 'merge') {
        // Merge: gabungkan, hindari duplikat berdasarkan ID
        const existingIds = new Set(store.vault.map((e) => e.id));
        const newEntries  = payload.vault.filter((e) => !existingIds.has(e.id));
        finalVault  = [...store.vault, ...newEntries];
        finalBin    = [...store.recycleBin, ...payload.recycleBin.filter((e) => !existingIds.has(e.id))];
        // Merge custom cats
        const existingCatIds = new Set(store.customCats.map((c) => c.id));
        const newCats = payload.customCats.filter((c) => !existingCatIds.has(c.id));
        finalCats   = [...store.customCats, ...newCats];
        finalLocked = Array.from(new Set([...store.lockedIds, ...payload.lockedIds]));
      }

      // Update store
      store.setVault(finalVault);
      store.setRecycleBin(finalBin);
      store.setVaultMeta(payload.meta);
      store.setCustomCats(finalCats);
      store.setLockedIds(finalLocked);

      // Auto-save
      await saveVault(store.masterPw, finalVault, finalBin, payload.meta, finalCats, finalLocked);

      const added = importMode === 'merge'
        ? payload.vault.filter((e) => !store.vault.some((x) => x.id === e.id)).length
        : payload.vault.length;
      setImportResult(
        importMode === 'merge'
          ? `✅ Berhasil! ${added} entri baru ditambahkan (total: ${finalVault.length})`
          : `✅ Berhasil! Vault diganti dengan ${finalVault.length} entri dari backup.`,
      );
    } catch (e) {
      setImportError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  // ── Sync ─────────────────────────────────────────────────────────────────────
  const [syncText,     setSyncText]     = useState('');
  const [syncPw,       setSyncPw]       = useState('');
  const [syncPwShow,   setSyncPwShow]   = useState(false);
  const [syncMode,     setSyncMode]     = useState<'send' | 'receive'>('send');
  const [syncCopied,   setSyncCopied]   = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [syncResult,   setSyncResult]   = useState('');
  const [syncError,    setSyncError]    = useState('');

  const handleSyncGenerate = async () => {
    setSyncing(true); setSyncError(''); setSyncResult('');
    try {
      const backup = await exportBackup(
        store.masterPw,
        store.vault,
        store.recycleBin,
        store.vaultMeta!,
        store.customCats,
        store.lockedIds,
      );
      setSyncText(JSON.stringify(backup));
    } catch (e) {
      setSyncError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncCopy = async () => {
    await navigator.clipboard.writeText(syncText);
    setSyncCopied(true);
    setTimeout(() => setSyncCopied(false), 2000);
  };

  const handleSyncReceive = async () => {
    if (!syncText.trim()) { setSyncError('Tempel teks sync di atas'); return; }
    if (!syncPw)          { setSyncError('Masukkan master password perangkat pengirim'); return; }
    setSyncing(true); setSyncError(''); setSyncResult('');
    try {
      const payload = await importBackup(syncText, syncPw);
      store.setVault(payload.vault);
      store.setRecycleBin(payload.recycleBin);
      store.setVaultMeta(payload.meta);
      store.setCustomCats(payload.customCats);
      store.setLockedIds(payload.lockedIds);
      await saveVault(store.masterPw, payload.vault, payload.recycleBin, payload.meta, payload.customCats, payload.lockedIds);
      setSyncResult(`✅ Sync berhasil! ${payload.vault.length} entri dimuat.`);
    } catch (e) {
      setSyncError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // ── Escape key ───────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay backup-modal-overlay" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="modal backup-modal" ref={trapRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Backup & Sync" aria-labelledby="backup-modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="backup-modal-title"><Cloud size={18} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />Backup & Sync</h2>
          <button className="icon-btn modal__close" onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="backup-tabs">
          <button className={`backup-tab ${tab === 'export' ? 'backup-tab--active' : ''}`} onClick={() => setTab('export')}>
            <Upload size={14} /> Export
          </button>
          <button className={`backup-tab ${tab === 'import' ? 'backup-tab--active' : ''}`} onClick={() => setTab('import')}>
            <Download size={14} /> Import
          </button>
          <button className={`backup-tab ${tab === 'sync' ? 'backup-tab--active' : ''}`} onClick={() => setTab('sync')}>
            <RefreshCw size={14} /> Sync
          </button>
        </div>

        <div className="modal__body">
          <div className="backup-tabs-content">

          {/* ── EXPORT — always rendered ── */}
          <div className="backup-section backup-section--visible" style={{ display: tab === 'export' ? 'block' : 'none' }}>
              <div className="backup-info-box">
                <p>Export semua entri ke file <code>.vault</code> yang terenkripsi.</p>
                <p>File ini bisa diimport kembali di perangkat lain atau sebagai backup.</p>
              </div>

              <div className="backup-stat-row">
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.vault.length}</span>
                  <span className="backup-stat__label">Entri</span>
                </div>
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.recycleBin.length}</span>
                  <span className="backup-stat__label">Tong Sampah</span>
                </div>
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.customCats.length}</span>
                  <span className="backup-stat__label">Kat. Custom</span>
                </div>
              </div>

              {exportError && <p className="backup-error">{exportError}</p>}
              {exportDone  && <p className="backup-success"><Check size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> File backup berhasil diunduh!</p>}

              <button
                className="btn btn-primary backup-action-btn"
                onClick={handleExport}
                disabled={exporting || !store.vaultMeta}
              >
                {exporting ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Mengekspor…</> : <><Download size={14} /> Download Backup (.vault)</>}
              </button>
            </div>

          {/* ── IMPORT — always rendered ── */}
          <div className="backup-section" style={{ display: tab === 'import' ? 'block' : 'none' }}>
              <div className="backup-info-box backup-info-box--warn">
                <p><AlertTriangle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> Import akan memuat data dari file backup.</p>
                <p>Pilih mode <strong>Ganti</strong> atau <strong>Gabungkan</strong>.</p>
              </div>

              {/* Mode selector */}
              <div className="backup-mode-row">
                <button
                  className={`backup-mode-btn ${importMode === 'replace' ? 'backup-mode-btn--active' : ''}`}
                  onClick={() => setImportMode('replace')}
                >
                  <RefreshCw size={14} /> Ganti Semua
                </button>
                <button
                  className={`backup-mode-btn ${importMode === 'merge' ? 'backup-mode-btn--active' : ''}`}
                  onClick={() => setImportMode('merge')}
                >
                  <Plus size={14} /> Gabungkan
                </button>
              </div>
              <p className="backup-mode-desc">
                {importMode === 'replace'
                  ? 'Vault saat ini akan diganti sepenuhnya dengan isi backup.'
                  : 'Entri dari backup ditambahkan ke vault saat ini (duplikat ID dilewati).'}
              </p>

              {/* File picker */}
              <div className="form-group">
                <label className="form-label">File Backup (.vault)</label>
                <div className="backup-file-row">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".vault,.json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="import-file-input"
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() => fileRef.current?.click()}
                    type="button"
                  >
                    <FolderOpen size={14} /> Pilih File
                  </button>
                  <span className="backup-file-name">
                    {importFile ? importFile.name : 'Belum ada file dipilih'}
                  </span>
                </div>
              </div>

              {/* Password — ALWAYS rendered (bukan conditional) agar keyboard tidak hilang */}
              <div className="form-group">
                <label className="form-label" htmlFor="import-pw">Master Password (file backup)</label>
                <div className="pw-input-row">
                  <input
                    id="import-pw"
                    className="input"
                    type={importPwShow ? 'text' : 'password'}
                    value={importPw}
                    onChange={(e) => { setImportPw(e.target.value); setImportError(''); }}
                    placeholder="Password saat backup dibuat"
                    autoComplete="off"
                  />
                  <button
                    className="icon-btn pw-toggle"
                    onClick={() => setImportPwShow((v) => !v)}
                    type="button"
                    aria-label="Toggle visibility"
                  >
                    {importPwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {importError  && <p className="backup-error">{importError}</p>}
              {importResult && <p className="backup-success">{importResult}</p>}

              <button
                className="btn btn-primary backup-action-btn"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Mengimpor…</> : <><Download size={14} /> Import Backup</>}
              </button>
            </div>

          {/* ── SYNC — always rendered ── */}
          <div className="backup-section" style={{ display: tab === 'sync' ? 'block' : 'none' }}>
              <div className="backup-info-box">
                <p>Sync manual via copy-paste teks terenkripsi.</p>
                <p>Tidak butuh internet — 100% offline & aman.</p>
              </div>

              {/* Mode: Send / Receive */}
              <div className="backup-mode-row">
                <button
                  className={`backup-mode-btn ${syncMode === 'send' ? 'backup-mode-btn--active' : ''}`}
                  onClick={() => { setSyncMode('send'); setSyncText(''); setSyncResult(''); setSyncError(''); }}
                >
                  <Upload size={14} /> Kirim
                </button>
                <button
                  className={`backup-mode-btn ${syncMode === 'receive' ? 'backup-mode-btn--active' : ''}`}
                  onClick={() => { setSyncMode('receive'); setSyncText(''); setSyncResult(''); setSyncError(''); }}
                >
                  <Download size={14} /> Terima
                </button>
              </div>

              {/* SEND */}
              {syncMode === 'send' && (
                <>
                  <p className="backup-mode-desc">
                    Generate teks terenkripsi, salin, lalu tempel di perangkat penerima.
                  </p>
                  {!syncText ? (
                    <button
                      className="btn btn-primary backup-action-btn"
                      onClick={handleSyncGenerate}
                      disabled={syncing}
                    >
                      {syncing ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Membuat…</> : <><ShieldCheck size={14} /> Generate Teks Sync</>}
                    </button>
                  ) : (
                    <>
                      <textarea
                        className="sync-textarea"
                        readOnly
                        value={syncText}
                        rows={5}
                        aria-label="Teks sync terenkripsi"
                      />
                      <button
                        className={`btn ${syncCopied ? 'btn-success' : 'btn-primary'} backup-action-btn`}
                        onClick={handleSyncCopy}
                      >
                        {syncCopied ? '<Check size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}} /> Tersalin!' : <><Copy size={14} /> Salin Teks</>}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* RECEIVE */}
              {syncMode === 'receive' && (
                <>
                  <p className="backup-mode-desc">
                    Tempel teks sync dari perangkat pengirim, lalu masukkan passwordnya.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Teks Sync (dari perangkat lain)</label>
                    <textarea
                      className="sync-textarea"
                      value={syncText}
                      onChange={(e) => { setSyncText(e.target.value); setSyncError(''); }}
                      placeholder="Tempel teks sync di sini…"
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sync-pw">Master Password (perangkat pengirim)</label>
                    <div className="pw-input-row">
                      <input
                        id="sync-pw"
                        className="input"
                        type={syncPwShow ? 'text' : 'password'}
                        value={syncPw}
                        onChange={(e) => { setSyncPw(e.target.value); setSyncError(''); }}
                        placeholder="Password perangkat pengirim"
                        autoComplete="off"
                      />
                      <button
                        className="icon-btn pw-toggle"
                        onClick={() => setSyncPwShow((v) => !v)}
                        type="button"
                        aria-label="Toggle visibility"
                      >
                        {syncPwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary backup-action-btn"
                    onClick={handleSyncReceive}
                    disabled={syncing}
                  >
                    {syncing ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Menyinkronkan…</> : <><RefreshCw size={14} /> Terapkan Sync</>}
                  </button>
                </>
              )}

              {syncError  && <p className="backup-error">{syncError}</p>}
              {syncResult && <p className="backup-success">{syncResult}</p>}
            </div>

          </div>{/* end backup-tabs-content */}
        </div>
      </div>
    </div>
  );
}
