import { prisma } from "@/lib/prisma";
import { mapProduct, productRelations } from "@/lib/product-mapper";
import type { StorefrontProduct } from "@/types/product";

export class WishlistError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WishlistError";
    this.status = status;
  }
}

export async function getUserWishlistIds(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => item.productId);
}

export async function getUserWishlistProducts(
  userId: string,
): Promise<StorefrontProduct[]> {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: productRelations,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items
    .filter((item) => item.product.isActive)
    .map((item) => mapProduct(item.product));
}

export async function addWishlistItem(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });

  if (!product) {
    throw new WishlistError("Product not found.", 404);
  }

  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    update: {},
    create: { userId, productId },
  });

  return { productId };
}

export async function removeWishlistItem(userId: string, productId: string) {
  const deleted = await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });

  if (deleted.count === 0) {
    throw new WishlistError("Wishlist item not found.", 404);
  }
}
