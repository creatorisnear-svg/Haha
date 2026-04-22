import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/categories", async (_req, res) => {
  const categories = await storage.listCategories();
  res.json({
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageId ? `/api/images/${c.imageId}` : null,
    })),
  });
});

export default router;
