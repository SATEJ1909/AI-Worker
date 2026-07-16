// ─── AES-256-GCM Token Encryption ───────────────────────────────────────────
//
// Encrypts and decrypts sensitive tokens (e.g., GitHub access tokens) before
// persisting them to the database. Uses AES-256-GCM with a random IV per
// encryption call, producing a string in the format:  iv:authTag:ciphertext
// (all hex-encoded).

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING: BufferEncoding = 'hex';
const SEPARATOR = ':';

/**
 * Derives a 32-byte key from the raw secret. If the secret is already 64 hex
 * chars (32 bytes) it is used directly; otherwise it is hashed via SHA-256.
 */
function deriveKey(secret: string): Buffer {
    if (/^[0-9a-f]{64}$/i.test(secret)) {
        return Buffer.from(secret, 'hex');
    }

    // Hash arbitrary-length secrets to a fixed 32-byte key
    return createHash('sha256').update(secret).digest();
}

let _key: Buffer | null = null;

function getKey(): Buffer {
    if (_key) return _key;

    const secret = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET;
    if (!secret) {
        throw new Error(
            'FATAL: Neither TOKEN_ENCRYPTION_KEY nor JWT_SECRET is set. Cannot encrypt tokens.',
        );
    }

    _key = deriveKey(secret);
    return _key;
}

/**
 * Encrypt a plaintext token.
 * @returns  `iv:authTag:ciphertext` (all hex).
 */
export function encryptToken(plaintext: string): string {
    const key = getKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(plaintext, 'utf8', ENCODING);
    encrypted += cipher.final(ENCODING);

    const authTag = cipher.getAuthTag().toString(ENCODING);

    return [iv.toString(ENCODING), authTag, encrypted].join(SEPARATOR);
}

/**
 * Decrypt a token previously encrypted with `encryptToken()`.
 * @param ciphertext  Format: `iv:authTag:encrypted` (hex).
 */
export function decryptToken(ciphertext: string): string {
    const parts = ciphertext.split(SEPARATOR);
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }

    const ivHex = parts[0]!;
    const authTagHex = parts[1]!;
    const encryptedHex = parts[2]!;
    const key = getKey();
    const iv = Buffer.from(ivHex, ENCODING);
    const authTag = Buffer.from(authTagHex, ENCODING);

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted: string = decipher.update(encryptedHex, ENCODING, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Check whether a stored value looks like an encrypted token (iv:tag:data).
 * Useful for migrating existing plaintext tokens.
 */
export function isEncryptedToken(value: string): boolean {
    const parts = value.split(SEPARATOR);
    if (parts.length !== 3) return false;
    return /^[0-9a-f]{32}$/.test(parts[0]!) && /^[0-9a-f]{32}$/.test(parts[1]!);
}
