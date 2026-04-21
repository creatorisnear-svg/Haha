import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.post("/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  await storage.subscribeNewsletter(email);
  res.json({ success: true, message: "Subscribed successfully" });
});

export default router;
