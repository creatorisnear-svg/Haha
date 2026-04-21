import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import adminRouter from "./admin";
import checkoutRouter from "./checkout";
import newsletterRouter from "./newsletter";
import settingsRouter from "./settings";
import customersRouter from "./customers";
import paymentsRouter from "./payments";
import promoRouter from "./promo";
import { storage } from "../storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(adminRouter);
router.use(checkoutRouter);
router.use(newsletterRouter);
router.use(settingsRouter);
router.use(customersRouter);
router.use(paymentsRouter);
router.use(promoRouter);

// Public order lookup by order number + email
router.get("/orders/lookup", async (req, res) => {
  const { orderNumber, email } = req.query as { orderNumber?: string; email?: string };
  if (!orderNumber || !email) {
    return res.status(400).json({ error: "orderNumber and email are required" });
  }
  const order = await storage.getOrderByNumberAndEmail(orderNumber, email);
  if (!order) {
    return res.status(404).json({ error: "No order found matching that email and order number" });
  }
  res.json({ order });
});

export default router;
