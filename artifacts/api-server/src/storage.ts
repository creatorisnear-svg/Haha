import { ObjectId } from "mongodb";
import { getDb } from "./lib/mongodb";

// ── Product ───────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  inStock: boolean;
  stockCount?: number | null;
  category?: string | null;
  sizes?: string[] | null;
  tag?: string | null;
  tagColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertProduct = Omit<Product, "id" | "createdAt" | "updatedAt">;

function docToProduct(doc: any): Product {
  // Normalize images: prefer imageUrls (multi), fall back to imageUrl (legacy single)
  const imagesRaw: string[] = Array.isArray(doc.imageUrls)
    ? doc.imageUrls.filter((u: any) => typeof u === "string" && u.trim().length > 0)
    : [];
  const legacyUrl =
    typeof doc.imageUrl === "string" && doc.imageUrl.trim().length > 0 ? doc.imageUrl : null;
  const merged = imagesRaw.length > 0 ? imagesRaw : legacyUrl ? [legacyUrl] : [];

  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    price: doc.price,
    imageUrl: merged[0] ?? null,
    imageUrls: merged.length > 0 ? merged : null,
    inStock: doc.inStock,
    stockCount: typeof doc.stockCount === "number" ? doc.stockCount : null,
    category: doc.category ?? null,
    sizes: Array.isArray(doc.sizes) && doc.sizes.length > 0 ? doc.sizes : null,
    tag: typeof doc.tag === "string" && doc.tag.trim() ? doc.tag.trim() : null,
    tagColor: typeof doc.tagColor === "string" && doc.tagColor.trim() ? doc.tagColor.trim() : null,
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
  passwordChangedAt?: Date | null;
}

function docToCustomer(doc: any): Customer {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    phone: doc.phone ?? null,
    createdAt: doc.createdAt,
    passwordChangedAt: doc.passwordChangedAt ?? null,
  };
}

// ── Order ─────────────────────────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string | null;
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
  discountAmount?: number | null;
  promoCode?: string | null;
  status: "pending" | "processing" | "shipped" | "delivered";
  notes?: string | null;
  trackingNumber?: string | null;
  shippedAt?: Date | null;
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
    discountAmount: doc.discountAmount ?? null,
    promoCode: doc.promoCode ?? null,
    status: doc.status,
    notes: doc.notes ?? null,
    trackingNumber: doc.trackingNumber ?? null,
    shippedAt: doc.shippedAt ?? null,
    createdAt: doc.createdAt,
  };
}

// ── PromoCode ─────────────────────────────────────────────────────────────────
export interface PromoCode {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountAmount: number;
  minOrderValue?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  expiresAt?: Date | null;
  active: boolean;
  createdAt: Date;
}
export type InsertPromoCode = Omit<PromoCode, "id" | "usageCount" | "createdAt">;

function docToPromo(doc: any): PromoCode {
  return {
    id: doc._id.toString(),
    code: doc.code,
    discountType: doc.discountType,
    discountAmount: doc.discountAmount,
    minOrderValue: doc.minOrderValue ?? null,
    usageLimit: doc.usageLimit ?? null,
    usageCount: doc.usageCount ?? 0,
    expiresAt: doc.expiresAt ?? null,
    active: doc.active ?? true,
    createdAt: doc.createdAt,
  };
}

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function docToCategory(doc: any): Category {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    createdAt: doc.createdAt,
  };
}

// ── Storage class ─────────────────────────────────────────────────────────────
export class Storage {
  // Categories
  async listCategories(): Promise<Category[]> {
    const db = await getDb();
    const docs = await db.collection("categories").find().sort({ name: 1 }).toArray();
    return docs.map(docToCategory);
  }

  async createCategory(name: string): Promise<Category> {
    const db = await getDb();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name required");
    const slug = slugify(trimmed);
    const now = new Date();
    const existing = await db.collection("categories").findOne({ slug });
    if (existing) throw new Error("A category with that name already exists");
    const result = await db.collection("categories").insertOne({ name: trimmed, slug, createdAt: now });
    return docToCategory({ _id: result.insertedId, name: trimmed, slug, createdAt: now });
  }

  async updateCategory(id: string, name: string): Promise<Category | null> {
    const db = await getDb();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name required");
    const slug = slugify(trimmed);
    try {
      const _id = new ObjectId(id);
      const conflict = await db.collection("categories").findOne({ slug, _id: { $ne: _id } });
      if (conflict) throw new Error("A category with that name already exists");
      const result = await db.collection("categories").findOneAndUpdate(
        { _id },
        { $set: { name: trimmed, slug } },
        { returnDocument: "after" }
      );
      return result ? docToCategory(result) : null;
    } catch (err: any) {
      if (err?.message?.includes("already exists")) throw err;
      return null;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const db = await getDb();
    try { await db.collection("categories").deleteOne({ _id: new ObjectId(id) }); } catch {}
  }

  // Sizes ────────────────────────────────────────────────────────────────────
  async listSizes(): Promise<{ id: string; label: string; sortOrder: number; createdAt: Date }[]> {
    const db = await getDb();
    const docs = await db.collection("sizes").find().sort({ sortOrder: 1, label: 1 }).toArray();
    return docs.map((d: any) => ({
      id: d._id.toString(),
      label: d.label,
      sortOrder: typeof d.sortOrder === "number" ? d.sortOrder : 0,
      createdAt: d.createdAt,
    }));
  }

  async createSize(label: string): Promise<{ id: string; label: string; sortOrder: number; createdAt: Date }> {
    const db = await getDb();
    const trimmed = label.trim().toUpperCase();
    if (!trimmed) throw new Error("Size label required");
    if (trimmed.length > 16) throw new Error("Size label too long (max 16 characters)");
    const existing = await db.collection("sizes").findOne({ label: trimmed });
    if (existing) throw new Error("That size already exists");
    const last = await db.collection("sizes").find().sort({ sortOrder: -1 }).limit(1).toArray();
    const sortOrder = last.length > 0 ? (last[0].sortOrder ?? 0) + 1 : 0;
    const now = new Date();
    const result = await db.collection("sizes").insertOne({ label: trimmed, sortOrder, createdAt: now });
    return { id: result.insertedId.toString(), label: trimmed, sortOrder, createdAt: now };
  }

  async updateSize(id: string, label: string): Promise<{ id: string; label: string; sortOrder: number; createdAt: Date } | null> {
    const db = await getDb();
    const trimmed = label.trim().toUpperCase();
    if (!trimmed) throw new Error("Size label required");
    if (trimmed.length > 16) throw new Error("Size label too long (max 16 characters)");
    try {
      const _id = new ObjectId(id);
      const conflict = await db.collection("sizes").findOne({ label: trimmed, _id: { $ne: _id } });
      if (conflict) throw new Error("That size already exists");
      const result = await db.collection("sizes").findOneAndUpdate(
        { _id },
        { $set: { label: trimmed } },
        { returnDocument: "after" }
      );
      if (!result) return null;
      return {
        id: result._id.toString(),
        label: result.label,
        sortOrder: typeof result.sortOrder === "number" ? result.sortOrder : 0,
        createdAt: result.createdAt,
      };
    } catch (err: any) {
      if (err?.message?.includes("already exists") || err?.message?.includes("required") || err?.message?.includes("too long")) throw err;
      return null;
    }
  }

  async deleteSize(id: string): Promise<void> {
    const db = await getDb();
    try { await db.collection("sizes").deleteOne({ _id: new ObjectId(id) }); } catch {}
  }

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

  async decrementStock(id: string, quantity: number): Promise<boolean> {
    const db = await getDb();
    try {
      const _id = new ObjectId(id);
      const product = await db.collection("products").findOne({ _id });
      if (!product) return false;
      if (typeof product.stockCount !== "number") return true;
      if (product.stockCount < quantity) return false;
      const newCount = product.stockCount - quantity;
      await db.collection("products").updateOne(
        { _id },
        {
          $set: {
            stockCount: newCount,
            inStock: newCount > 0,
            updatedAt: new Date(),
          },
        }
      );
      return true;
    } catch {
      return false;
    }
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

  // Newsletter · returns true if a new (or re-activated) subscriber was created.
  async subscribeNewsletter(email: string): Promise<boolean> {
    const db = await getDb();
    const existing = await db.collection("newsletter").findOne({ email });
    const wasUnsubscribed = !!existing?.unsubscribedAt;

    await db.collection("newsletter").updateOne(
      { email },
      {
        $setOnInsert: { email, subscribedAt: new Date() },
        $unset: { unsubscribedAt: "" },
      },
      { upsert: true }
    );

    // Treat first-time subscribers and previously-unsubscribed re-joiners as "new"
    // so they receive the welcome email again.
    return !existing || wasUnsubscribed;
  }

  async getAllNewsletterSubscribers(): Promise<string[]> {
    const db = await getDb();
    const docs = await db
      .collection("newsletter")
      .find({ unsubscribedAt: { $exists: false } })
      .sort({ subscribedAt: 1 })
      .toArray();
    return docs.map((d) => d.email);
  }

  // Newsletter · returns true if a subscriber was found and removed.
  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .collection("newsletter")
      .updateOne(
        { email },
        { $set: { unsubscribedAt: new Date() } },
      );
    return result.matchedCount > 0;
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

  async getAllCustomers(): Promise<Customer[]> {
    const db = await getDb();
    const docs = await db.collection("customers").find().sort({ createdAt: -1 }).toArray();
    return docs.map(docToCustomer);
  }

  async updateCustomerPassword(customerId: string, passwordHash: string): Promise<boolean> {
    const db = await getDb();
    try {
      const result = await db.collection("customers").updateOne(
        { _id: new ObjectId(customerId) },
        { $set: { passwordHash, passwordChangedAt: new Date() } },
      );
      return result.matchedCount > 0;
    } catch {
      return false;
    }
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

  async updateOrderStatus(
    id: string,
    status: Order["status"],
    extra?: { trackingNumber?: string | null }
  ): Promise<Order | null> {
    const db = await getDb();
    try {
      const _id = new ObjectId(id);
      const update: any = { status };
      if (extra && "trackingNumber" in extra) {
        update.trackingNumber = extra.trackingNumber ?? null;
      }
      if (status === "shipped") {
        update.shippedAt = new Date();
      }
      const result = await db.collection("orders").findOneAndUpdate(
        { _id },
        { $set: update },
        { returnDocument: "after" }
      );
      return result ? docToOrder(result) : null;
    } catch {
      return null;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = await getDb();
    try {
      const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch {
      return false;
    }
  }

  async getOrder(id: string): Promise<Order | null> {
    const db = await getDb();
    try {
      const doc = await db.collection("orders").findOne({ _id: new ObjectId(id) });
      return doc ? docToOrder(doc) : null;
    } catch { return null; }
  }

  async getOrderByNumberAndEmail(orderNumber: string, email: string): Promise<Order | null> {
    const db = await getDb();
    try {
      const doc = await db.collection("orders").findOne({
        orderNumber: orderNumber.toUpperCase(),
        customerEmail: email.toLowerCase(),
      });
      return doc ? docToOrder(doc) : null;
    } catch { return null; }
  }

  // Promo Codes
  async createPromoCode(data: InsertPromoCode): Promise<PromoCode> {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection("promoCodes").insertOne({ ...data, usageCount: 0, createdAt: now });
    return docToPromo({ _id: result.insertedId, ...data, usageCount: 0, createdAt: now });
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | null> {
    const db = await getDb();
    const doc = await db.collection("promoCodes").findOne({ code: code.toUpperCase() });
    return doc ? docToPromo(doc) : null;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    const db = await getDb();
    const docs = await db.collection("promoCodes").find().sort({ createdAt: -1 }).toArray();
    return docs.map(docToPromo);
  }

  async updatePromoCode(id: string, data: Partial<InsertPromoCode>): Promise<PromoCode | null> {
    const db = await getDb();
    try {
      const result = await db.collection("promoCodes").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: "after" }
      );
      return result ? docToPromo(result) : null;
    } catch { return null; }
  }

  async deletePromoCode(id: string): Promise<void> {
    const db = await getDb();
    try { await db.collection("promoCodes").deleteOne({ _id: new ObjectId(id) }); } catch {}
  }

  async incrementPromoUsage(code: string): Promise<void> {
    const db = await getDb();
    await db.collection("promoCodes").updateOne(
      { code: code.toUpperCase() },
      { $inc: { usageCount: 1 } }
    );
  }
}

export const storage = new Storage();
