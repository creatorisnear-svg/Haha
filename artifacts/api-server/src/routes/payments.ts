import { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

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

  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: "No items" });

  try {
    const orderItems = await Promise.all(
      items.map(async (item: { productId: string; quantity: number }) => {
        const product = await storage.getProduct(item.productId);
        if (!product) throw new Error("Product not found");
        return { price: product.price, quantity: item.quantity };
      })
    );
    const amount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
