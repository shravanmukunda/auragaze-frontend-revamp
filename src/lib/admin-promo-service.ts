import { PromoType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminPromo, AdminPromoInput } from "@/types/admin-settings";

export class AdminPromoError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdminPromoError";
    this.status = status;
  }
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function mapAdminPromo(promo: {
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
  createdAt: Date;
  updatedAt: Date;
}): AdminPromo {
  return {
    id: promo.id,
    code: promo.code,
    description: promo.description,
    type: promo.type,
    value: Number(promo.value),
    minOrderAmount: Number(promo.minOrderAmount),
    maxDiscount:
      promo.maxDiscount === null ? null : Number(promo.maxDiscount),
    isActive: promo.isActive,
    usageLimit: promo.usageLimit,
    usedCount: promo.usedCount,
    expiresAt: promo.expiresAt?.toISOString() ?? null,
    createdAt: promo.createdAt.toISOString(),
    updatedAt: promo.updatedAt.toISOString(),
  };
}

export async function listAdminPromos(params?: { query?: string }) {
  const query = params?.query?.trim();
  const promos = await prisma.promoCode.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  return promos.map(mapAdminPromo);
}

export async function getAdminPromo(id: string) {
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  return promo ? mapAdminPromo(promo) : null;
}

export function parseAdminPromoInput(body: unknown): {
  data?: AdminPromoInput;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const record = body as Record<string, unknown>;
  const code =
    typeof record.code === "string" ? normalizeCode(record.code) : "";
  if (!code || code.length > 40) {
    return { error: "Promo code is required (max 40 characters)." };
  }

  const typeRaw =
    typeof record.type === "string" ? record.type.trim().toUpperCase() : "";
  if (typeRaw !== "PERCENTAGE" && typeRaw !== "FIXED") {
    return { error: "Type must be PERCENTAGE or FIXED." };
  }
  const type = typeRaw as AdminPromoInput["type"];

  const value = Number(record.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Value must be a positive number." };
  }
  if (type === "PERCENTAGE" && value > 100) {
    return { error: "Percentage value cannot exceed 100." };
  }

  const minOrderAmount = Number(record.minOrderAmount ?? 0);
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    return { error: "Minimum order amount must be non-negative." };
  }

  let maxDiscount: number | null = null;
  if (record.maxDiscount !== undefined && record.maxDiscount !== null && record.maxDiscount !== "") {
    maxDiscount = Number(record.maxDiscount);
    if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
      return { error: "Max discount must be non-negative." };
    }
  }

  let usageLimit: number | null = null;
  if (record.usageLimit !== undefined && record.usageLimit !== null && record.usageLimit !== "") {
    usageLimit = Number(record.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit < 1) {
      return { error: "Usage limit must be a positive integer." };
    }
  }

  let expiresAt: string | null = null;
  if (record.expiresAt !== undefined && record.expiresAt !== null && record.expiresAt !== "") {
    if (typeof record.expiresAt !== "string") {
      return { error: "Expires at must be an ISO date string." };
    }
    const parsed = new Date(record.expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Expires at must be a valid date." };
    }
    expiresAt = parsed.toISOString();
  }

  const description =
    typeof record.description === "string"
      ? record.description.trim() || null
      : null;

  const isActive = record.isActive !== false;

  return {
    data: {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      isActive,
      usageLimit,
      expiresAt,
    },
  };
}

export async function createAdminPromo(input: AdminPromoInput) {
  try {
    const promo = await prisma.promoCode.create({
      data: {
        code: input.code,
        description: input.description ?? null,
        type: input.type as PromoType,
        value: input.value,
        minOrderAmount: input.minOrderAmount,
        maxDiscount: input.maxDiscount ?? null,
        isActive: input.isActive,
        usageLimit: input.usageLimit ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapAdminPromo(promo);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      throw new AdminPromoError("A promo with that code already exists.", 409);
    }
    throw error;
  }
}

export async function updateAdminPromo(id: string, input: AdminPromoInput) {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    throw new AdminPromoError("Promo code not found.", 404);
  }

  if (
    input.usageLimit !== null &&
    input.usageLimit !== undefined &&
    input.usageLimit < existing.usedCount
  ) {
    throw new AdminPromoError(
      `Usage limit cannot be below current usage (${existing.usedCount}).`,
    );
  }

  try {
    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        code: input.code,
        description: input.description ?? null,
        type: input.type as PromoType,
        value: input.value,
        minOrderAmount: input.minOrderAmount,
        maxDiscount: input.maxDiscount ?? null,
        isActive: input.isActive,
        usageLimit: input.usageLimit ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapAdminPromo(promo);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      throw new AdminPromoError("A promo with that code already exists.", 409);
    }
    throw error;
  }
}

export async function setAdminPromoActive(id: string, isActive: boolean) {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    throw new AdminPromoError("Promo code not found.", 404);
  }

  const promo = await prisma.promoCode.update({
    where: { id },
    data: { isActive },
  });
  return mapAdminPromo(promo);
}

export async function deleteAdminPromo(id: string) {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) {
    throw new AdminPromoError("Promo code not found.", 404);
  }

  await prisma.promoCode.delete({ where: { id } });
}
