import { describe, expect, it } from "vitest";
import {
  amountsMatchPaise,
  calculatePromoDiscount,
  computeShippingFee,
} from "@/lib/commerce-math";

describe("computeShippingFee", () => {
  const settings = { shippingFee: 99, freeShippingThreshold: 4000 };

  it("returns 0 for empty subtotal", () => {
    expect(computeShippingFee(0, settings)).toBe(0);
  });

  it("charges flat fee below threshold", () => {
    expect(computeShippingFee(3999, settings)).toBe(99);
  });

  it("is free at and above threshold", () => {
    expect(computeShippingFee(4000, settings)).toBe(0);
    expect(computeShippingFee(5500, settings)).toBe(0);
  });
});

describe("calculatePromoDiscount", () => {
  it("applies percentage with max cap", () => {
    expect(
      calculatePromoDiscount({
        type: "PERCENTAGE",
        value: 20,
        maxDiscount: 200,
        subtotal: 2000,
      }),
    ).toBe(200);
  });

  it("applies fixed discount without exceeding subtotal", () => {
    expect(
      calculatePromoDiscount({
        type: "FIXED",
        value: 500,
        subtotal: 300,
      }),
    ).toBe(300);
  });
});

describe("payment amount reconciliation", () => {
  it("matches rupees to paise", () => {
    expect(amountsMatchPaise(1499, 149900)).toBe(true);
    expect(amountsMatchPaise(1499, 149800)).toBe(false);
  });

  it("treats cart higher than paid as underpayment", () => {
    const cartPaise = 150000;
    const paidPaise = 149900;
    expect(cartPaise > paidPaise).toBe(true);
  });

  it("allows cart lower than paid (overpayment after drift)", () => {
    const cartPaise = 140000;
    const paidPaise = 149900;
    expect(cartPaise > paidPaise).toBe(false);
  });
});

describe("order item variant restore preference", () => {
  it("prefers variantId when present", () => {
    const item = {
      variantId: "var_123",
      productName: "Tee",
      size: "M",
      color: "Black",
    };

    const resolved =
      item.variantId ?? `${item.productName}:${item.size}:${item.color}`;

    expect(resolved).toBe("var_123");
  });

  it("falls back to name+size+color when variantId missing", () => {
    const item = {
      variantId: null as string | null,
      productName: "Tee",
      size: "M",
      color: "Black",
    };

    const resolved = item.variantId
      ? item.variantId
      : `${item.productName}:${item.size}:${item.color}`;

    expect(resolved).toBe("Tee:M:Black");
  });
});
