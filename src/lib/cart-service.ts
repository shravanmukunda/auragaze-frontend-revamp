import { prisma } from "@/lib/prisma";
import { productRelations } from "@/lib/product-mapper";
import type { CartLineInput, CartSummary, EnrichedCartLine } from "@/types/cart";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: "asc" as const },
                take: 1,
              },
            },
          },
        },
      },
    },
  },
} as const;

async function getOrCreateCart(userId: string) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (existing) return existing;

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

function mapCartItem(item: {
  id: string;
  quantity: number;
  variantId: string;
  variant: {
    stock: number;
    size: string;
    color: string;
    product: {
      id: string;
      slug: string;
      name: string;
      brand: string;
      price: { toString(): string };
      isActive: boolean;
      images: { imageUrl: string }[];
    };
  };
}): EnrichedCartLine | null {
  const product = item.variant.product;
  if (!product.isActive) return null;

  const quantity = Math.min(item.quantity, item.variant.stock);
  if (quantity <= 0 || item.variant.stock <= 0) return null;

  return {
    id: item.id,
    variantId: item.variantId,
    quantity,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    brand: product.brand,
    image: product.images[0]?.imageUrl ?? "/hero-poster.jpg",
    price: Number(product.price),
    size: item.variant.size,
    color: item.variant.color,
    stock: item.variant.stock,
  };
}

function summarize(items: EnrichedCartLine[]): CartSummary {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return { items, itemCount, subtotal };
}

export async function getUserCart(userId: string): Promise<CartSummary> {
  const cart = await getOrCreateCart(userId);
  const items = cart.items
    .map(mapCartItem)
    .filter((item): item is EnrichedCartLine => item !== null);

  return summarize(items);
}

async function getActiveVariant(variantId: string) {
  return prisma.productVariant.findFirst({
    where: {
      id: variantId,
      stock: { gt: 0 },
      product: { isActive: true },
    },
    include: {
      product: true,
    },
  });
}

export async function addCartItem(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartSummary> {
  const variant = await getActiveVariant(variantId);
  if (!variant) {
    throw new Error("Variant unavailable");
  }

  const addAmount = Math.max(1, Math.floor(quantity));
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.variantId === variantId);
  const capped = Math.min(
    variant.stock,
    (existing?.quantity ?? 0) + addAmount,
  );

  if (capped <= 0) {
    return getUserCart(userId);
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId,
      },
    },
    create: {
      cartId: cart.id,
      variantId,
      quantity: capped,
    },
    update: {
      quantity: capped,
    },
  });

  return getUserCart(userId);
}

export async function updateCartItemQuantity(
  userId: string,
  variantId: string,
  quantity: number,
): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

  if (!cart) return getUserCart(userId);

  const existing = cart.items.find((item) => item.variantId === variantId);
  if (!existing) {
    throw new Error("Cart item not found");
  }

  const nextQuantity = Math.floor(quantity);
  if (nextQuantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
    return getUserCart(userId);
  }

  const cappedQuantity = Math.min(existing.variant.stock, nextQuantity);
  if (cappedQuantity <= 0 || !existing.variant.product.isActive) {
    await prisma.cartItem.delete({ where: { id: existing.id } });
    return getUserCart(userId);
  }

  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: cappedQuantity },
  });

  return getUserCart(userId);
}

export async function removeCartItem(
  userId: string,
  variantId: string,
): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      id: true,
      items: {
        where: { variantId },
        select: { id: true },
      },
    },
  });

  if (cart?.items[0]) {
    await prisma.cartItem.delete({ where: { id: cart.items[0].id } });
  }

  return getUserCart(userId);
}

export async function clearUserCart(userId: string): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return { items: [], itemCount: 0, subtotal: 0 };
}

export async function mergeGuestCart(
  userId: string,
  guestItems: CartLineInput[],
): Promise<CartSummary> {
  if (guestItems.length === 0) {
    return getUserCart(userId);
  }

  const cart = await getOrCreateCart(userId);
  const variantIds = [...new Set(guestItems.map((item) => item.variantId))];

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      stock: { gt: 0 },
      product: { isActive: true },
    },
  });

  const variantById = new Map(variants.map((variant) => [variant.id, variant]));
  const merged = new Map<string, number>();

  for (const item of guestItems) {
    const variant = variantById.get(item.variantId);
    if (!variant) continue;

    const quantity = Math.max(1, Math.floor(item.quantity));
    merged.set(
      item.variantId,
      (merged.get(item.variantId) ?? 0) + quantity,
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const [variantId, guestQuantity] of merged) {
      const variant = variantById.get(variantId);
      if (!variant) continue;

      const existing = cart.items.find((item) => item.variantId === variantId);
      const combined = (existing?.quantity ?? 0) + guestQuantity;
      const capped = Math.min(variant.stock, combined);

      if (capped <= 0) {
        if (existing) {
          await tx.cartItem.delete({ where: { id: existing.id } });
        }
        continue;
      }

      await tx.cartItem.upsert({
        where: {
          cartId_variantId: {
            cartId: cart.id,
            variantId,
          },
        },
        create: {
          cartId: cart.id,
          variantId,
          quantity: capped,
        },
        update: {
          quantity: capped,
        },
      });
    }
  });

  return getUserCart(userId);
}

export async function validateVariantIds(variantIds: string[]) {
  if (variantIds.length === 0) return new Set<string>();

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: variantIds },
      product: { isActive: true },
    },
    select: { id: true },
  });

  return new Set(variants.map((variant) => variant.id));
}

export { productRelations };
