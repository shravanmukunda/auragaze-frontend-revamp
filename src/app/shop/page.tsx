"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import TopBar from "@/components/TopBar";
import ProductCard from "@/components/ProductCard";
import { products, shopFilters } from "@/lib/data";
import { cn } from "@/lib/utils";

const filters = shopFilters;
const sortOptions = ["Featured", "Price: Low to High", "Price: High to Low", "Newest", "Top Rated"];

export default function ShopPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured");
  const [showSortSheet, setShowSortSheet] = useState(false);

  const filtered =
    activeFilter === "All"
      ? products
      : activeFilter === "New Arrivals"
        ? products.filter((p) => p.badge === "new")
        : products.filter((p) => {
            const slug = activeFilter.toLowerCase().replace(/\s+/g, "-");
            return p.subcategory === slug;
          });

  const sorted = [...filtered].sort((a, b) => {
    switch (activeSort) {
      case "Price: Low to High": return a.price - b.price;
      case "Price: High to Low": return b.price - a.price;
      case "Top Rated": return b.rating - a.rating;
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen pb-28">
      <TopBar title="Shop" />

      <div className="pt-16 max-w-lg mx-auto">
        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 px-4 pt-4 scrollbar-hide snap-x">
          {filters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "filter-chip snap-start no-select",
                activeFilter === filter ? "filter-chip-active" : "filter-chip-inactive"
              )}
            >
              {filter}
            </motion.button>
          ))}
        </div>

        {/* Sort & Count Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            <span className="font-semibold" style={{ color: "var(--foreground)" }}>{sorted.length}</span> products
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSortSheet(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full filter-chip-inactive text-xs font-semibold no-select"
          >
            <SlidersHorizontal size={12} />
            {activeSort}
          </motion.button>
        </div>

        {/* Products Grid */}
        <div className="px-4 grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4"
          >
            <div className="w-16 h-16 rounded-full mb-4 flex items-center justify-center" style={{ background: "var(--surface)" }}>
              <SlidersHorizontal size={24} style={{ color: "var(--muted)" }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No products found</p>
            <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
              Try a different filter
            </p>
          </motion.div>
        )}
      </div>

      {/* Sort Bottom Sheet */}
      <AnimatePresence>
        {showSortSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSortSheet(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Sort By</h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSortSheet(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "var(--surface)" }}
                >
                  <X size={16} style={{ color: "var(--foreground)" }} />
                </motion.button>
              </div>
              <div className="flex flex-col gap-2 pb-6">
                {sortOptions.map((option) => (
                  <motion.button
                    key={option}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveSort(option);
                      setShowSortSheet(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 no-select border",
                      activeSort === option ? "text-[var(--label-accent)]" : "text-[var(--foreground)]"
                    )}
                    style={{
                      background: activeSort === option ? "var(--primary-muted)" : "var(--surface)",
                      borderColor: activeSort === option ? "var(--primary-border)" : "var(--border)",
                    }}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
