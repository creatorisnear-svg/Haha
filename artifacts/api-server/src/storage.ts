import { ObjectId } from "mongodb";
import { getDb } from "./lib/mongodb";

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

export class Storage {
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
    } catch {
      return null;
    }
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const db = await getDb();
    const now = new Date();
    const result = await db.collection("products").insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
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
    } catch {
      return null;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const db = await getDb();
    try {
      await db.collection("products").deleteOne({ _id: new ObjectId(id) });
    } catch {
      // ignore
    }
  }

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

  async subscribeNewsletter(email: string): Promise<void> {
    const db = await getDb();
    await db.collection("newsletter").updateOne(
      { email },
      { $setOnInsert: { email, subscribedAt: new Date() } },
      { upsert: true }
    );
  }
}

export const storage = new Storage();
