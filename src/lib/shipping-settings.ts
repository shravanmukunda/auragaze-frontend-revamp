import { prisma } from "@/lib/prisma";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
} from "@/lib/data";
import { computeShippingFee } from "@/lib/commerce-math";
import type { ShippingSettings } from "@/types/admin-settings";

export { computeShippingFee };

export class SettingsError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SettingsError";
    this.status = status;
  }
}

function mapSettings(row: {
  shippingFee: { toString(): string } | number;
  freeShippingThreshold: { toString(): string } | number;
}): ShippingSettings {
  return {
    shippingFee: Number(row.shippingFee),
    freeShippingThreshold: Number(row.freeShippingThreshold),
  };
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (existing) return mapSettings(existing);

  const created = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shippingFee: SHIPPING_FEE,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    },
  });

  return mapSettings(created);
}

export async function updateShippingSettings(input: {
  shippingFee: number;
  freeShippingThreshold: number;
}): Promise<ShippingSettings> {
  if (!Number.isFinite(input.shippingFee) || input.shippingFee < 0) {
    throw new SettingsError("Shipping fee must be a non-negative number.");
  }
  if (
    !Number.isFinite(input.freeShippingThreshold) ||
    input.freeShippingThreshold < 0
  ) {
    throw new SettingsError(
      "Free shipping threshold must be a non-negative number.",
    );
  }

  const updated = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      shippingFee: input.shippingFee,
      freeShippingThreshold: input.freeShippingThreshold,
    },
    create: {
      id: "default",
      shippingFee: input.shippingFee,
      freeShippingThreshold: input.freeShippingThreshold,
    },
  });

  return mapSettings(updated);
}

export function parseShippingSettingsInput(body: unknown): {
  data?: { shippingFee: number; freeShippingThreshold: number };
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body." };
  }

  const record = body as Record<string, unknown>;
  const shippingFee = Number(record.shippingFee);
  const freeShippingThreshold = Number(record.freeShippingThreshold);

  if (!Number.isFinite(shippingFee) || shippingFee < 0) {
    return { error: "Shipping fee must be a non-negative number." };
  }
  if (!Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
    return { error: "Free shipping threshold must be a non-negative number." };
  }

  return {
    data: {
      shippingFee: Math.round(shippingFee),
      freeShippingThreshold: Math.round(freeShippingThreshold),
    },
  };
}
