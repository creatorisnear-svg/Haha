import { Router } from "express";
import { storage } from "../storage";
import { sendNewsletterWelcome } from "../lib/email";
import { logger } from "../lib/logger";
import { rateLimit } from "../lib/rateLimit";

const router = Router();

const newsletterLimiter = rateLimit({
  bucket: "newsletter-subscribe",
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: "Too many newsletter sign-ups from this address. Please try again later.",
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/newsletter", newsletterLimiter, async (req, res) => {
  const raw = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!raw) return res.status(400).json({ error: "Email required" });
  if (!EMAIL_RE.test(raw) || raw.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  const isNew = await storage.subscribeNewsletter(raw);

  if (isNew) {
    sendNewsletterWelcome(raw).catch((err) =>
      logger.error({ err, email: raw }, "Failed to send newsletter welcome email"),
    );
  }

  res.json({
    success: true,
    message: isNew
      ? "Subscribed — check your inbox for a welcome email."
      : "You're already on the list.",
  });
});

const unsubscribeLimiter = rateLimit({
  bucket: "newsletter-unsubscribe",
  max: 10,
  windowMs: 60 * 60 * 1000,
  message: "Too many unsubscribe attempts. Please try again later.",
});

router.post("/newsletter/unsubscribe", unsubscribeLimiter, async (req, res) => {
  const raw = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!raw) return res.status(400).json({ error: "Email required" });
  if (!EMAIL_RE.test(raw) || raw.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  await storage.unsubscribeNewsletter(raw);

  // Always respond identically so we don't leak whether an email is on file.
  res.json({
    success: true,
    message: "If that email was subscribed, it has been removed from our list.",
  });
});

export default router;
