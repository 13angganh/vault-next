/**
 * Vault Next — lib/format.ts
 * Semua format tanggal dan angka terpusat di sini.
 * Standar: id-ID locale untuk konsistensi tampilan.
 */

/** Format tanggal saja: "6 Mei 2026" */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('id-ID', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });
}

/** Format tanggal dan waktu: "6 Mei 2026, 14.30" */
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('id-ID', {
    day:    'numeric',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}

/** Format waktu relatif: "2 hari lalu", "baru saja", dst. */
export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  const hours   = Math.floor(diff / 3_600_000);
  const days    = Math.floor(diff / 86_400_000);

  if (minutes < 1)   return 'Baru saja';
  if (minutes < 60)  return `${minutes} menit lalu`;
  if (hours   < 24)  return `${hours} jam lalu`;
  if (days    < 7)   return `${days} hari lalu`;
  if (days    < 30)  return `${Math.floor(days / 7)} minggu lalu`;
  if (days    < 365) return `${Math.floor(days / 30)} bulan lalu`;
  return `${Math.floor(days / 365)} tahun lalu`;
}

/** Format ukuran file: "1.2 KB", "3.4 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
