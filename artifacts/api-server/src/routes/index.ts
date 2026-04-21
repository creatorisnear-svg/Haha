import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import adminRouter from "./admin";
import checkoutRouter from "./checkout";
import newsletterRouter from "./newsletter";
import settingsRouter from "./settings";
import customersRouter from "./customers";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(adminRouter);
router.use(checkoutRouter);
router.use(newsletterRouter);
router.use(settingsRouter);
router.use(customersRouter);
router.use(paymentsRouter);

export default router;
