import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/products", async (_req, res) => {
  const products = await storage.listProducts();
  res.json({ data: products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    inStock: p.inStock,
    category: p.category,
    createdAt: p.createdAt?.toISOString(),
  })) });
});

router.get("/products/:id", async (req, res) => {
  const product = await storage.getProduct(req.params.id);
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

export default router;
