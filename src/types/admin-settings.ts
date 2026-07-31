export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
};

export type AdminPromo = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPromoInput = {
  code: string;
  description?: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  isActive: boolean;
  usageLimit?: number | null;
  expiresAt?: string | null;
};
