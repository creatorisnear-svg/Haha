import { db, productsTable, settingsTable, newsletterTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { InsertProduct } from "@workspace/db";

export class Storage {
  async listProducts() {
    return db.select().from(productsTable).orderBy(productsTable.createdAt);
  }

  async getProduct(id: string) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    return product ?? null;
  }

  async createProduct(data: InsertProduct) {
    const [product] = await db.insert(productsTable).values(data).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>) {
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    return product ?? null;
  }

  async deleteProduct(id: string) {
    await db.delete(productsTable).where(eq(productsTable.id, id));
  }

  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string) {
    await db
      .insert(settingsTable)
      .values({ key, value })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value } });
  }

  async subscribeNewsletter(email: string) {
    await db
      .insert(newsletterTable)
      .values({ email })
      .onConflictDoNothing();
  }
}

export const storage = new Storage();
