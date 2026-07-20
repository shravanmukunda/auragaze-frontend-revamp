"use client";

import Link from "next/link";
import { Heart, LoaderCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/context/CatalogContext";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistPage() {
  const { productIds, hydrated } = useWishlist();
  const { getProduct, loading } = useCatalog();
  const products = productIds
    .map((productId) => getProduct(productId))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin label-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Wishlist" />

      <div className="mx-auto max-w-lg px-4 pt-16">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <Heart size={28} className="mx-auto mb-3 text-muted" />
            <p className="font-semibold">No saved items yet</p>
            <p className="mt-1 text-sm text-muted">
              Tap the heart on any product to save it here.
            </p>
            <Link
              href="/shop"
              className="btn-gradient mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
