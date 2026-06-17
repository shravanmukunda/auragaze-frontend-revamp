"use client";

import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import CategoryCard from "@/components/CategoryCard";
import { categories, products } from "@/lib/data";

export default function CategoriesPage() {
  return (
    <div className="min-h-screen pb-28">
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
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} />
          ))}
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {[
            { label: "Products", value: `${products.length}+` },
            { label: "Styles", value: "Oversized" },
            { label: "Categories", value: String(categories.length) },
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
