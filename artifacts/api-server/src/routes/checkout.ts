import { Router } from "express";
import { storage } from "../storage";
import { verifyCustomerToken } from "../lib/customerAuth";

const router = Router();

router.post("/checkout", async (req, res) => {
  const { items, shippingAddress, phone } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: "No items provided" });
  if (!shippingAddress) return res.status(400).json({ error: "Shipping address required" });

  const auth = req.headers["authorization"] ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const customerId = verifyCustomerToken(token);
  if (!customerId) return res.status(401).json({ error: "You must be logged in to checkout" });

  const customer = await storage.getCustomerById(customerId);
  if (!customer) return res.status(401).json({ error: "Customer not found" });

  const orderItems = await Promise.all(
    items.map(async (item: { productId: string; quantity: number }) => {
      const product = await storage.getProduct(item.productId);
      if (!product) throw new Error(`Product not found`);
      return {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl ?? null,
      };
    })
  );

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await storage.createOrder({
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: phone ?? customer.phone ?? null,
    items: orderItems,
    shippingAddress,
    total,
    status: "pending",
  });

  res.status(201).json({ order });
});

export default router;
