import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/mail";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/categories",
    "/about",
    "/search",
    "/privacy",
    "/terms",
    "/refund",
  ].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/shop" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.5,
  }));

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${origin}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
