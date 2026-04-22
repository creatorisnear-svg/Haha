import { storage } from "../storage";
import { logger } from "./logger";
import { sendAbandonedCartReminder, sendRestockNotification } from "./email";

const HOUR = 60 * 60 * 1000;

// Customers get a single reminder if their cart has sat untouched for 24h.
const ABANDONED_THRESHOLD_MS = 24 * HOUR;

let started = false;
let lastReleaseScanAt = Date.now();

function getBaseUrl(): string {
  const canonical = process.env.CANONICAL_HOST;
  if (canonical) return `https://${canonical}`;
  return "https://vaaclothing.xyz";
}

async function processAbandonedCarts(): Promise<void> {
  const carts = await storage.findAbandonedCarts(ABANDONED_THRESHOLD_MS);
  if (carts.length === 0) return;
  logger.info({ count: carts.length }, "Scheduler: sending abandoned cart reminders");
  for (const cart of carts) {
    if (!cart.customerEmail || cart.items.length === 0) continue;
    try {
      await sendAbandonedCartReminder({
        customerName: cart.customerName,
        customerEmail: cart.customerEmail,
        items: cart.items.map((i) => ({
          productName: i.productName,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl ?? null,
        })),
        baseUrl: getBaseUrl(),
      });
      await storage.markCartReminderSent(cart.customerId);
    } catch (err) {
      logger.error({ err, customerId: cart.customerId }, "Abandoned cart email failed");
    }
  }
}

async function processReleaseNotifications(): Promise<void> {
  const now = Date.now();
  // Look back from the last scan with a small overlap, in case of slow ticks.
  const sinceMs = Math.min(now - lastReleaseScanAt + HOUR, 6 * HOUR);
  const products = await storage.findProductsJustReleased(sinceMs);
  lastReleaseScanAt = now;
  if (products.length === 0) return;
  for (const product of products) {
    const subs = await storage.getRestockSubscribers(product.id, "release");
    if (subs.length === 0) continue;
    logger.info(
      { productId: product.id, count: subs.length },
      "Scheduler: sending drop release notifications",
    );
    for (const sub of subs) {
      try {
        await sendRestockNotification(sub.email, {
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          imageUrl: product.imageUrl ?? null,
          baseUrl: getBaseUrl(),
          type: "release",
        });
      } catch (err) {
        logger.error({ err, productId: product.id, email: sub.email }, "Release email failed");
      }
    }
    await storage.clearRestockSubscribers(product.id, "release");
  }
}

async function tick(): Promise<void> {
  try {
    await processAbandonedCarts();
  } catch (err) {
    logger.error({ err }, "Scheduler: abandoned-cart tick failed");
  }
  try {
    await processReleaseNotifications();
  } catch (err) {
    logger.error({ err }, "Scheduler: release-notification tick failed");
  }
}

export function startScheduler(): void {
  if (started) return;
  if (!process.env.MONGODB_URI) {
    logger.warn("Scheduler not started: MONGODB_URI is not set.");
    return;
  }
  started = true;
  logger.info("Scheduler started · checking every hour");
  // Run shortly after boot, then every hour.
  setTimeout(() => {
    tick().catch(() => undefined);
  }, 30_000);
  setInterval(() => {
    tick().catch(() => undefined);
  }, HOUR);
}
