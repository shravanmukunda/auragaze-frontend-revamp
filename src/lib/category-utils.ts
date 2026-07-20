import type { CarouselCategory, Category } from "@/lib/data";
import type { StorefrontProduct } from "@/types/product";

function matchesCategory(product: StorefrontProduct, slug: string) {
  return slug === "new-arrivals"
    ? product.badge === "new"
    : product.category === slug || product.subcategory === slug;
}

export function getCategoryProductCount(
  products: StorefrontProduct[],
  slug: string,
) {
  return products.filter((product) => matchesCategory(product, slug)).length;
}

export function getLiveCategories(
  categories: Category[],
  products: StorefrontProduct[],
) {
  return categories
    .map((category) => ({
      ...category,
      count: getCategoryProductCount(products, category.slug),
    }))
    .filter((category) => category.count > 0);
}

export function getLiveCarouselCategories(
  categories: CarouselCategory[],
  products: StorefrontProduct[],
) {
  return categories.filter(
    (category) => getCategoryProductCount(products, category.slug) > 0,
  );
}
