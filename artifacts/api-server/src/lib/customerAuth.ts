import crypto from "crypto";
import bcrypt from "bcryptjs";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SAFE_SECRET: string = SECRET;

const BCRYPT_ROUNDS = 12;
const CUSTOMER_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ── Password hashing ──────────────────────────────────────────────────────────
// Modern bcrypt-based hashing. Old HMAC-SHA256 hashes (64 hex chars) are still
// recognized for legacy login, then transparently upgraded to bcrypt.
export async function hashPasswordAsync(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyCustomerPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!password || !storedHash) return { valid: false, needsRehash: false };
  // Legacy HMAC-SHA256 hex (no prefix, 64 chars)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const legacy = crypto.createHmac("sha256", SAFE_SECRET).update(password).digest("hex");
    const a = Buffer.from(legacy, "hex");
    const b = Buffer.from(storedHash, "hex");
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    return { valid, needsRehash: valid };
  }
  // Bcrypt
  try {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

// ── Tokens ───────────────────────────────────────────────────────────────────
export function createCustomerToken(customerId: string): string {
  const ts = Date.now();
  const hmac = crypto.createHmac("sha256", SAFE_SECRET).update(`customer:${customerId}:${ts}`).digest("hex");
  return `${customerId}:${ts}:${hmac}`;
}

export function verifyCustomerToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [customerId, tsStr, hmac] = parts;
  const ts = Number(tsStr);
  if (isNaN(ts)) return null;
  if (Date.now() - ts > CUSTOMER_TOKEN_TTL_MS) return null;
  const expected = crypto.createHmac("sha256", SAFE_SECRET).update(`customer:${customerId}:${ts}`).digest("hex");
  try {
    const a = Buffer.from(hmac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return customerId;
}

export function customerAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const customerId = verifyCustomerToken(token);
  if (!customerId) return res.status(401).json({ error: "Unauthorized" });
  req.customerId = customerId;
  next();
}

// ── Generate a temporary password for admin-issued resets ───────────────────
export function generateTemporaryPassword(): string {
  // 12 chars, URL-safe, with mixed case and digits — easy to read aloud.
  return crypto.randomBytes(9).toString("base64url");
}
