/**
 * Browser-native PBKDF2-SHA-256 password hashing utilities.
 *
 * Uses the Web Crypto API (available in all modern browsers and Node 18+)
 * so no external dependencies are required.
 *
 * Scheme:  PBKDF2 · SHA-256 · 210,000 iterations · 32-byte key · 16-byte random salt
 * Format:  "<base64_salt>:<base64_hash>"  stored in localStorage
 *
 * 210,000 iterations matches OWASP 2023 recommended minimum for PBKDF2-SHA-256.
 */

const ITERATIONS = 210_000;
const KEY_LENGTH  = 32; // bytes → 256-bit key
const SALT_LENGTH = 16; // bytes

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Hash a plaintext password.
 * Returns a storable string: "<base64_salt>:<base64_hash>"
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plaintext),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return `${toBase64(salt.buffer)}:${toBase64(derived)}`;
}

/**
 * Verify a plaintext password against a stored hash string.
 * Runs in constant time relative to the PBKDF2 work factor — the comparison
 * itself uses a timing-safe byte-by-byte XOR so a short-circuit equality check
 * cannot leak information about the correct value.
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt     = fromBase64(saltB64);
    expected = fromBase64(hashB64);
  } catch {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(plaintext),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as unknown as BufferSource, iterations: ITERATIONS },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  const actual = new Uint8Array(derived);

  // Timing-safe comparison
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual[i] ^ expected[i];
  }
  return diff === 0;
}

/**
 * Returns true if the string looks like a stored hash (salt:hash format).
 * Used to detect whether a value in localStorage is already hashed.
 */
export function isHashedPassword(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  // Both parts must be valid base64 of the expected byte lengths
  try {
    return fromBase64(parts[0]).length === SALT_LENGTH &&
           fromBase64(parts[1]).length === KEY_LENGTH;
  } catch {
    return false;
  }
}
