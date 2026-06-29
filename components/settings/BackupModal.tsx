'use client';

/**
 * Vault Next — BackupModal
 * Backup .vault, Pulihkan .vault, Sinkron manual (copy-paste teks).
 * Sesi 5. Fix bahasa: Export→Backup, Import→Pulihkan, Sync→Sinkron.
 */

import { useState, useRef }  from 'react';
import { X, Cloud, Upload, Download, RefreshCw, Eye, EyeOff, Copy, Check, AlertTriangle, Plus, FolderOpen, ShieldCheck , Loader2 } from 'lucide-react';
import { useAppStore }        from '@/lib/store/appStore';
import { exportBackup, importBackup, saveVault } from '@/lib/vaultService';
import { lsSet, LS_BACKUP }  from '@/lib/storage';
import { exportVaultPdf }    from '@/lib/exportPdf';
import { APP_VERSION }       from '@/lib/constants';
import { Button, ErrorState, ConfirmDialog }  from '@/components/ui/primitives';
import { useFocusTrap }       from '@/lib/hooks/useFocusTrap';

type Tab = 'export' | 'import' | 'sync';

interface BackupModalProps {
  onClose: () => void;
}

export function BackupModal({ onClose }: BackupModalProps) {
  const store      = useAppStore();
  const [tab, setTab] = useState<Tab>('export');

  // ── Backup (Export) ───────────────────────────────────────────────────────────
  const [exporting,    setExporting]    = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportPdfDone,setExportPdfDone]= useState(false);
  const [exportDone,  setExportDone]  = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExport = async () => {
    if (!store.masterPw)  { setExportError('Sesi tidak aktif — buka vault dahulu'); return; }
    if (!store.vaultMeta) { setExportError('Vault belum dimuat — coba buka ulang aplikasi'); return; }
    setExporting(true); setExportError(''); setExportDone(false);
    try {
      const backup = await exportBackup(
        store.masterPw,
        store.vault,
        store.recycleBin,
        store.vaultMeta,
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
      // Harus append ke document agar bekerja di iOS Safari, Android WebView, dan PWA
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Tunda revoke agar browser sempat memulai download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  // ── Pulihkan (Import) ─────────────────────────────────────────────────────────
  const fileRef     = useRef<HTMLInputElement>(null);
  const [importPw,      setImportPw]      = useState('');
  const [importPwShow,  setImportPwShow]  = useState(false);
  const [importFile,    setImportFile]    = useState<File | null>(null);
  const [importing,     setImporting]     = useState(false);
  const [importResult,  setImportResult]  = useState<string>('');
  const [importError,   setImportError]   = useState('');
  const [importMode,    setImportMode]    = useState<'replace' | 'merge'>('replace');
  const [confirmImport, setConfirmImport] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setImportFile(f);
    setImportResult(''); setImportError('');
  };

  const handleExportPdf = async () => {
    if (!store.masterPw || !store.vaultMeta) return;
    setExportingPdf(true); setExportPdfDone(false);
    try {
      await exportVaultPdf({ vault: store.vault, customCats: store.customCats, appVersion: APP_VERSION });
      setExportPdfDone(true);
      lsSet(LS_BACKUP, String(Date.now()));
      setTimeout(() => setExportPdfDone(false), 3000);
    } catch { /* silent */ } finally { setExportingPdf(false); }
  };

  const handleImport = async () => {
    if (!importFile) { setImportError('Pilih file backup (.vault atau .json) terlebih dahulu'); return; }
    if (!importPw)   { setImportError('Masukkan master password file backup'); return; }
    // Ganti semua butuh konfirmasi sebelum eksekusi
    if (importMode === 'replace') { setConfirmImport(true); return; }
    await doImport();
  };

  const doImport = async () => {
    if (!importFile || !importPw) return;
    setImporting(true); setImportError(''); setImportResult('');
    // Snapshot state sebelum operasi async
    const currentMasterPw  = store.masterPw;
    const currentVault     = store.vault;
    const currentBin       = store.recycleBin;
    const currentCats      = store.customCats;
    const currentLocked    = store.lockedIds;
    try {
      const text    = await importFile.text();
      const payload = await importBackup(text, importPw);

      let finalVault   = payload.vault;
      let finalBin     = payload.recycleBin;
      let finalCats    = payload.customCats;
      let finalLocked  = payload.lockedIds;

      if (importMode === 'merge') {
        // Merge: gabungkan, hindari duplikat berdasarkan ID
        const existingIds = new Set(currentVault.map((e) => e.id));
        const newEntries  = payload.vault.filter((e) => !existingIds.has(e.id));
        finalVault  = [...currentVault, ...newEntries];
        finalBin    = [...currentBin, ...payload.recycleBin.filter((e) => !existingIds.has(e.id))];
        // Merge custom cats
        const existingCatIds = new Set(currentCats.map((c) => c.id));
        const newCats = payload.customCats.filter((c) => !existingCatIds.has(c.id));
        finalCats   = [...currentCats, ...newCats];
        finalLocked = Array.from(new Set([...currentLocked, ...payload.lockedIds]));
      }

      // Update store
      store.setVault(finalVault);
      store.setRecycleBin(finalBin);
      store.setVaultMeta(payload.meta);
      store.setCustomCats(finalCats);
      store.setLockedIds(finalLocked);

      // Simpan — pakai snapshot masterPw bukan store (hindari stale closure)
      await saveVault(currentMasterPw, finalVault, finalBin, payload.meta, finalCats, finalLocked);

      const added = importMode === 'merge'
        ? payload.vault.filter((e) => !currentVault.some((x) => x.id === e.id)).length
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

  // ── Sinkron (Sync) ────────────────────────────────────────────────────────────
  const [syncText,     setSyncText]     = useState('');
  const [syncPw,       setSyncPw]       = useState('');
  const [syncPwShow,   setSyncPwShow]   = useState(false);
  const [syncMode,     setSyncMode]     = useState<'send' | 'receive'>('send');
  const [syncCopied,   setSyncCopied]   = useState(false);
  const [syncing,      setSyncing]      = useState(false);
  const [syncResult,   setSyncResult]   = useState('');
  const [syncError,    setSyncError]    = useState('');
  const [confirmSync,  setConfirmSync]  = useState(false);

  const handleSyncGenerate = async () => {
    if (!store.masterPw)  { setSyncError('Sesi tidak aktif — buka vault dahulu'); return; }
    if (!store.vaultMeta) { setSyncError('Vault belum dimuat — coba buka ulang aplikasi'); return; }
    setSyncing(true); setSyncError(''); setSyncResult('');
    try {
      const backup = await exportBackup(
        store.masterPw,
        store.vault,
        store.recycleBin,
        store.vaultMeta,
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
    if (!syncText.trim()) { setSyncError('Tempel teks sinkron di atas terlebih dahulu'); return; }
    if (!syncPw)          { setSyncError('Masukkan master password perangkat pengirim'); return; }
    // Ganti vault butuh konfirmasi
    setConfirmSync(true);
  };

  const doSyncReceive = async () => {
    const currentMasterPw = store.masterPw;
    setSyncing(true); setSyncError(''); setSyncResult('');
    try {
      const payload = await importBackup(syncText, syncPw);
      store.setVault(payload.vault);
      store.setRecycleBin(payload.recycleBin);
      store.setVaultMeta(payload.meta);
      store.setCustomCats(payload.customCats);
      store.setLockedIds(payload.lockedIds);
      // Snapshot masterPw untuk hindari stale closure
      await saveVault(currentMasterPw, payload.vault, payload.recycleBin, payload.meta, payload.customCats, payload.lockedIds);
      setSyncResult(`✅ Sinkron berhasil! ${payload.vault.length} entri dimuat.`);
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
    <>
    <div className="modal-overlay backup-modal-overlay" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="modal backup-modal" ref={trapRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="backup-modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="backup-modal-title">
            <Cloud size={18} style={{ display:'inline', verticalAlign:'middle', marginRight:6 }} />
            Backup & Sinkron
          </h2>
          <button className="ibtn modal__close" onClick={onClose} aria-label="Tutup"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="backup-tabs">
          <button className={`backup-tab ${tab === 'export' ? 'backup-tab--active' : ''}`} onClick={() => setTab('export')}>
            <Upload size={14} /> Backup
          </button>
          <button className={`backup-tab ${tab === 'import' ? 'backup-tab--active' : ''}`} onClick={() => setTab('import')}>
            <Download size={14} /> Pulihkan
          </button>
          <button className={`backup-tab ${tab === 'sync' ? 'backup-tab--active' : ''}`} onClick={() => setTab('sync')}>
            <RefreshCw size={14} /> Sinkron
          </button>
        </div>

        <div className="modal__body">
          <div className="backup-tabs-content">

          {/* ── BACKUP (EXPORT) — always rendered ── */}
          <div className="backup-section backup-section--visible" style={{ display: tab === 'export' ? 'block' : 'none' }}>
              <div className="backup-info-box">
                <p>Backup semua entri ke file <code>.vault</code> yang terenkripsi.</p>
                <p>File ini bisa dipulihkan di perangkat lain atau disimpan sebagai cadangan.</p>
              </div>

              <div className="backup-stat-row">
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.vault.length}</span>
                  <span className="backup-stat__label">Entri</span>
                </div>
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.recycleBin.length}</span>
                  <span className="backup-stat__label">Sampah</span>
                </div>
                <div className="backup-stat">
                  <span className="backup-stat__val">{store.customCats.length}</span>
                  <span className="backup-stat__label">Kat. Custom</span>
                </div>
              </div>

              {exportError && (
                <ErrorState
                  title="Gagal membuat backup"
                  message={exportError}
                  className="backup-error-state"
                />
              )}
              {exportDone && (
                <p className="backup-success">
                  <Check size={14} style={{display:'inline', verticalAlign:'middle', marginRight:4}} /> File backup berhasil diunduh!
                </p>
              )}

              <Button variant="primary" className="backup-action-btn"
                onClick={handleExport}
                disabled={exporting || exportingPdf || !store.vaultMeta}
                loading={exporting}
              >
                {exporting ? 'Membuat backup…' : <><Download size={14} /> Unduh Backup (.vault)</>}
              </Button>
              <Button variant="ghost" className="backup-action-btn"
                onClick={handleExportPdf}
                disabled={exporting || exportingPdf || !store.vaultMeta}
                loading={exportingPdf}
                title="PDF berisi semua data vault — simpan di tempat aman"
              >
                {exportPdfDone ? <><Check size={14}/> PDF Tersimpan!</> : exportingPdf ? 'Membuat PDF…' : <><Download size={14}/> Export PDF</>}
              </Button>
            </div>

          {/* ── PULIHKAN (IMPORT) — always rendered ── */}
          <div className="backup-section" style={{ display: tab === 'import' ? 'block' : 'none' }}>
              <div className="backup-info-box backup-info-box--warn">
                <p><AlertTriangle size={14} style={{display:'inline', verticalAlign:'middle', marginRight:4}} /> Pulihkan akan memuat data dari file backup.</p>
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
                <label className="form-label">File Backup (.vault / .json)</label>
                <div className="backup-file-row">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".vault,.json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="import-file-input"
                  />
                  <Button variant="ghost" onClick={() => fileRef.current?.click()} leftIcon={<FolderOpen size={14} />}>
                    Pilih File
                  </Button>
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
                    className="ibtn pw-toggle"
                    onClick={() => setImportPwShow((v) => !v)}
                    type="button"
                    aria-label={importPwShow ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {importPwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {importError && (
                <ErrorState
                  title="Gagal memulihkan"
                  message={importError}
                  className="backup-error-state"
                />
              )}
              {importResult && <p className="backup-success">{importResult}</p>}
              <Button variant="primary" className="backup-action-btn" onClick={handleImport} disabled={importing}>
                {importing
                  ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Memulihkan…</>
                  : <><Download size={14} /> Pulihkan dari Backup</>}
              </Button>
            </div>

          {/* ── SINKRON — always rendered ── */}
          <div className="backup-section" style={{ display: tab === 'sync' ? 'block' : 'none' }}>
              <div className="backup-info-box">
                <p>Sinkron manual via copy-paste teks terenkripsi.</p>
                <p>Tidak butuh internet — 100% offline & aman.</p>
              </div>

              {/* Mode: Kirim / Terima */}
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

              {/* KIRIM */}
              {syncMode === 'send' && (
                <>
                  <p className="backup-mode-desc">
                    Buat teks terenkripsi, salin, lalu tempel di perangkat penerima.
                  </p>
                  {!syncText ? (
                     <Button variant="primary" className="backup-action-btn" onClick={handleSyncGenerate} disabled={syncing}>
                       {syncing
                         ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Membuat…</>
                         : <><ShieldCheck size={14} /> Buat Teks Sinkron</>}
                     </Button>
                  ) : (
                    <>
                      <textarea
                        className="sync-textarea"
                        readOnly
                        value={syncText}
                        rows={5}
                        aria-label="Teks sinkron terenkripsi"
                      />
                      <button
                        className={`btn ${syncCopied ? 'btn-success' : 'btn-primary'} backup-action-btn`}
                        onClick={handleSyncCopy}
                      >
                        {syncCopied
                          ? <><Check size={14} style={{display:'inline', verticalAlign:'middle', marginRight:4}} /> Tersalin!</>
                          : <><Copy size={14} /> Salin Teks</>}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* TERIMA */}
              {syncMode === 'receive' && (
                <>
                  <p className="backup-mode-desc">
                    Tempel teks sinkron dari perangkat pengirim, lalu masukkan passwordnya.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Teks Sinkron (dari perangkat lain)</label>
                    <textarea
                      className="sync-textarea"
                      value={syncText}
                      onChange={(e) => { setSyncText(e.target.value); setSyncError(''); }}
                      placeholder="Tempel teks sinkron di sini…"
                      rows={4}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      inputMode="text"
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
                        className="ibtn pw-toggle"
                        onClick={() => setSyncPwShow((v) => !v)}
                        type="button"
                        aria-label={syncPwShow ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {syncPwShow ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <Button variant="primary" className="backup-action-btn" onClick={handleSyncReceive} disabled={syncing}>
                    {syncing
                      ? <><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Menyinkronkan…</>
                      : <><RefreshCw size={14} /> Terapkan Sinkron</>}
                  </Button>
                </>
              )}

              {syncError && (
                <ErrorState
                  title="Gagal sinkron"
                  message={syncError}
                  className="backup-error-state"
                />
              )}
              {syncResult && <p className="backup-success">{syncResult}</p>}
            </div>

          </div>{/* end backup-tabs-content */}
        </div>
      </div>
    </div>

    {/* ── Confirm: Pulihkan Ganti Semua ── */}
    <ConfirmDialog
      open={confirmImport}
      onCancel={() => setConfirmImport(false)}
      onConfirm={() => { setConfirmImport(false); doImport(); }}
      title="Ganti Vault Sekarang?"
      message={
        importFile
          ? <>File <strong>{importFile.name}</strong> akan mengganti seluruh isi vault saat ini. Data yang tidak ada di backup tidak bisa dipulihkan.</>
          : 'Vault saat ini akan diganti sepenuhnya. Aksi ini tidak bisa dibatalkan.'
      }
      confirmLabel="Ganti Vault"
      variant="danger"
    />

    {/* ── Confirm: Sinkron Terima (Ganti Vault) ── */}
    <ConfirmDialog
      open={confirmSync}
      onCancel={() => setConfirmSync(false)}
      onConfirm={() => { setConfirmSync(false); doSyncReceive(); }}
      title="Terapkan Sinkron?"
      message="Vault saat ini akan diganti dengan data dari perangkat pengirim. Pastikan teks sinkron dan password sudah benar."
      confirmLabel="Terapkan"
      variant="danger"
    />
    </>
  );
}
