import { storage } from "../storage";

export interface PricingItem {
  productId: string;
  quantity: number;
}

export interface PriceBreakdown {
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedPromoCode: string | null;
}

export async function computePricing(
  items: PricingItem[],
  promoCode?: string | null,
): Promise<PriceBreakdown> {
  const lineTotals = await Promise.all(
    items.map(async (item) => {
      const product = await storage.getProduct(item.productId);
      if (!product) throw new Error("Product not found");
      return product.price * item.quantity;
    }),
  );
  const subtotal = lineTotals.reduce((sum, n) => sum + n, 0);

  let discountAmount = 0;
  let appliedPromoCode: string | null = null;

  if (promoCode) {
    const promo = await storage.getPromoCodeByCode(String(promoCode).trim());
    if (promo && promo.active) {
      const now = new Date();
      const notExpired = !promo.expiresAt || promo.expiresAt >= now;
      const underLimit = promo.usageLimit === null || promo.usageCount < promo.usageLimit;
      const subtotalDollars = subtotal / 100;
      const meetsMin =
        promo.minOrderValue === null ||
        promo.minOrderValue === undefined ||
        subtotalDollars >= promo.minOrderValue;

      if (notExpired && underLimit && meetsMin) {
        if (promo.discountType === "percent") {
          discountAmount = Math.round(subtotal * (promo.discountAmount / 100));
        } else {
          discountAmount = Math.min(Math.round(promo.discountAmount * 100), subtotal);
        }
        appliedPromoCode = promo.code;
      }
    }
  }

  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total, appliedPromoCode };
}
