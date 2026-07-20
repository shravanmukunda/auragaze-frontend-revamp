"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/lib/data";
import { getLiveCategories } from "@/lib/category-utils";
import { useCatalog } from "@/context/CatalogContext";

export default function CategoriesPage() {
  const { products, loading } = useCatalog();
  const liveCategories = getLiveCategories(categories, products);

  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Categories" />

      <div className="pt-20 max-w-lg mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <p className="text-[11px] font-semibold label-accent uppercase tracking-widest mb-1">
            Browse by
          </p>
          <h1 className="text-3xl font-black leading-tight" style={{ color: "var(--foreground)" }}>
            All
            <br />
            <span className="text-brand">
              Categories
            </span>
          </h1>
        </motion.div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-3/4 animate-pulse rounded-3xl bg-(--surface)"
              />
            ))}
          </div>
        ) : liveCategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {liveCategories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl px-6 py-12 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
              No categories to show yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Add products in admin to bring categories live.
            </p>
          </div>
        )}

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {[
            { label: "Products", value: loading ? "…" : String(products.length) },
            { label: "Styles", value: "Oversized" },
            { label: "Categories", value: String(liveCategories.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p
                className="font-black text-2xl"
                style={{
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
