// Tiny in-memory sliding-window rate limiter keyed by IP + bucket.
// Suitable for low-volume admin/auth endpoints on a single instance.

interface Hit {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Hit>();

function getKey(req: any, bucket: string): string {
  const ip =
    (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) ||
    req.ip ||
    req.connection?.remoteAddress ||
    "unknown";
  return `${bucket}:${ip}`;
}

export function rateLimit(opts: { bucket: string; max: number; windowMs: number; message?: string }) {
  return (req: any, res: any, next: any) => {
    const key = getKey(req, opts.bucket);
    const now = Date.now();
    const hit = buckets.get(key);
    if (!hit || hit.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    hit.count += 1;
    if (hit.count > opts.max) {
      const retryAfter = Math.ceil((hit.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: opts.message ?? "Too many attempts. Please try again later.",
        retryAfter,
      });
    }
    next();
  };
}

// Periodic sweep of expired buckets to bound memory.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets.entries()) {
    if (v.resetAt < now) buckets.delete(k);
  }
}, 60_000).unref?.();
