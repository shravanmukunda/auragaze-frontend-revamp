import type { Prisma } from "@prisma/client";
import type {
  StorefrontProduct,
  StorefrontProductVariant,
} from "@/types/product";

export const productRelations = {
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  variants: {
    orderBy: [{ color: "asc" as const }, { size: "asc" as const }],
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productRelations;
}>;

const SIZE_ORDER = [
  "XXXS",
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

function uniqueInOrder(values: string[]) {
  return [...new Set(values)];
}

function sortSizes(sizes: string[]) {
  return uniqueInOrder(sizes).sort((left, right) => {
    const leftIndex = SIZE_ORDER.indexOf(left);
    const rightIndex = SIZE_ORDER.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
}

export function mapProduct(product: ProductWithRelations): StorefrontProduct {
  const variants: StorefrontProductVariant[] = product.variants.map(
    (variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    }),
  );
  const images = product.images.map((image) => image.imageUrl);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null
        ? undefined
        : Number(product.originalPrice),
    category: product.category,
    subcategory: product.subcategory,
    image: images[0] ?? "/hero-poster.jpg",
    images: images.length > 0 ? images : ["/hero-poster.jpg"],
    rating: Number(product.rating),
    reviews: product.reviewCount,
    description: product.description,
    features: product.features,
    colors: uniqueInOrder(variants.map((variant) => variant.color)),
    sizes: sortSizes(variants.map((variant) => variant.size)),
    stock: variants.reduce((total, variant) => total + variant.stock, 0),
    badge: product.badge?.toLowerCase() as StorefrontProduct["badge"],
    isFavorite: false,
    isFeatured: product.isFeatured,
    createdAt: product.createdAt.toISOString(),
    variants,
  };
}
