/**
 * Vault Next — Crypto Engine
 * Port dari crypto.js versi lama. Format & algoritma TIDAK BOLEH BERUBAH.
 *
 * PBKDF2 Dua Lapis:
 *   Lapis 1: PBKDF2-SHA256, 600.000 iterasi
 *   Lapis 2: PBKDF2-SHA512, 100.000 iterasi (VER_ENHANCED = 0xAB)
 *
 * Format ciphertext: base64( iv[12] | salt[16] | ver[1] | aesGcmCipher )
 */

// ─── Konstanta ─────────────────────────────────────────────────────────────────
const VER_ENHANCED = 0xAB;
const PBKDF2_ITER_1 = 600_000;
const PBKDF2_ITER_2 = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Ubah ArrayBuffer ke base64 string (kompatibel dengan versi lama) */
function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/** Ubah base64 string ke Uint8Array */
function b64ToBuf(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Encode password ke UTF-8 bytes untuk PBKDF2 */
async function pwToKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ]);
}

// ─── Core: Derive Key ──────────────────────────────────────────────────────────

/**
 * Derive AES-256-GCM key dari password + salt.
 * enhanced=true → dua lapis PBKDF2 (VER_ENHANCED).
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  enhanced = true,
): Promise<CryptoKey> {
  const baseKey = await pwToKey(password);
  // Cast ke ArrayBuffer untuk kompatibilitas TypeScript strict
  const saltBuf = salt.buffer as ArrayBuffer;

  // Lapis 1: PBKDF2-SHA256 600k
  const round1 = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITER_1, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,          // extractable agar bisa masuk ke round 2
    ['encrypt', 'decrypt'],
  );

  if (!enhanced) return round1;

  // Lapis 2: export raw → import sebagai PBKDF2 → SHA-512 100k
  const rawRound1 = await crypto.subtle.exportKey('raw', round1);
  const baseKey2 = await crypto.subtle.importKey(
    'raw',
    rawRound1,
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const round2 = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: PBKDF2_ITER_2, hash: 'SHA-512' },
    baseKey2,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return round2;
}

// ─── generateSalt ──────────────────────────────────────────────────────────────

/** Generate salt acak 16 byte */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LEN));
}

// ─── sha256 ────────────────────────────────────────────────────────────────────

/** SHA-256 dari string → hex string */
export async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Alias sha256 */
export const hashStr = sha256;

// ─── Encrypt ──────────────────────────────────────────────────────────────────

/**
 * Enkripsi plaintext string dengan password.
 * Output: base64( iv[12] | salt[16] | ver[1] | ciphertext )
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = generateSalt();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt, true);

  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );

  // Gabung: iv | salt | ver | ciphertext
  const cipher = new Uint8Array(cipherBuf);
  const out = new Uint8Array(IV_LEN + SALT_LEN + 1 + cipher.byteLength);
  out.set(iv, 0);
  out.set(salt, IV_LEN);
  out[IV_LEN + SALT_LEN] = VER_ENHANCED;
  out.set(cipher, IV_LEN + SALT_LEN + 1);

  return bufToB64(out.buffer);
}

// ─── Decrypt ──────────────────────────────────────────────────────────────────

/**
 * Dekripsi base64 ciphertext dengan password.
 * Throws jika password salah atau data rusak.
 */
export async function decrypt(b64: string, password: string): Promise<string> {
  const buf = b64ToBuf(b64);

  const iv = buf.slice(0, IV_LEN);
  const salt = buf.slice(IV_LEN, IV_LEN + SALT_LEN);
  const ver = buf[IV_LEN + SALT_LEN];
  const cipher = buf.slice(IV_LEN + SALT_LEN + 1);

  const enhanced = ver === VER_ENHANCED;
  const key = await deriveKey(password, salt, enhanced);

  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plainBuf);
}
