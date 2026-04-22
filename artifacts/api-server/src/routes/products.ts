import { Router } from "express";
import { storage } from "../storage";

const router = Router();

function serialize(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.imageUrl,
    imageUrls: p.imageUrls ?? null,
    inStock: p.inStock,
    stockCount: p.stockCount ?? null,
    category: p.category,
    sizes: p.sizes ?? null,
    tag: p.tag ?? null,
    tagColor: p.tagColor ?? null,
    releaseDate: p.releaseDate ? (p.releaseDate?.toISOString?.() ?? p.releaseDate) : null,
    featured: !!p.featured,
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
  };
}

router.get("/products", async (_req, res) => {
  const products = await storage.listProducts();
  res.json({ data: products.map(serialize) });
});

router.get("/products/:id", async (req, res) => {
  const product = await storage.getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(serialize(product));
});

export default router;
