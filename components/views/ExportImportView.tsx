'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';
import { useVaultStore, type VaultEntry } from '@/lib/store/vaultStore';
import { useUIStore } from '@/lib/store/uiStore';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { deriveKey, encrypt, decrypt, type EncryptedPayload } from '@/lib/crypto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function entriesToCSV(entries: VaultEntry[]): string {
  const headers = [
    'Kategori', 'Judul', 'Username', 'Email', 'Password',
    'URL', 'Catatan', 'Nomor Kartu', 'Nama Pemegang', 'Kadaluarsa',
    'CVV', 'Wi-Fi SSID', 'Wi-Fi Password', 'Favorit', 'Dibuat', 'Diperbarui',
  ];

  const rows = entries.map((e) => [
    e.category,
    e.title,
    e.username ?? '',
    e.email ?? '',
    e.password ?? '',
    e.url ?? '',
    e.notes ?? '',
    e.cardNumber ?? '',
    e.cardHolder ?? '',
    e.cardExpiry ?? '',
    e.cardCVV ?? '',
    e.wifiSSID ?? '',
    e.wifiPassword ?? '',
    e.isFavorite ? 'Ya' : 'Tidak',
    formatDate(e.createdAt),
    formatDate(e.updatedAt),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ─── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-6)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Export Section ───────────────────────────────────────────────────────────

function ExportSection() {
  const { entries } = useVaultStore();
  const { toast } = useUIStore();
  const [showCSVWarning, setShowCSVWarning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportVault() {
    if (entries.length === 0) {
      toast.warning('Vault kosong, tidak ada data untuk diekspor.');
      return;
    }

    setIsExporting(true);
    try {
      const salt = storage.get(STORAGE_KEYS.SALT);
      const masterHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
      if (!salt || !masterHash) throw new Error('Key tidak ditemukan');

      const cryptoKey = await deriveKey(masterHash, salt);
      const json = JSON.stringify(entries, null, 2);
      const encrypted = await encrypt(json, cryptoKey);

      const exportData = {
        version: '1.0',
        app: 'vault-next',
        exportedAt: new Date().toISOString(),
        count: entries.length,
        payload: encrypted,
      };

      const filename = `vault-backup-${new Date().toISOString().slice(0, 10)}.vault`;
      downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');
      toast.success(`Berhasil mengekspor ${entries.length} entri sebagai ${filename}`);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengekspor vault. Coba lagi.');
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportCSV() {
    if (entries.length === 0) {
      toast.warning('Vault kosong, tidak ada data untuk diekspor.');
      return;
    }
    setShowCSVWarning(true);
  }

  function confirmExportCSV() {
    try {
      const csv = entriesToCSV(entries);
      const filename = `vault-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadFile(csv, filename, 'text/csv;charset=utf-8;');
      toast.success(`Berhasil mengekspor ${entries.length} entri ke CSV`);
      setShowCSVWarning(false);
    } catch {
      toast.error('Gagal mengekspor CSV.');
    }
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'rgba(240,165,0,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Download size={18} color="var(--gold)" />
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Ekspor Vault
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            {entries.length} entri tersimpan
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Export .vault */}
        <button
          onClick={handleExportVault}
          disabled={isExporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            cursor: isExporting ? 'wait' : 'pointer',
            textAlign: 'left',
            transition: 'border-color var(--transition-fast)',
            opacity: isExporting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold-border)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
        >
          <FileJson size={20} color="var(--gold)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Unduh file .vault
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Terenkripsi AES-256 · Aman untuk backup
            </div>
          </div>
          <ShieldCheck size={16} color="var(--gold)" />
        </button>

        {/* Export .csv */}
        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.4)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)'; }}
        >
          <FileSpreadsheet size={20} color="#ef4444" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Unduh file .csv
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
              Plaintext · Bisa dibuka di Excel / Sheets
            </div>
          </div>
          <AlertTriangle size={16} color="#ef4444" />
        </button>
      </div>

      {/* CSV Warning Modal */}
      {showCSVWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)',
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-6)',
            maxWidth: 400,
            width: '100%',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#ef4444' }}>
                Peringatan Keamanan
              </h3>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
              File CSV berisi <strong>semua password dan data sensitif dalam bentuk teks biasa</strong>.
              Siapapun yang mendapatkan file ini dapat membaca seluruh isinya.
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
              Gunakan hanya untuk transfer ke password manager lain atau keperluan darurat.
              Hapus file setelah selesai digunakan.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowCSVWarning(false)}
                style={{
                  flex: 1, padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer',
                  fontFamily: 'var(--font-outfit)',
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmExportCSV}
                style={{
                  flex: 1, padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: '#ef4444', border: 'none',
                  color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-outfit)',
                }}
              >
                Saya mengerti, Ekspor CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Import Section ───────────────────────────────────────────────────────────

function ImportSection() {
  const { entries, addEntry } = useVaultStore();
  const { toast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<{ count: number; file: File } | null>(null);

  async function processFile(file: File) {
    if (!file.name.endsWith('.vault')) {
      toast.error('Hanya file .vault yang didukung untuk impor.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.payload || !parsed.payload.iv || !parsed.payload.data) {
        toast.error('Format file .vault tidak valid.');
        return;
      }

      setPreview({ count: parsed.count ?? '?', file });
    } catch {
      toast.error('File tidak bisa dibaca. Pastikan file tidak rusak.');
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setIsImporting(true);

    try {
      const salt = storage.get(STORAGE_KEYS.SALT);
      const masterHash = storage.get(STORAGE_KEYS.MASTER_PW_HASH);
      if (!salt || !masterHash) throw new Error('Key tidak ditemukan');

      const cryptoKey = await deriveKey(masterHash, salt);
      const text = await preview.file.text();
      const parsed = JSON.parse(text);
      const decrypted = await decrypt(parsed.payload as EncryptedPayload, cryptoKey);
      const importedEntries: VaultEntry[] = JSON.parse(decrypted);

      // Validate schema
      const valid = importedEntries.every(
        (e) => e.id && e.category && e.title && typeof e.createdAt === 'number'
      );
      if (!valid) throw new Error('Schema entri tidak valid');

      if (importMode === 'replace') {
        // Replace: clear existing then add all
        const { useVaultStore: store } = await import('@/lib/store/vaultStore');
        store.setState({ entries: [] });
        for (const e of importedEntries) {
          await addEntry(e);
        }
        toast.success(`Berhasil mengganti vault dengan ${importedEntries.length} entri`);
      } else {
        // Merge: skip duplicate IDs
        const existingIds = new Set(entries.map((e) => e.id));
        const toAdd = importedEntries.filter((e) => !existingIds.has(e.id));
        for (const e of toAdd) {
          await addEntry(e);
        }
        const skipped = importedEntries.length - toAdd.length;
        toast.success(
          `Berhasil mengimpor ${toAdd.length} entri${skipped > 0 ? `, ${skipped} duplikat dilewati` : ''}`
        );
      }

      setPreview(null);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengimpor. Periksa apakah file dibuat dengan vault yang sama.');
    } finally {
      setIsImporting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--radius-md)',
          background: 'rgba(96,165,250,0.12)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Upload size={18} color="#60a5fa" />
        </div>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Impor Vault
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
            Hanya file .vault yang terenkripsi
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {(['merge', 'replace'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setImportMode(mode)}
            style={{
              flex: 1,
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: importMode === mode ? 'rgba(96,165,250,0.15)' : 'var(--bg-hover)',
              border: `1px solid ${importMode === mode ? 'rgba(96,165,250,0.5)' : 'var(--border-subtle)'}`,
              color: importMode === mode ? '#60a5fa' : 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
              fontWeight: importMode === mode ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--font-outfit)',
              transition: 'all var(--transition-fast)',
            }}
          >
            {mode === 'merge' ? '🔀 Gabung' : '🔄 Ganti Semua'}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
        {importMode === 'merge'
          ? 'Entri baru ditambahkan, duplikat (ID sama) dilewati.'
          : 'Semua entri saat ini akan diganti dengan isi file impor.'}
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#60a5fa' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
          cursor: 'pointer',
          background: dragOver ? 'rgba(96,165,250,0.05)' : 'transparent',
          transition: 'all var(--transition-fast)',
        }}
      >
        <FolderOpen size={28} color={dragOver ? '#60a5fa' : 'var(--text-muted)'} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Seret file .vault ke sini<br />
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>atau klik untuk memilih file</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vault"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Preview confirm */}
      {preview && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(96,165,250,0.08)',
          border: '1px solid rgba(96,165,250,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <CheckCircle size={16} color="#60a5fa" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              File siap diimpor
            </span>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{preview.file.name}</strong>
            {' · '}{preview.count} entri
            {importMode === 'replace' && (
              <span style={{ color: '#ef4444' }}>{' · Akan mengganti semua entri saat ini!'}</span>
            )}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-outfit)',
              }}
            >
              Batal
            </button>
            <button
              onClick={confirmImport}
              disabled={isImporting}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: '#60a5fa', border: 'none',
                color: '#000', fontSize: 'var(--text-sm)', fontWeight: 600,
                cursor: isImporting ? 'wait' : 'pointer',
                fontFamily: 'var(--font-outfit)',
                opacity: isImporting ? 0.7 : 1,
              }}
            >
              {isImporting ? 'Mengimpor...' : 'Konfirmasi Impor'}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function ExportImportView() {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
      maxWidth: 600,
      width: '100%',
      margin: '0 auto',
      animation: 'fadeScaleIn var(--transition-slow) ease both',
    }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Ekspor &amp; Impor
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          Backup dan restore data vault kamu
        </p>
      </div>

      <ExportSection />
      <ImportSection />
    </div>
  );
}
