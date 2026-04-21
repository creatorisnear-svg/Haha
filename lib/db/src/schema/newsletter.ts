import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const newsletterTable = pgTable("newsletter", {
  email: text("email").primaryKey(),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsletterSubscriber = typeof newsletterTable.$inferSelect;
