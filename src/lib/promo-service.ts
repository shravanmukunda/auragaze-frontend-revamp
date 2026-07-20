import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PromoValidation } from "@/types/promo";
import { PromoType } from "@prisma/client";

export class PromoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PromoError";
    this.status = status;
  }
}

type PromoRecord = {
  id: string;
  code: string;
  description: string | null;
  type: PromoType;
  value: Prisma.Decimal;
  minOrderAmount: Prisma.Decimal;
  maxDiscount: Prisma.Decimal | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function calculateDiscount(promo: PromoRecord, subtotal: number) {
  if (subtotal <= 0) return 0;

  let discount = 0;
  if (promo.type === PromoType.PERCENTAGE) {
    discount = (subtotal * Number(promo.value)) / 100;
    if (promo.maxDiscount !== null) {
      discount = Math.min(discount, Number(promo.maxDiscount));
    }
  } else {
    discount = Number(promo.value);
  }

  return Math.min(subtotal, Math.max(0, Math.round(discount)));
}

function assertPromoUsable(promo: PromoRecord, subtotal: number) {
  if (!promo.isActive) {
    throw new PromoError("This promo code is no longer active.");
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    throw new PromoError("This promo code has expired.");
  }

  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
    throw new PromoError("This promo code has reached its usage limit.");
  }

  const minOrderAmount = Number(promo.minOrderAmount);
  if (subtotal < minOrderAmount) {
    throw new PromoError(
      `Minimum order amount is ₹${minOrderAmount.toLocaleString("en-IN")}.`,
    );
  }
}

export async function getPromoByCode(
  code: string,
  client: DbClient = prisma,
): Promise<PromoRecord | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  return client.promoCode.findUnique({
    where: { code: normalized },
  });
}

export function buildPromoValidation(
  promo: PromoRecord,
  subtotal: number,
): PromoValidation {
  const discount = calculateDiscount(promo, subtotal);

  return {
    code: promo.code,
    description: promo.description,
    discount,
    subtotal,
    totalAfterDiscount: Math.max(0, subtotal - discount),
  };
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
  client: DbClient = prisma,
): Promise<PromoValidation> {
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new PromoError("Invalid order subtotal.");
  }

  const promo = await getPromoByCode(code, client);
  if (!promo) {
    throw new PromoError("Invalid promo code.");
  }

  assertPromoUsable(promo, subtotal);
  return buildPromoValidation(promo, subtotal);
}

export async function reservePromoCode(
  code: string,
  subtotal: number,
  tx: Prisma.TransactionClient,
) {
  const validation = await validatePromoCode(code, subtotal, tx);
  const promo = await getPromoByCode(code, tx);
  if (!promo) {
    throw new PromoError("Invalid promo code.");
  }

  if (promo.usageLimit !== null) {
    const updated = await tx.promoCode.updateMany({
      where: {
        id: promo.id,
        usedCount: { lt: promo.usageLimit },
      },
      data: { usedCount: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new PromoError("This promo code has reached its usage limit.", 409);
    }
  } else {
    await tx.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  return validation;
}
