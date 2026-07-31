import type { ShippingSettings } from "@/types/admin-settings";

/** Pure shipping fee helper — used by checkout and unit tests. */
export function computeShippingFee(
  subtotal: number,
  settings: ShippingSettings,
): number {
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}

export function calculatePromoDiscount(input: {
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number | null;
  subtotal: number;
}): number {
  const { type, value, maxDiscount, subtotal } = input;
  if (subtotal <= 0) return 0;

  let discount = 0;
  if (type === "PERCENTAGE") {
    discount = (subtotal * value) / 100;
    if (maxDiscount != null) {
      discount = Math.min(discount, maxDiscount);
    }
  } else {
    discount = value;
  }

  return Math.min(subtotal, Math.max(0, Math.round(discount)));
}

export function amountsMatchPaise(orderTotalRupees: number, paidPaise: number) {
  return Math.round(orderTotalRupees * 100) === paidPaise;
}
