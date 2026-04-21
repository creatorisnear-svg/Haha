import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/settings/stripe-public-key", async (_req, res) => {
  const publishableKey = await storage.getSetting("stripe_publishable_key");
  res.json({ publishableKey: publishableKey ?? "" });
});

export default router;
