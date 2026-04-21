import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "vigr-dev-secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "omar1267";

function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SECRET).update(password).digest("hex");
}

function makeToken(timestamp: number): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(`admin:${timestamp}`).digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifyToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestamp, hmac] = parts;
  const ts = Number(timestamp);
  if (isNaN(ts)) return false;
  const age = Date.now() - ts;
  if (age > 1000 * 60 * 60 * 24 * 30) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(`admin:${timestamp}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"));
}

export async function verifyPassword(password: string): Promise<boolean> {
  return hashPassword(password) === hashPassword(ADMIN_PASSWORD);
}

export async function setPassword(_newPassword: string): Promise<void> {
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
