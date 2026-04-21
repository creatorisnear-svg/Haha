import { Router } from "express";
import { storage } from "../storage";
import {
  hashPasswordAsync,
  verifyCustomerPassword,
  createCustomerToken,
  customerAuthMiddleware,
} from "../lib/customerAuth";
import { rateLimit } from "../lib/rateLimit";

const router = Router();

const registerLimiter = rateLimit({
  bucket: "customer-register",
  max: 5,
  windowMs: 60 * 60 * 1000, // 5 signups per IP per hour
  message: "Too many sign-up attempts. Please try again later.",
});

const loginLimiter = rateLimit({
  bucket: "customer-login",
  max: 10,
  windowMs: 15 * 60 * 1000, // 10 attempts per IP per 15 min
  message: "Too many login attempts. Please try again in a few minutes.",
});

router.post("/customers/register", registerLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const existing = await storage.getCustomerByEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const customer = await storage.createCustomer({
    name,
    email: email.toLowerCase(),
    passwordHash: await hashPasswordAsync(password),
    phone: phone ?? null,
  });

  const token = createCustomerToken(customer.id);
  res.status(201).json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  });
});

router.post("/customers/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const customer = await storage.getCustomerByEmail(email.toLowerCase());
  if (!customer) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const { valid, needsRehash } = await verifyCustomerPassword(password, customer.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  if (needsRehash) {
    const upgraded = await hashPasswordAsync(password);
    await storage.updateCustomerPassword(customer.id, upgraded);
  }

  const token = createCustomerToken(customer.id);
  res.json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  });
});

router.get("/customers/me", customerAuthMiddleware, async (req: any, res) => {
  const customer = await storage.getCustomerById(req.customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
});

router.get("/customers/orders", customerAuthMiddleware, async (req: any, res) => {
  const orders = await storage.getOrdersByCustomer(req.customerId);
  res.json({ data: orders });
});

export default router;
