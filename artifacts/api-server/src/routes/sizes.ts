import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/sizes", async (_req, res) => {
  const sizes = await storage.listSizes();
  res.json({
    data: sizes.map((s) => ({ id: s.id, label: s.label, sortOrder: s.sortOrder })),
  });
});

export default router;
