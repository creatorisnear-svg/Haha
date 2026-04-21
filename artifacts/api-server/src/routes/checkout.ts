import { Router } from "express";
import { storage } from "../storage";
import Stripe from "stripe";

const router = Router();

router.post("/checkout", async (req, res) => {
  const { items, successUrl, cancelUrl } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: "No items provided" });

  const secretKey = await storage.getSetting("stripe_secret_key");
  if (!secretKey) return res.status(400).json({ error: "Stripe not configured. Please ask the developer to set up Stripe in the admin panel." });

  const stripe = new Stripe(secretKey);

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] ?? "vaaclothing.xyz";
  const baseUrl = `https://${domain}`;

  const lineItems = await Promise.all(
    items.map(async (item: { productId: string; quantity: number }) => {
      const product = await storage.getProduct(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      return {
        price_data: {
          currency: "usd",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.description ?? undefined,
            images: product.imageUrl ? [product.imageUrl] : [],
          },
        },
        quantity: item.quantity,
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: successUrl ?? `${baseUrl}/?checkout=success`,
    cancel_url: cancelUrl ?? `${baseUrl}/?checkout=cancel`,
  });

  res.json({ url: session.url });
});

export default router;
