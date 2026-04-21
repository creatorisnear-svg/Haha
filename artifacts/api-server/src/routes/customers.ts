import { Router } from "express";
import { storage } from "../storage";
import { hashPassword, createCustomerToken, customerAuthMiddleware } from "../lib/customerAuth";

const router = Router();

router.post("/customers/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "name, email, and password are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const existing = await storage.getCustomerByEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ error: "An account with this email already exists" });

  const customer = await storage.createCustomer({
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    phone: phone ?? null,
  });

  const token = createCustomerToken(customer.id);
  res.status(201).json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
  });
});

router.post("/customers/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const customer = await storage.getCustomerByEmail(email.toLowerCase());
  if (!customer || customer.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid email or password" });
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
