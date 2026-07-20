import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import type {
  AdminProduct,
  AdminProductInput,
  AdminProductVariantInput,
} from "@/types/admin-product";
import { Prisma, ProductBadge } from "@prisma/client";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: [{ color: "asc" as const }, { size: "asc" as const }] },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function mapAdminProduct(product: ProductRecord): AdminProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    price: Number(product.price),
    originalPrice:
      product.originalPrice === null ? null : Number(product.originalPrice),
    badge: product.badge,
    features: product.features,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    images: product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      sortOrder: image.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: variant.stock,
    })),
    totalStock: product.variants.reduce(
      (total, variant) => total + variant.stock,
      0,
    ),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function parseBadge(value: unknown): ProductBadge | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase();
  return normalized in ProductBadge
    ? ProductBadge[normalized as keyof typeof ProductBadge]
    : null;
}

function parseVariants(value: unknown): AdminProductVariantInput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];

  const variants: AdminProductVariantInput[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Partial<AdminProductVariantInput>;
    if (typeof record.size !== "string" || typeof record.color !== "string") {
      continue;
    }

    const stock = Number(record.stock);
    const sku =
      typeof record.sku === "string" ? record.sku.trim().toUpperCase() : "";
    variants.push({
      id: typeof record.id === "string" ? record.id : undefined,
      size: record.size.trim(),
      color: record.color.trim(),
      sku,
      stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
    });
  }

  return variants;
}

export function parseAdminProductInput(
  value: unknown,
): { data?: AdminProductInput; error?: string } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid request body." };
  }

  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const brand = typeof body.brand === "string" ? body.brand.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const subcategory =
    typeof body.subcategory === "string" ? body.subcategory.trim() : "";
  const price = Number(body.price);

  if (!name) return { error: "Product name is required." };
  if (!brand) return { error: "Brand is required." };
  if (!description) return { error: "Description is required." };
  if (!category) return { error: "Category is required." };
  if (!subcategory) return { error: "Subcategory is required." };
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Price must be greater than zero." };
  }

  const originalPrice =
    body.originalPrice === undefined || body.originalPrice === null
      ? null
      : Number(body.originalPrice);
  if (
    originalPrice !== null &&
    (!Number.isFinite(originalPrice) || originalPrice <= 0)
  ) {
    return { error: "Original price must be greater than zero." };
  }

  const features = Array.isArray(body.features)
    ? body.features
        .filter((feature): feature is string => typeof feature === "string")
        .map((feature) => feature.trim())
        .filter(Boolean)
    : [];

  const images = Array.isArray(body.images)
    ? body.images
        .filter((image): image is string => typeof image === "string")
        .map((image) => image.trim())
        .filter(Boolean)
    : [];

  const variants = parseVariants(body.variants) ?? [];

  return {
    data: {
      name,
      brand,
      description,
      category,
      subcategory,
      price,
      originalPrice,
      badge: parseBadge(body.badge),
      features,
      images,
      isActive:
        typeof body.isActive === "boolean" ? body.isActive : undefined,
      isFeatured:
        typeof body.isFeatured === "boolean" ? body.isFeatured : undefined,
      variants,
    },
  };
}

function buildSku(
  productName: string,
  color: string,
  size: string,
  suffix = "",
) {
  const prefix = slugify(productName).slice(0, 8).toUpperCase() || "AGZ";
  const colorCode = slugify(color).slice(-6).toUpperCase() || "COLOR";
  const sizeCode = size.toUpperCase();
  return [prefix, colorCode, sizeCode, suffix].filter(Boolean).join("-");
}

async function uniqueSlug(base: string) {
  const root = slugify(base) || "product";
  let candidate = root;
  let attempt = 0;

  while (attempt < 100) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return `${root}-${Date.now()}`;
}

function normalizeVariants(
  variants: AdminProductVariantInput[],
  productName: string,
) {
  const seen = new Set<string>();
  const normalized: AdminProductVariantInput[] = [];

  for (const [index, variant] of variants.entries()) {
    const size = variant.size.trim();
    const color = variant.color.trim();
    if (!size || !color) continue;

    const key = `${color.toLowerCase()}::${size.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      ...variant,
      size,
      color,
      sku:
        variant.sku.trim().toUpperCase() ||
        buildSku(productName, color, size, String(index + 1)),
      stock: Math.max(0, Math.floor(variant.stock)),
    });
  }

  return normalized;
}

export async function listAdminProducts(params: {
  query?: string;
  category?: string;
  includeInactive?: boolean;
}) {
  const where: Prisma.ProductWhereInput = {
    ...(params.includeInactive ? {} : { isActive: true }),
    ...(params.category && { category: params.category }),
    ...(params.query && {
      OR: [
        { name: { contains: params.query, mode: "insensitive" } },
        { brand: { contains: params.query, mode: "insensitive" } },
        { slug: { contains: params.query, mode: "insensitive" } },
      ],
    }),
  };

  const products = await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return products.map(mapAdminProduct);
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  return product ? mapAdminProduct(product) : null;
}

export async function createAdminProduct(input: AdminProductInput) {
  const variants = normalizeVariants(input.variants ?? [], input.name);
  const slug = await uniqueSlug(input.name);
  const images = input.images ?? [];

  const product = await prisma.product.create({
    data: {
      slug,
      name: input.name,
      brand: input.brand,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      badge: input.badge ?? null,
      features: input.features ?? [],
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      images: {
        create: images.map((imageUrl, sortOrder) => ({
          imageUrl,
          sortOrder,
        })),
      },
      variants: {
        create: variants.map((variant) => ({
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          ...(variant.stock > 0 && {
            inventoryTransactions: {
              create: {
                type: "IN",
                quantity: variant.stock,
                note: "Initial stock on product create",
              },
            },
          }),
        })),
      },
    },
    include: productInclude,
  });

  return mapAdminProduct(product);
}

export async function updateAdminProduct(
  id: string,
  input: AdminProductInput,
) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!existing) return null;

  const variants = normalizeVariants(input.variants ?? [], input.name);
  const images = input.images ?? [];
  const incomingIds = new Set(
    variants.map((variant) => variant.id).filter(Boolean) as string[],
  );
  const removedVariantIds = existing.variants
    .map((variant) => variant.id)
    .filter((variantId) => !incomingIds.has(variantId));

  const product = await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId: id } });

    if (removedVariantIds.length > 0) {
      await tx.productVariant.deleteMany({
        where: { id: { in: removedVariantIds }, productId: id },
      });
    }

    for (const variant of variants) {
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            stock: variant.stock,
          },
        });
        continue;
      }

      await tx.productVariant.create({
        data: {
          productId: id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          ...(variant.stock > 0 && {
            inventoryTransactions: {
              create: {
                type: "IN",
                quantity: variant.stock,
                note: "Initial stock on variant create",
              },
            },
          }),
        },
      });
    }

    return tx.product.update({
      where: { id },
      data: {
        name: input.name,
        brand: input.brand,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory,
        price: input.price,
        originalPrice: input.originalPrice ?? null,
        badge: input.badge ?? null,
        features: input.features ?? [],
        isActive: input.isActive ?? existing.isActive,
        isFeatured: input.isFeatured ?? existing.isFeatured,
        images: {
          create: images.map((imageUrl, sortOrder) => ({
            imageUrl,
            sortOrder,
          })),
        },
      },
      include: productInclude,
    });
  });

  return mapAdminProduct(product);
}

export async function deactivateAdminProduct(id: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
    include: productInclude,
  });

  return mapAdminProduct(product);
}

export async function setAdminProductActive(id: string, isActive: boolean) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive },
    include: productInclude,
  });

  return mapAdminProduct(product);
}
