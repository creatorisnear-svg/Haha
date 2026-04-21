import { Router } from "express";
import { storage } from "../storage";
import { verifyPassword, setPassword, createToken, adminAuthMiddleware } from "../auth";

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

router.post("/admin/products", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, inStock, category } = req.body;
  if (!name || price === undefined) return res.status(400).json({ error: "name and price required" });
  const product = await storage.createProduct({ name, description, price, imageUrl, inStock: inStock ?? true, category });
  res.status(201).json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    category: product.category,
    createdAt: product.createdAt?.toISOString(),
  });
});

router.put("/admin/products/:id", adminAuthMiddleware, async (req, res) => {
  const { name, description, price, imageUrl, inStock, category } = req.body;
  const product = await storage.updateProduct(req.params.id, { name, description, price, imageUrl, inStock, category });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    inStock: product.inStock,
    category: product.category,
    createdAt: product.createdAt?.toISOString(),
  });
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
  const { status } = req.body;
  if (!["pending", "processing", "shipped", "delivered"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  await storage.updateOrderStatus(req.params.id, status);
  res.json({ success: true });
});

export default router;
