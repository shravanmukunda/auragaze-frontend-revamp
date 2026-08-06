"use client";

import { motion } from "framer-motion";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, RotateCcw } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import PageShell, { pageShellClass, productGridClass } from "@/components/PageShell";
import { categories } from "@/lib/data";
import { useCatalog } from "@/context/CatalogContext";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { products, loading, error, refresh } = useCatalog();
  const category = categories.find((c) => c.slug === slug);
  const categoryProducts = products.filter((product) =>
    slug === "new-arrivals"
      ? product.badge === "new"
      : product.category === slug || product.subcategory === slug,
  );

  return (
    <div className="min-h-screen pb-6 lg:pb-12">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--glass-border)]">
        <div className={cn(pageShellClass, "h-14 flex items-center gap-3")}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass flex items-center justify-center no-select flex-none"
          >
            <ArrowLeft size={18} style={{ color: "var(--foreground)" }} />
          </motion.button>
          <span className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
            {category?.name ?? slug}
          </span>
        </div>
      </div>
      <div className="hidden lg:block">
        <TopBar />
      </div>

      <PageShell className="pt-20 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 lg:mb-8"
        >
          <button
            type="button"
            onClick={() => router.back()}
            className="hidden lg:inline-flex items-center gap-2 mb-4 text-sm font-semibold text-muted hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="hidden lg:block text-4xl font-black mb-2" style={{ color: "var(--foreground)" }}>
            {category?.name ?? slug}
          </h1>
          <p className="text-sm lg:text-base" style={{ color: "var(--muted)" }}>
            {categoryProducts.length} products
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Loading products…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-sm text-muted">{error}</p>
            <button
              onClick={() => void refresh()}
              className="filter-chip filter-chip-active inline-flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        ) : categoryProducts.length > 0 ? (
          <div className={productGridClass}>
            {categoryProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              No products yet
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Check back soon!
            </p>
          </div>
        )}
      </PageShell>
    </div>
  );
}
