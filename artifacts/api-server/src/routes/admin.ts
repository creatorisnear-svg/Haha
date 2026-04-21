import { Router } from "express";
import { storage } from "../storage";
import { verifyPassword, setPassword, createToken, adminAuthMiddleware } from "../auth";
import { sendShippingNotification, sendNewsletterBlast } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

router.post("/admin/login", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  const valid = await verifyPassword(password);
  if (!valid) return res.status(401).json({ error: "Invalid password" });
  const token = createToken();
  res.json({ token });
});

router.get("/admin/settings", adminAuthMiddleware, async (_req, res) => {
  const stripePublishableKey = await storage.getSetting("stripe_publishable_key");
  const stripeSecretKey = await storage.getSetting("stripe_secret_key");
  res.json({
    stripePublishableKey: stripePublishableKey ?? "",
    stripeSecretKey: stripeSecretKey ? "sk_*****" : "",
    hasStripeConfigured: !!(stripePublishableKey && stripeSecretKey),
  });
});

router.put("/admin/settings", adminAuthMiddleware, async (req, res) => {
  const { stripePublishableKey, stripeSecretKey, newPassword } = req.body;
  if (stripePublishableKey !== undefined) {
    await storage.setSetting("stripe_publishable_key", stripePublishableKey);
  }
  if (stripeSecretKey !== undefined && !stripeSecretKey.startsWith("sk_*****")) {
    await storage.setSetting("stripe_secret_key", stripeSecretKey);
  }
  if (newPassword) {
    await setPassword(newPassword);
  }
  res.json({ success: true, message: "Settings updated" });
});

function serializeProduct(product: any) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    stockCount: product.stockCount ?? null,
    category: product.category,
    sizes: product.sizes ?? null,
    createdAt: product.createdAt?.toISOString?.() ?? product.createdAt,
  };
}

router.post("/admin/products", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, inStock, stockCount, category, sizes } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: "name and price required" });
  const normalizedStockCount =
    typeof stockCount === "number" && stockCount >= 0 ? Math.floor(stockCount) : null;
  const computedInStock =
    normalizedStockCount === null ? (inStock ?? true) : normalizedStockCount > 0;
  const normalizedSizes = Array.isArray(sizes) && sizes.length > 0 ? sizes : null;
  const product = await storage.createProduct({
    name,
    description,
    price,
    imageUrl,
    inStock: computedInStock,
    stockCount: normalizedStockCount,
    category,
    sizes: normalizedSizes,
  });
  res.status(201).json(serializeProduct(product));
});

router.put("/admin/products/:id", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, inStock, stockCount, category, sizes } = req.body;
  const updates: any = { name, description, price, imageUrl, category };
  if (sizes !== undefined) {
    updates.sizes = Array.isArray(sizes) && sizes.length > 0 ? sizes : null;
  }
  if (stockCount !== undefined) {
    updates.stockCount =
      typeof stockCount === "number" && stockCount >= 0 ? Math.floor(stockCount) : null;
    if (updates.stockCount !== null) {
      updates.inStock = updates.stockCount > 0;
    } else if (inStock !== undefined) {
      updates.inStock = inStock;
    }
  } else if (inStock !== undefined) {
    updates.inStock = inStock;
  }
  const product = await storage.updateProduct(req.params.id, updates);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serializeProduct(product));
});

router.delete("/admin/products/:id", adminAuthMiddleware, async (req, res) => {
  const product = await storage.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await storage.deleteProduct(req.params.id);
  res.json({ success: true, message: "Product deleted" });
});

router.get("/admin/orders", adminAuthMiddleware, async (_req, res) => {
  const orders = await storage.getAllOrders();
  res.json({ data: orders });
});

router.put("/admin/orders/:id/status", adminAuthMiddleware, async (req, res) => {
  const { status, trackingNumber } = req.body;
  if (!["pending", "processing", "shipped", "delivered"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const existing = await storage.getOrder(req.params.id);
  if (!existing) return res.status(404).json({ error: "Order not found" });

  const extra: { trackingNumber?: string | null } = {};
  if (status === "shipped") {
    const tn = typeof trackingNumber === "string" ? trackingNumber.trim() : "";
    if (!tn) {
      return res.status(400).json({ error: "Tracking number is required when marking an order as shipped." });
    }
    extra.trackingNumber = tn;
  } else if (trackingNumber !== undefined) {
    extra.trackingNumber = typeof trackingNumber === "string" && trackingNumber.trim() ? trackingNumber.trim() : null;
  }

  const updated = await storage.updateOrderStatus(req.params.id, status, extra);
  if (!updated) return res.status(404).json({ error: "Order not found" });

  // Fire shipping notification on transition INTO "shipped"
  if (status === "shipped" && existing.status !== "shipped" && updated.trackingNumber) {
    sendShippingNotification({
      orderNumber: updated.orderNumber,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      trackingNumber: updated.trackingNumber,
      shippingAddress: updated.shippingAddress,
    }).catch((err) => logger.error({ err }, "Failed to send shipping notification"));
  }

  res.json({ success: true, order: updated });
});

router.get("/admin/customers", adminAuthMiddleware, async (_req, res) => {
  const customers = await storage.getAllCustomers();
  const safe = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    createdAt: c.createdAt,
  }));
  res.json({ data: safe });
});

router.get("/admin/newsletter/subscribers", adminAuthMiddleware, async (_req, res) => {
  const emails = await storage.getAllNewsletterSubscribers();
  res.json({ data: emails, count: emails.length });
});

router.post("/admin/newsletter/send", adminAuthMiddleware, async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ error: "subject and body are required" });
  const subscribers = await storage.getAllNewsletterSubscribers();
  if (subscribers.length === 0) return res.status(400).json({ error: "No subscribers to send to" });
  try {
    await sendNewsletterBlast({ subject, body, subscribers });
    res.json({ success: true, sent: subscribers.length });
  } catch (err: any) {
    logger.error({ err }, "Newsletter blast failed");
    res.status(500).json({ error: "Failed to send newsletter" });
  }
});

export default router;
