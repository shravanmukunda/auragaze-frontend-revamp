import { prisma } from "@/lib/prisma";
import { mapProduct, productRelations } from "@/lib/product-mapper";
import { Prisma, ProductBadge } from "@prisma/client";
import { NextResponse } from "next/server";

const SORT_OPTIONS = {
  featured: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
  newest: [{ createdAt: "desc" }],
  rating: [{ rating: "desc" }, { reviewCount: "desc" }],
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput[]>;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();
    const subcategory = searchParams.get("subcategory")?.trim();
    const query = searchParams.get("q")?.trim();
    const badgeParam = searchParams.get("badge")?.trim().toUpperCase();
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") ?? "featured";
    const limitParam = searchParams.get("limit");
    const requestedLimit = limitParam === null ? Number.NaN : Number(limitParam);
    const limit =
      limitParam !== null && Number.isFinite(requestedLimit)
        ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
        : undefined;
    const badge =
      badgeParam && badgeParam in ProductBadge
        ? ProductBadge[badgeParam as keyof typeof ProductBadge]
        : undefined;
    const orderBy =
      sort in SORT_OPTIONS
        ? SORT_OPTIONS[sort as keyof typeof SORT_OPTIONS]
        : SORT_OPTIONS.featured;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(badge && { badge }),
      ...(featured === "true" && { isFeatured: true }),
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { subcategory: { contains: query, mode: "insensitive" } },
        ],
      }),
    };

    const products = await prisma.product.findMany({
      where,
      include: productRelations,
      orderBy,
      take: limit,
    });

    return NextResponse.json(products.map(mapProduct));
  } catch (error) {
    console.error("Failed to load products", error);
    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 500 },
    );
  }
}
