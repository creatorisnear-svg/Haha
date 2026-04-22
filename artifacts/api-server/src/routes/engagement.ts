import { Router } from "express";
import { storage } from "../storage";
import { customerAuthMiddleware } from "../lib/customerAuth";
import { rateLimit } from "../lib/rateLimit";
import { logger } from "../lib/logger";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function serializeReview(r: any) {
  return {
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
  };
}

// ── Reviews ────────────────────────────────────────────────────────────────────
router.get("/products/:id/reviews", async (req, res) => {
  const reviews = await storage.listReviewsByProduct(req.params.id);
  const total = reviews.length;
  const avg =
    total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
      : null;
  res.json({ data: reviews.map(serializeReview), total, average: avg });
});

const reviewLimiter = rateLimit({
  bucket: "review-create",
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: "Too many reviews submitted. Please wait before posting another.",
});

router.post(
  "/products/:id/reviews",
  reviewLimiter,
  customerAuthMiddleware,
  async (req: any, res) => {
    const { rating, body } = req.body ?? {};
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1 to 5." });
    }
    if (typeof body !== "string" || body.trim().length < 4) {
      return res.status(400).json({ error: "Please write at least a few words." });
    }
    const product = await storage.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const customer = await storage.getCustomerById(req.customerId);
    if (!customer) return res.status(401).json({ error: "Unauthorized" });

    const already = await storage.hasCustomerReviewedProduct(customer.id, product.id);
    if (already) return res.status(409).json({ error: "You have already reviewed this product." });

    const review = await storage.createReview({
      productId: product.id,
      customerId: customer.id,
      authorName: customer.name,
      rating,
      body,
    });
    res.status(201).json(serializeReview(review));
  },
);

// ── Restock / drop notifications ──────────────────────────────────────────────
const notifyLimiter = rateLimit({
  bucket: "restock-notify",
  max: 20,
  windowMs: 60 * 60 * 1000,
  message: "Too many notification requests. Please try again later.",
});

router.post("/products/:id/notify", notifyLimiter, async (req, res) => {
  const { email, type } = req.body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required." });
  }
  const notifyType: "restock" | "release" = type === "release" ? "release" : "restock";
  const product = await storage.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await storage.subscribeRestock(product.id, email, notifyType);
  res.json({ success: true });
});

// ── Wishlist sync (per logged-in customer) ────────────────────────────────────
router.get("/account/wishlist", customerAuthMiddleware, async (req: any, res) => {
  const ids = await storage.getWishlist(req.customerId);
  res.json({ data: ids });
});

router.put("/account/wishlist", customerAuthMiddleware, async (req: any, res) => {
  const { productIds } = req.body ?? {};
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ error: "productIds must be an array of strings" });
  }
  const cleaned = productIds.filter((id: any) => typeof id === "string" && id.length > 0);
  await storage.setWishlist(req.customerId, cleaned);
  res.json({ success: true, data: cleaned });
});

// ── Cart sync (for abandonment emails) ────────────────────────────────────────
router.put("/account/cart", customerAuthMiddleware, async (req: any, res) => {
  const { items } = req.body ?? {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items must be an array" });
  }
  const customer = await storage.getCustomerById(req.customerId);
  if (!customer) return res.status(401).json({ error: "Unauthorized" });

  const cleaned = items
    .filter(
      (i: any) =>
        i &&
        typeof i.productId === "string" &&
        typeof i.productName === "string" &&
        typeof i.price === "number" &&
        typeof i.quantity === "number" &&
        i.quantity > 0,
    )
    .slice(0, 50)
    .map((i: any) => ({
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: Math.max(1, Math.floor(i.quantity)),
      size: typeof i.size === "string" ? i.size : null,
      imageUrl: typeof i.imageUrl === "string" ? i.imageUrl : null,
    }));

  try {
    await storage.saveCustomerCart(customer.id, customer.email, customer.name, cleaned);
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to save customer cart");
    res.status(500).json({ error: "Failed to save cart" });
  }
});

router.delete("/account/cart", customerAuthMiddleware, async (req: any, res) => {
  await storage.clearCustomerCart(req.customerId);
  res.json({ success: true });
});

export default router;
