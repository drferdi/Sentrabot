import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { AdapterContext, SecretRecord, SecretStore } from "@rakazo/adapter-kit";

function keyFrom(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export class EncryptedSecretStore implements SecretStore {
  constructor(private readonly encryptionKey: string) {}

  describe() {
    return {
      id: "app-encrypted",
      contractVersion: "1",
      adapterVersion: "0.1.0",
      capabilities: { rotate: true },
    };
  }

  async put(plaintext: string, _context: AdapterContext): Promise<SecretRecord> {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", keyFrom(this.encryptionKey), iv);
    const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    const ciphertext = Buffer.concat([iv, tag, enc]).toString("base64");
    return { id: randomBytes(12).toString("hex"), ciphertext };
  }

  async get(id: string, _context: AdapterContext): Promise<string> {
    throw new Error(`SecretStore.get requires persistence; use load(${id})`);
  }

  load(ciphertext: string): string {
    const buf = Buffer.from(ciphertext, "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", keyFrom(this.encryptionKey), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  }

  redact(value: string): string {
    return value
      .replace(/sk-[a-zA-Z0-9-_]{8,}/g, "[redacted]")
      .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[redacted]");
  }
}
