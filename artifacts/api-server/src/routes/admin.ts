import { Router } from "express";
import { storage } from "../storage";
import { verifyPassword, setPassword, createToken, adminAuthMiddleware } from "../auth";
import { sendShippingNotification, sendDeliveryNotification, sendNewsletterBlast, sendRestockNotification } from "../lib/email";
import { logger } from "../lib/logger";
import { rateLimit } from "../lib/rateLimit";
import { hashPasswordAsync, generateTemporaryPassword } from "../lib/customerAuth";

const router = Router();

const adminLoginLimiter = rateLimit({
  bucket: "admin-login",
  max: 5,
  windowMs: 15 * 60 * 1000, // 5 attempts per IP per 15 minutes
  message: "Too many admin login attempts. Please wait before trying again.",
});

router.post("/admin/login", adminLoginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password required" });
  }
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
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Admin password must be at least 8 characters" });
    }
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
    imageUrls: product.imageUrls ?? (product.imageUrl ? [product.imageUrl] : null),
    inStock: product.inStock,
    stockCount: product.stockCount ?? null,
    category: product.category,
    sizes: product.sizes ?? null,
    tag: product.tag ?? null,
    tagColor: product.tagColor ?? null,
    releaseDate: product.releaseDate
      ? (product.releaseDate?.toISOString?.() ?? product.releaseDate)
      : null,
    createdAt: product.createdAt?.toISOString?.() ?? product.createdAt,
  };
}

function normalizeReleaseDate(value: any): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function getCanonicalBaseUrl(): string {
  const canonical = process.env.CANONICAL_HOST;
  if (canonical) return `https://${canonical}`;
  return "https://vaaclothing.xyz";
}

const VALID_TAG_COLORS = new Set(["blue", "red", "green", "yellow", "purple", "white"]);
function normalizeTag(tag: any): string | null {
  return typeof tag === "string" && tag.trim() ? tag.trim().slice(0, 60) : null;
}
function normalizeTagColor(color: any): string | null {
  if (typeof color !== "string") return null;
  const c = color.trim().toLowerCase();
  return VALID_TAG_COLORS.has(c) ? c : null;
}

function normalizeImageUrls(imageUrls: any, imageUrl: any): string[] | null {
  let list: string[] = [];
  if (Array.isArray(imageUrls)) {
    list = imageUrls.filter((u: any) => typeof u === "string" && u.trim().length > 0);
  }
  if (list.length === 0 && typeof imageUrl === "string" && imageUrl.trim().length > 0) {
    list = [imageUrl.trim()];
  }
  return list.length > 0 ? list : null;
}

router.post("/admin/products", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, imageUrls, inStock, stockCount, category, sizes, tag, tagColor, releaseDate } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: "name and price required" });
  const normalizedStockCount =
    typeof stockCount === "number" && stockCount >= 0 ? Math.floor(stockCount) : null;
  const computedInStock =
    normalizedStockCount === null ? (inStock ?? true) : normalizedStockCount > 0;
  const normalizedSizes = Array.isArray(sizes) && sizes.length > 0 ? sizes : null;
  const normalizedImages = normalizeImageUrls(imageUrls, imageUrl);
  const normalizedTag = normalizeTag(tag);
  const product = await storage.createProduct({
    name,
    description,
    price,
    imageUrl: normalizedImages?.[0] ?? null,
    imageUrls: normalizedImages,
    inStock: computedInStock,
    stockCount: normalizedStockCount,
    category,
    sizes: normalizedSizes,
    tag: normalizedTag,
    tagColor: normalizedTag ? (normalizeTagColor(tagColor) ?? "blue") : null,
    releaseDate: normalizeReleaseDate(releaseDate),
  });
  res.status(201).json(serializeProduct(product));
});

router.put("/admin/products/:id", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, imageUrls, inStock, stockCount, category, sizes, tag, tagColor, releaseDate } = req.body;
  const existing = await storage.getProduct(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });
  const updates: any = { name, description, price, category };
  if (releaseDate !== undefined) {
    updates.releaseDate = normalizeReleaseDate(releaseDate);
  }
  if (imageUrls !== undefined || imageUrl !== undefined) {
    const normalizedImages = normalizeImageUrls(imageUrls, imageUrl);
    updates.imageUrls = normalizedImages;
    updates.imageUrl = normalizedImages?.[0] ?? null;
  }
  if (sizes !== undefined) {
    updates.sizes = Array.isArray(sizes) && sizes.length > 0 ? sizes : null;
  }
  if (tag !== undefined || tagColor !== undefined) {
    const normalizedTag = normalizeTag(tag);
    updates.tag = normalizedTag;
    updates.tagColor = normalizedTag ? (normalizeTagColor(tagColor) ?? "blue") : null;
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

  // Fire restock notifications when a sold-out product becomes available again.
  const becameInStock = !existing.inStock && product.inStock;
  if (becameInStock) {
    storage
      .getRestockSubscribers(product.id, "restock")
      .then(async (subs) => {
        if (subs.length === 0) return;
        logger.info(
          { productId: product.id, count: subs.length },
          "Sending restock notifications",
        );
        for (const sub of subs) {
          try {
            await sendRestockNotification(sub.email, {
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              imageUrl: product.imageUrl ?? null,
              baseUrl: getCanonicalBaseUrl(),
              type: "restock",
            });
          } catch (err) {
            logger.error({ err, email: sub.email }, "Restock email failed");
          }
        }
        await storage.clearRestockSubscribers(product.id, "restock");
      })
      .catch((err) => logger.error({ err }, "Restock fan-out failed"));
  }

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

  // Fire delivery notification on transition INTO "delivered"
  if (status === "delivered" && existing.status !== "delivered") {
    sendDeliveryNotification({
      orderNumber: updated.orderNumber,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      trackingNumber: updated.trackingNumber,
      shippingAddress: updated.shippingAddress,
    }).catch((err) => logger.error({ err }, "Failed to send delivery notification"));
  }

  res.json({ success: true, order: updated });
});

router.delete("/admin/orders/:id", adminAuthMiddleware, async (req, res) => {
  const ok = await storage.deleteOrder(req.params.id);
  if (!ok) return res.status(404).json({ error: "Order not found" });
  res.json({ success: true });
});

router.get("/admin/customers", adminAuthMiddleware, async (_req, res) => {
  const customers = await storage.getAllCustomers();
  const safe = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    createdAt: c.createdAt,
    passwordChangedAt: c.passwordChangedAt ?? null,
  }));
  res.json({ data: safe });
});

// Admin-issued password reset. Generates a one-time temporary password,
// stores its hash, and returns the plaintext to the admin ONCE so they can
// share it with the customer through a separate channel. The plaintext is
// never persisted and never appears in logs.
router.post("/admin/customers/:id/reset-password", adminAuthMiddleware, async (req, res) => {
  const customer = await storage.getCustomerById(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const tempPassword = generateTemporaryPassword();
  const hash = await hashPasswordAsync(tempPassword);
  const ok = await storage.updateCustomerPassword(customer.id, hash);
  if (!ok) return res.status(500).json({ error: "Failed to reset password" });

  logger.info(
    { customerId: customer.id, email: customer.email },
    "Admin reset customer password",
  );
  res.json({
    success: true,
    temporaryPassword: tempPassword,
    message:
      "A temporary password has been set. Share it with the customer through a secure channel · it won't be shown again.",
  });
});

// ── Categories ────────────────────────────────────────────────────────────────
router.get("/admin/categories", adminAuthMiddleware, async (_req, res) => {
  const categories = await storage.listCategories();
  res.json({ data: categories });
});

router.post("/admin/categories", adminAuthMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") return res.status(400).json({ error: "Category name required" });
  try {
    const category = await storage.createCategory(name);
    res.status(201).json(category);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Failed to create category" });
  }
});

router.put("/admin/categories/:id", adminAuthMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== "string") return res.status(400).json({ error: "Category name required" });
  try {
    const category = await storage.updateCategory(req.params.id, name);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Failed to update category" });
  }
});

router.delete("/admin/categories/:id", adminAuthMiddleware, async (req, res) => {
  await storage.deleteCategory(req.params.id);
  res.json({ success: true, message: "Category deleted" });
});

// ── Sizes ─────────────────────────────────────────────────────────────────────
router.get("/admin/sizes", adminAuthMiddleware, async (_req, res) => {
  const sizes = await storage.listSizes();
  res.json({ data: sizes });
});

router.post("/admin/sizes", adminAuthMiddleware, async (req, res) => {
  const { label } = req.body;
  if (!label || typeof label !== "string") return res.status(400).json({ error: "Size label required" });
  try {
    const size = await storage.createSize(label);
    res.status(201).json(size);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Failed to create size" });
  }
});

router.put("/admin/sizes/:id", adminAuthMiddleware, async (req, res) => {
  const { label } = req.body;
  if (!label || typeof label !== "string") return res.status(400).json({ error: "Size label required" });
  try {
    const size = await storage.updateSize(req.params.id, label);
    if (!size) return res.status(404).json({ error: "Size not found" });
    res.json(size);
  } catch (err: any) {
    res.status(400).json({ error: err?.message ?? "Failed to update size" });
  }
});

router.delete("/admin/sizes/:id", adminAuthMiddleware, async (req, res) => {
  await storage.deleteSize(req.params.id);
  res.json({ success: true, message: "Size deleted" });
});

router.get("/admin/newsletter/subscribers", adminAuthMiddleware, async (_req, res) => {
  const emails = await storage.getAllNewsletterSubscribers();
  res.json({ data: emails, count: emails.length });
});

// ── Reviews moderation ────────────────────────────────────────────────────────
router.get("/admin/reviews", adminAuthMiddleware, async (_req, res) => {
  const reviews = await storage.listAllReviews();
  res.json({
    data: reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      createdAt: r.createdAt,
    })),
  });
});

router.delete("/admin/reviews/:id", adminAuthMiddleware, async (req, res) => {
  const ok = await storage.deleteReview(req.params.id);
  if (!ok) return res.status(404).json({ error: "Review not found" });
  res.json({ success: true });
});

// ── Restock subscribers listing ───────────────────────────────────────────────
router.get("/admin/restock-subscribers", adminAuthMiddleware, async (_req, res) => {
  const subs = await storage.listAllRestockSubscribers();
  res.json({
    data: subs.map((s) => ({
      id: s.id,
      productId: s.productId,
      email: s.email,
      type: s.type,
      createdAt: s.createdAt,
    })),
  });
});

router.post("/admin/newsletter/send", adminAuthMiddleware, async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) return res.status(400).json({ error: "subject and body are required" });
  const subscribers = await storage.getAllNewsletterSubscribers();
  if (subscribers.length === 0) return res.status(400).json({ error: "No subscribers to send to" });
  try {
    const result = await sendNewsletterBlast({ subject, body, subscribers });
    if (result.sent === 0) {
      const detail = result.errors[0] ?? "Unknown email provider error.";
      return res.status(502).json({
        error: `Newsletter failed for all ${result.failed} subscriber(s). ${detail}`,
        sent: 0,
        failed: result.failed,
      });
    }
    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: subscribers.length,
      errors: result.errors,
    });
  } catch (err: any) {
    logger.error({ err }, "Newsletter blast failed");
    res.status(500).json({ error: err?.message ?? "Failed to send newsletter" });
  }
});

export default router;
