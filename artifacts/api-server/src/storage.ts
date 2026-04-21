import { ObjectId } from "mongodb";
import { getDb } from "./lib/mongodb";

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  inStock: boolean;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;

function docToProduct(doc: any): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    price: doc.price,
    imageUrl: doc.imageUrl ?? null,
    inStock: doc.inStock,
    category: doc.category ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// ── Customer ──────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  createdAt: Date;
}

function docToCustomer(doc: any): Customer {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    phone: doc.phone ?? null,
    createdAt: doc.createdAt,
  };
}

// ── Order ─────────────────────────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered";
  notes?: string | null;
  createdAt: Date;
}

function docToOrder(doc: any): Order {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    customerId: doc.customerId,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    customerPhone: doc.customerPhone ?? null,
    items: doc.items,
    shippingAddress: doc.shippingAddress,
    total: doc.total,
    status: doc.status,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
  };
}

// ── Storage class ─────────────────────────────────────────────────────────────
export class Storage {
  // Products
  async listProducts(): Promise<Product[]> {
    const db = await getDb();
    const docs = await db.collection("products").find().sort({ createdAt: 1 }).toArray();
    return docs.map(docToProduct);
  }

  async getProduct(id: string): Promise<Product | null> {
    const db = await getDb();
    try {
      const doc = await db.collection("products").findOne({ _id: new ObjectId(id) });
      return doc ? docToProduct(doc) : null;
    } catch { return null; }
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection("products").insertOne({ ...data, createdAt: now, updatedAt: now });
    return docToProduct({ _id: result.insertedId, ...data, createdAt: now, updatedAt: now });
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | null> {
    const db = await getDb();
    try {
      const result = await db.collection("products").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...data, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      return result ? docToProduct(result) : null;
    } catch { return null; }
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await getDb();
    try { await db.collection("products").deleteOne({ _id: new ObjectId(id) }); } catch {}
  }

  // Settings
  async getSetting(key: string): Promise<string | null> {
    const db = await getDb();
    const doc = await db.collection("settings").findOne({ key });
    return doc?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.collection("settings").updateOne(
      { key },
      { $set: { key, value, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  // Newsletter
  async subscribeNewsletter(email: string): Promise<void> {
    const db = await getDb();
    await db.collection("newsletter").updateOne(
      { email },
      { $setOnInsert: { email, subscribedAt: new Date() } },
      { upsert: true }
    );
  }

  // Customers
  async createCustomer(data: { name: string; email: string; passwordHash: string; phone?: string }): Promise<Customer> {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection("customers").insertOne({ ...data, createdAt: now });
    return docToCustomer({ _id: result.insertedId, ...data, createdAt: now });
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    const db = await getDb();
    const doc = await db.collection("customers").findOne({ email: email.toLowerCase() });
    return doc ? docToCustomer(doc) : null;
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const db = await getDb();
    try {
      const doc = await db.collection("customers").findOne({ _id: new ObjectId(id) });
      return doc ? docToCustomer(doc) : null;
    } catch { return null; }
  }

  // Orders
  async createOrder(data: Omit<Order, "id" | "orderNumber" | "createdAt">): Promise<Order> {
    const db = await getDb();
    const now = new Date();
    const count = await db.collection("orders").countDocuments();
    const orderNumber = `VAA-${String(count + 1).padStart(4, "0")}`;
    const result = await db.collection("orders").insertOne({ ...data, orderNumber, createdAt: now });
    return docToOrder({ _id: result.insertedId, ...data, orderNumber, createdAt: now });
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const db = await getDb();
    const docs = await db.collection("orders").find({ customerId }).sort({ createdAt: -1 }).toArray();
    return docs.map(docToOrder);
  }

  async getAllOrders(): Promise<Order[]> {
    const db = await getDb();
    const docs = await db.collection("orders").find().sort({ createdAt: -1 }).toArray();
    return docs.map(docToOrder);
  }

  async updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
    const db = await getDb();
    try {
      await db.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: { status } });
    } catch {}
  }
}

export const storage = new Storage();
