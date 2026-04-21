import crypto from "crypto";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const SAFE_SECRET: string = SECRET;

const FALLBACK_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "omar1267";
const ADMIN_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const BCRYPT_ROUNDS = 12;

export async function verifyPassword(password: string): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0) return false;
  const stored = await storage.getSetting("admin_password_hash");
  if (stored) {
    try {
      return await bcrypt.compare(password, stored);
    } catch {
      return false;
    }
  }
  // First-run / migration path: compare against env-provided password,
  // and if it matches, persist a bcrypt hash so future checks use the DB.
  const a = Buffer.from(password);
  const b = Buffer.from(FALLBACK_ADMIN_PASSWORD);
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (matches) {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await storage.setSetting("admin_password_hash", hash);
    return true;
  }
  return false;
}

export async function setPassword(newPassword: string): Promise<void> {
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    throw new Error("Admin password must be at least 8 characters");
  }
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await storage.setSetting("admin_password_hash", hash);
}

function makeToken(timestamp: number): string {
  const hmac = crypto.createHmac("sha256", SAFE_SECRET).update(`admin:${timestamp}`).digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifyToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestamp, hmac] = parts;
  const ts = Number(timestamp);
  if (isNaN(ts)) return false;
  const age = Date.now() - ts;
  if (age < 0 || age > ADMIN_TOKEN_TTL_MS) return false;
  const expected = crypto.createHmac("sha256", SAFE_SECRET).update(`admin:${timestamp}`).digest("hex");
  const a = Buffer.from(hmac, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createToken(): string {
  return makeToken(Date.now());
}

export function adminAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
