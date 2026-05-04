import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      "ENCRYPTION_KEY is required. Generate a 32-byte base64 key and set it in .env.local."
    );
  }

  const key = /^[a-f0-9]{64}$/i.test(rawKey)
    ? Buffer.from(rawKey, "hex")
    : Buffer.from(rawKey, "base64");

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256-GCM.");
  }

  return key;
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedApiKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

export function decryptApiKey({
  encryptedApiKey,
  iv,
  authTag
}: {
  encryptedApiKey: string;
  iv: string;
  authTag: string;
}) {
  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedApiKey, "base64")),
    decipher.final()
  ]).toString("utf8");
}

export function maskApiKey(apiKey: string) {
  const suffix = apiKey.slice(-4);
  const prefix = apiKey.slice(0, 3);
  return `${prefix}****${suffix}`;
}
