/**
 * Panjang PIN — dipilih saat PIN dibuat (4 atau 6 digit) dan DIPAKAI layar login,
 * sehingga Pengaturan dan Login selalu sinkron. `null` = PIN lama (sebelum v2) dengan panjang bebas 4–8.
 */
export type PinLength = 4 | 6;
export const DEFAULT_PIN_LENGTH: PinLength = 6;
const KEY = 'vault_pin_len';

export function getPinLength(): PinLength | null {
  try { const v = localStorage.getItem(KEY); return v === '4' ? 4 : v === '6' ? 6 : null; } catch { return null; }
}
export function setPinLength(n: PinLength): void {
  try { localStorage.setItem(KEY, String(n)); } catch { /* abaikan */ }
}
export function clearPinLength(): void {
  try { localStorage.removeItem(KEY); } catch { /* abaikan */ }
}
