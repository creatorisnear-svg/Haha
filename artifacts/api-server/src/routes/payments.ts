import { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { computePricing } from "../lib/pricing";

const router = Router();

async function getStripe(): Promise<Stripe | null> {
  const secret = await storage.getSetting("stripe_secret_key");
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: "2025-03-31.basil" });
}

router.get("/config", async (_req, res) => {
  const publishableKey = await storage.getSetting("stripe_publishable_key");
  res.json({ publishableKey: publishableKey ?? null });
});

router.post("/payments/intent", async (req, res) => {
  const stripe = await getStripe();
  if (!stripe) return res.status(503).json({ error: "Payment not configured yet. Add Stripe keys in the admin panel." });

  const { items, promoCode } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: "No items" });

  try {
    const pricing = await computePricing(items, promoCode);

    if (pricing.total <= 0) {
      return res.status(400).json({
        error: "Order total must be greater than zero. Please remove the promo code or adjust your cart.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.total,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        ...(pricing.appliedPromoCode ? { promoCode: pricing.appliedPromoCode } : {}),
        ...(pricing.discountAmount > 0 ? { discountAmount: String(pricing.discountAmount) } : {}),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      total: pricing.total,
      appliedPromoCode: pricing.appliedPromoCode,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
