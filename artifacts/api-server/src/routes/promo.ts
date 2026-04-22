import { Router } from "express";
import { storage } from "../storage";
import { adminAuthMiddleware } from "../auth";

const router = Router();

router.post("/promo/validate", async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: "Code required" });

  const promo = await storage.getPromoCodeByCode(String(code).trim());
  if (!promo || !promo.active) {
    return res.json({ valid: false, message: "Invalid or inactive promo code" });
  }

  const now = new Date();
  if (promo.expiresAt && promo.expiresAt < now) {
    return res.json({ valid: false, message: "This promo code has expired" });
  }

  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    return res.json({ valid: false, message: "This promo code has reached its usage limit" });
  }

  const totalInDollars = typeof orderTotal === "number" ? orderTotal : 0;
  if (promo.minOrderValue !== null && promo.minOrderValue !== undefined && totalInDollars < promo.minOrderValue) {
    return res.json({
      valid: false,
      message: `Minimum order of $${promo.minOrderValue.toFixed(2)} required for this code`,
    });
  }

  let discountValue = 0;
  if (promo.discountType === "percent") {
    discountValue = parseFloat((totalInDollars * (promo.discountAmount / 100)).toFixed(2));
  } else {
    discountValue = Math.min(promo.discountAmount, totalInDollars);
  }

  return res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountAmount: promo.discountAmount,
    discountValue,
    message: promo.discountType === "percent"
      ? `${promo.discountAmount}% off applied`
      : `$${promo.discountAmount.toFixed(2)} off applied`,
  });
});

router.get("/admin/promo", adminAuthMiddleware, async (_req, res) => {
  const codes = await storage.getAllPromoCodes();
  res.json({ data: codes });
});

router.get("/admin/promo/:id/orders", adminAuthMiddleware, async (req, res) => {
  const promo = await storage.getAllPromoCodes().then((all) => all.find((p) => p.id === req.params.id));
  if (!promo) return res.status(404).json({ error: "Promo code not found" });

  const orders = await storage.getOrdersByPromoCode(promo.code);
  const totalOrders = orders.length;
  const grossRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount ?? 0), 0);
  const uniqueCustomers = new Set(orders.map((o) => o.customerEmail.toLowerCase())).size;

  res.json({
    code: promo.code,
    stats: {
      totalOrders,
      uniqueCustomers,
      grossRevenue: parseFloat(grossRevenue.toFixed(2)),
      totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    },
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      total: o.total,
      discountAmount: o.discountAmount ?? 0,
      status: o.status,
      createdAt: o.createdAt,
    })),
  });
});

router.post("/admin/promo", adminAuthMiddleware, async (req, res) => {
  const { code, discountType, discountAmount, minOrderValue, usageLimit, expiresAt, active } = req.body;
  if (!code || !discountType || discountAmount === undefined) {
    return res.status(400).json({ error: "code, discountType, and discountAmount are required" });
  }
  if (!["percent", "fixed"].includes(discountType)) {
    return res.status(400).json({ error: "discountType must be 'percent' or 'fixed'" });
  }
  const existing = await storage.getPromoCodeByCode(String(code).trim());
  if (existing) return res.status(409).json({ error: "A promo code with that name already exists" });

  const promo = await storage.createPromoCode({
    code: String(code).trim().toUpperCase(),
    discountType,
    discountAmount: Number(discountAmount),
    minOrderValue: minOrderValue !== undefined && minOrderValue !== "" && minOrderValue !== null ? Number(minOrderValue) : null,
    usageLimit: usageLimit !== undefined && usageLimit !== "" && usageLimit !== null ? Number(usageLimit) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    active: active !== false,
  });
  res.status(201).json(promo);
});

router.patch("/admin/promo/:id", adminAuthMiddleware, async (req, res) => {
  const { code, discountType, discountAmount, minOrderValue, usageLimit, expiresAt, active } = req.body;
  const updates: any = {};
  if (code !== undefined) updates.code = String(code).trim().toUpperCase();
  if (discountType !== undefined) updates.discountType = discountType;
  if (discountAmount !== undefined) updates.discountAmount = Number(discountAmount);
  if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue !== "" && minOrderValue !== null ? Number(minOrderValue) : null;
  if (usageLimit !== undefined) updates.usageLimit = usageLimit !== "" && usageLimit !== null ? Number(usageLimit) : null;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (active !== undefined) updates.active = active;

  const updated = await storage.updatePromoCode(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: "Promo code not found" });
  res.json(updated);
});

router.delete("/admin/promo/:id", adminAuthMiddleware, async (req, res) => {
  await storage.deletePromoCode(req.params.id);
  res.json({ success: true });
});

export default router;
