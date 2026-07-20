import { prisma } from "@/lib/prisma";
import {
  LOW_STOCK_THRESHOLD,
  type InventoryAdjustInput,
  type InventoryRow,
  type InventoryTransactionRow,
  type InventoryTxnType,
} from "@/types/admin-inventory";
import { InventoryType, Prisma } from "@prisma/client";

const variantInclude = {
  product: {
    include: {
      images: {
        orderBy: { sortOrder: "asc" as const },
        take: 1,
      },
    },
  },
} satisfies Prisma.ProductVariantInclude;

type VariantRecord = Prisma.ProductVariantGetPayload<{
  include: typeof variantInclude;
}>;

function mapInventoryRow(variant: VariantRecord): InventoryRow {
  return {
    variantId: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
    isLowStock: variant.stock <= LOW_STOCK_THRESHOLD,
    productId: variant.product.id,
    productName: variant.product.name,
    brand: variant.product.brand,
    category: variant.product.category,
    isActive: variant.product.isActive,
    imageUrl: variant.product.images[0]?.imageUrl ?? null,
    updatedAt: variant.updatedAt.toISOString(),
  };
}

function mapTransaction(
  row: {
    id: string;
    variantId: string;
    type: InventoryType;
    quantity: number;
    note: string | null;
    createdAt: Date;
  },
): InventoryTransactionRow {
  return {
    id: row.id,
    variantId: row.variantId,
    type: row.type as InventoryTxnType,
    quantity: row.quantity,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function parseAdjustInput(
  value: unknown,
): { data?: InventoryAdjustInput; error?: string } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid request body." };
  }

  const body = value as Record<string, unknown>;
  const variantId =
    typeof body.variantId === "string" ? body.variantId.trim() : "";
  const typeRaw =
    typeof body.type === "string" ? body.type.trim().toUpperCase() : "";
  const quantity = Number(body.quantity);
  const note =
    typeof body.note === "string" ? body.note.trim() || undefined : undefined;

  if (!variantId) return { error: "Variant ID is required." };
  if (!(typeRaw in InventoryType)) {
    return { error: "Type must be IN, OUT, or ADJUSTMENT." };
  }
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
    return { error: "Quantity must be a non-negative integer." };
  }
  if (typeRaw !== "ADJUSTMENT" && quantity <= 0) {
    return { error: "Quantity must be greater than zero." };
  }

  return {
    data: {
      variantId,
      type: InventoryType[typeRaw as keyof typeof InventoryType],
      quantity,
      note,
    },
  };
}

export async function listInventory(params: {
  query?: string;
  lowStockOnly?: boolean;
  includeInactive?: boolean;
}) {
  const query = params.query?.trim();

  const where: Prisma.ProductVariantWhereInput = {
    ...(params.lowStockOnly && {
      stock: { lte: LOW_STOCK_THRESHOLD },
    }),
    ...(!params.includeInactive && {
      product: { isActive: true },
    }),
    ...(query && {
      OR: [
        { sku: { contains: query, mode: "insensitive" } },
        { color: { contains: query, mode: "insensitive" } },
        { size: { contains: query, mode: "insensitive" } },
        {
          product: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
            ],
            ...(!params.includeInactive && { isActive: true }),
          },
        },
      ],
    }),
  };

  const variants = await prisma.productVariant.findMany({
    where,
    include: variantInclude,
    orderBy: [
      { stock: "asc" },
      { product: { name: "asc" } },
      { color: "asc" },
      { size: "asc" },
    ],
  });

  return variants.map(mapInventoryRow);
}

export async function getVariantHistory(variantId: string, limit = 50) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: variantInclude,
  });

  if (!variant) return null;

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
  });

  return {
    variant: mapInventoryRow(variant),
    transactions: transactions.map(mapTransaction),
  };
}

export class InventoryError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InventoryError";
    this.status = status;
  }
}

export async function adjustInventory(input: InventoryAdjustInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      include: variantInclude,
    });

    if (!existing) {
      throw new InventoryError("Variant not found.", 404);
    }

    const previousStock = existing.stock;
    let nextStock = previousStock;
    let transactionQuantity = input.quantity;
    let note = input.note;

    if (input.type === InventoryType.IN) {
      nextStock = previousStock + input.quantity;
    } else if (input.type === InventoryType.OUT) {
      if (previousStock < input.quantity) {
        throw new InventoryError(
          `Insufficient stock. Current stock is ${previousStock}.`,
          409,
        );
      }
      nextStock = previousStock - input.quantity;
    } else {
      // ADJUSTMENT: set absolute stock level
      nextStock = input.quantity;
      const delta = nextStock - previousStock;
      transactionQuantity = Math.abs(delta);
      note =
        note ??
        `Adjusted from ${previousStock} to ${nextStock}`;
      if (delta === 0) {
        throw new InventoryError("Stock is already at that level.", 400);
      }
    }

    const updated = await tx.productVariant.update({
      where: { id: input.variantId },
      data: { stock: nextStock },
      include: variantInclude,
    });

    const transaction = await tx.inventoryTransaction.create({
      data: {
        variantId: input.variantId,
        type: input.type,
        quantity: transactionQuantity,
        note: note ?? null,
      },
    });

    return {
      variant: mapInventoryRow(updated),
      transaction: mapTransaction(transaction),
    };
  });
}
