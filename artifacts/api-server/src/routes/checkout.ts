import { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { hashPassword, verifyCustomerToken, createCustomerToken } from "../lib/customerAuth";
import { sendOrderConfirmation } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

async function getStripe(): Promise<Stripe | null> {
  const secret = await storage.getSetting("stripe_secret_key");
  if (!secret) return null;
  return new Stripe(secret, { apiVersion: "2025-03-31.basil" });
}

router.post("/checkout", async (req, res) => {
  const { items, shippingAddress, email, phone, createAccount, password, paymentIntentId } = req.body;

  if (!items || !items.length) return res.status(400).json({ error: "No items provided" });
  if (!shippingAddress) return res.status(400).json({ error: "Shipping address required" });
  if (!email) return res.status(400).json({ error: "Email required" });

  // If Stripe is configured, verify the payment intent
  const stripe = await getStripe();
  if (stripe) {
    if (!paymentIntentId) return res.status(400).json({ error: "Payment not completed" });
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") return res.status(400).json({ error: "Payment not yet confirmed" });
    } catch {
      return res.status(400).json({ error: "Invalid payment reference" });
    }
  }

  // Resolve customer — check auth token, or look up by email, or create new account
  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const tokenCustomerId = verifyCustomerToken(token);
  let customerId: string | null = null;
  let customerName = shippingAddress.name;
  let newToken: string | null = null;
  let newCustomer: any = null;

  if (tokenCustomerId) {
    const existing = await storage.getCustomerById(tokenCustomerId);
    if (existing) { customerId = existing.id; customerName = existing.name; }
  }

  if (!customerId && createAccount && password) {
    const existing = await storage.getCustomerByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists. Sign in instead." });
    }
    const passwordHash = hashPassword(password);
    const customer = await storage.createCustomer({ name: shippingAddress.name, email: email.toLowerCase(), passwordHash, phone });
    customerId = customer.id;
    newToken = createCustomerToken(customer.id);
    newCustomer = { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone };
  }

  if (!customerId) {
    const existing = await storage.getCustomerByEmail(email.toLowerCase());
    if (existing) customerId = existing.id;
  }

  // Build order items
  let orderItems;
  try {
    orderItems = await Promise.all(
      items.map(async (item: { productId: string; quantity: number }) => {
        const product = await storage.getProduct(item.productId);
        if (!product) throw new Error("Product not found");
        return { productId: product.id, productName: product.name, price: product.price, quantity: item.quantity, imageUrl: product.imageUrl ?? null };
      })
    );
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }

  const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await storage.createOrder({
    customerId,
    customerName,
    customerEmail: email.toLowerCase(),
    customerPhone: phone ?? null,
    items: orderItems,
    shippingAddress,
    total,
    status: "pending",
  });

  // Decrement stock for each item (best-effort — order is already placed)
  for (const item of orderItems) {
    try {
      await storage.decrementStock(item.productId, item.quantity);
    } catch (err) {
      logger.error({ err, productId: item.productId }, "Failed to decrement stock");
    }
  }

  // Send confirmation emails (don't block response on email delivery)
  sendOrderConfirmation({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: orderItems,
    shippingAddress,
    total,
  }).catch((err) => logger.error({ err }, "Order confirmation email failed"));

  res.status(201).json({ order, token: newToken, customer: newCustomer });
});

export default router;
