import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  readonly #auth = inject(Auth);
  readonly #keyCache = new Map<string, CryptoKey>();

  async #deriveKeyFromGoogleUser(): Promise<CryptoKey> {
    const user = this.#auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use a combination of user UID and email as key material
    // This ensures keys are consistent across sessions but unique per user
    const keyMaterial = `${user.uid}-${user.email}`;

    // Check cache first
    if (this.#keyCache.has(keyMaterial)) {
      return this.#keyCache.get(keyMaterial)!;
    }

    // Import the key material
    const rawKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyMaterial.padEnd(32, '0').slice(0, 32)),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive a proper encryption key using PBKDF2
    const salt = new TextEncoder().encode(user.uid); // Use UID as salt
    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      rawKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Cache the key for this session
    this.#keyCache.set(keyMaterial, derivedKey);
    return derivedKey;
  }

  public async encryptText(text: string): Promise<string>;
  public async encryptText(text: undefined): Promise<undefined>;
  public async encryptText(text?: string): Promise<string | undefined>;
  public async encryptText(text?: string): Promise<string | undefined> {
    if (!text) {
      return undefined;
    }

    const key = await this.#deriveKeyFromGoogleUser();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedText
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  public async decryptText(encryptedText: string): Promise<string>;
  public async decryptText(encryptedText: undefined): Promise<undefined>;
  public async decryptText(encryptedText?: string): Promise<string | undefined>;
  public async decryptText(encryptedText?: string): Promise<string | undefined> {
    if (!encryptedText) {
      return undefined;
    }

    const key = await this.#deriveKeyFromGoogleUser();
    const combined = new Uint8Array(atob(encryptedText).split('').map(c => c.charCodeAt(0)));

    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  }

  // Clear cached keys when user signs out
  public clearKeyCache(): void {
    this.#keyCache.clear();
  }
}