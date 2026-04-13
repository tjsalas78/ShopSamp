/**
 * Session manager for encrypting and decrypting marketplace session tokens.
 * Uses AES-256-CBC encryption for security.
 */

import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits

export interface EncryptedSession {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded IV
  tag?: string; // For GCM mode (future enhancement)
}

/**
 * Session manager - handles encryption/decryption of sensitive session data
 */
export class SessionManager {
  private encryptionKey: Buffer;

  constructor(encryptionKeyHex?: string) {
    // Use provided key or generate from ENCRYPTION_KEY env var
    const keySource = encryptionKeyHex || process.env.ENCRYPTION_KEY;

    if (!keySource) {
      throw new Error(
        'ENCRYPTION_KEY environment variable not set. ' +
          'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    // Convert hex string to buffer
    this.encryptionKey = Buffer.from(keySource, 'hex');

    if (this.encryptionKey.length !== KEY_LENGTH) {
      throw new Error(
        `Encryption key must be ${KEY_LENGTH * 8} bits (${KEY_LENGTH} bytes). ` +
          `Got ${this.encryptionKey.length} bytes instead.`
      );
    }
  }

  /**
   * Encrypt sensitive data (e.g., session tokens)
   */
  encrypt(data: string): EncryptedSession {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted: Buffer.from(encrypted, 'hex').toString('base64'),
        iv: iv.toString('base64'),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedSession: EncryptedSession): string {
    try {
      // Decode from base64
      const encrypted = Buffer.from(encryptedSession.encrypted, 'base64').toString('hex');
      const iv = Buffer.from(encryptedSession.iv, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, this.encryptionKey, iv);

      // Decrypt data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Encrypt session data (JSON serializable object)
   */
  encryptSession<T extends Record<string, unknown>>(data: T): EncryptedSession {
    return this.encrypt(JSON.stringify(data));
  }

  /**
   * Decrypt session data and parse JSON
   */
  decryptSession<T extends Record<string, unknown>>(
    encryptedSession: EncryptedSession
  ): T {
    const decrypted = this.decrypt(encryptedSession);
    return JSON.parse(decrypted) as T;
  }

  /**
   * Create a session manager instance with a new random key
   * Useful for testing
   */
  static createWithRandomKey(): SessionManager {
    const randomKey = crypto.randomBytes(KEY_LENGTH).toString('hex');
    return new SessionManager(randomKey);
  }

  /**
   * Validate that encryption/decryption works correctly
   */
  validateKey(): boolean {
    try {
      const testData = 'test-session-data-' + Date.now();
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return decrypted === testData;
    } catch {
      return false;
    }
  }
}

/**
 * Global session manager instance
 */
let globalSessionManager: SessionManager | null = null;

/**
 * Get or create the global session manager
 */
export function getSessionManager(): SessionManager {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager();
  }
  return globalSessionManager;
}

/**
 * Reset the global session manager (useful for testing)
 */
export function resetSessionManager(): void {
  globalSessionManager = null;
}
