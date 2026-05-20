/**
 * Vault Next — lib/utils.ts
 * Utility functions yang dipakai di seluruh app.
 * F2-11: generateId dipindahkan dari komponen ke sini, ganti dengan crypto.randomUUID
 */

/**
 * Generate ID unik menggunakan Web Crypto API — collision-resistant.
 * Menggantikan implementasi Date.now() + Math.random() yang ada di EntryForm.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback untuk environment yang tidak support randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Truncate string ke panjang max, tambahkan ellipsis jika perlu.
 */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/**
 * Format bytes ke string yang readable.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
