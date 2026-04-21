import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "vigr-customer-secret";

export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SECRET).update(password).digest("hex");
}

export function createCustomerToken(customerId: string): string {
  const ts = Date.now();
  const hmac = crypto.createHmac("sha256", SECRET).update(`customer:${customerId}:${ts}`).digest("hex");
  return `${customerId}:${ts}:${hmac}`;
}

export function verifyCustomerToken(token: string): string | null {
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [customerId, tsStr, hmac] = parts;
  const ts = Number(tsStr);
  if (isNaN(ts)) return null;
  if (Date.now() - ts > 1000 * 60 * 60 * 24 * 30) return null; // 30 days
  const expected = crypto.createHmac("sha256", SECRET).update(`customer:${customerId}:${ts}`).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch { return null; }
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
