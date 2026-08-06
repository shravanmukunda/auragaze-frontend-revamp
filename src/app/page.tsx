"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, RotateCcw, TrendingUp } from "lucide-react";
import TopBar from "@/components/TopBar";
import CategoryCarousel from "@/components/CategoryCarousel";
import ProductCard from "@/components/ProductCard";
import HeroPreload from "@/components/HeroPreload";
import ScrollHero from "@/components/ScrollHero";
import PageShell, { productGridClass } from "@/components/PageShell";
import { useCatalog } from "@/context/CatalogContext";
import { cn } from "@/lib/utils";

const HERO_POSTER_SRC = "/hero-poster.jpg";

export default function HomePage() {
  const { products, loading, error, refresh } = useCatalog();
  const featured = products
    .filter((product) => product.isFeatured)
    .slice(0, 4);
  const featuredProducts =
    featured.length > 0 ? featured : products.slice(0, 4);
  const newArrivals = products
    .filter((product) => product.badge === "new")
    .slice(0, 4);

  return (
    <div className="min-h-screen pb-6 lg:pb-12">
      <HeroPreload />
      <TopBar />

      <ScrollHero posterSrc={HERO_POSTER_SRC}>
        <div className="absolute inset-0 z-2 flex flex-col items-center justify-end pb-20 lg:pb-28 px-5 w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center"
          >
            <Link href="/shop">
              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 rounded-2xl text-white text-sm lg:text-base font-bold no-select btn-gradient"
              >
                Shop Now
                <ArrowRight className="size-3.5 lg:size-4.5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </ScrollHero>

      <CategoryCarousel />

      <PageShell as="section" className="pt-10 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-4 lg:mb-6"
        >
          <div>
            <p className="text-[11px] lg:text-xs font-semibold label-accent uppercase tracking-widest mb-0.5">Handpicked</p>
            <h2 className="text-xl lg:text-3xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              Featured
              <TrendingUp className="size-4.5 lg:size-6 text-rose-500" />
            </h2>
          </div>
          <Link href="/shop">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 text-xs lg:text-sm font-semibold label-accent no-select"
            >
              View all
              <ArrowRight size={12} />
            </motion.button>
          </Link>
        </motion.div>

        {error ? (
          <div
            className="rounded-3xl px-6 py-10 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {error}
            </p>
            <button
              onClick={() => void refresh()}
              className="filter-chip filter-chip-active mt-4 inline-flex items-center gap-2"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        ) : (
          <div className={productGridClass}>
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-3/4 animate-pulse rounded-xl bg-(--surface)"
                />
              ))}
            {featuredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                animateEntrance
              />
            ))}
          </div>
        )}
      </PageShell>

      {newArrivals.length > 0 && (
        <PageShell as="section" className="pt-10 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-4 lg:mb-6"
          >
            <div>
              <p className="text-[11px] lg:text-xs font-semibold label-accent uppercase tracking-widest mb-0.5">Just Dropped</p>
              <h2 className="text-xl lg:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
                New Arrivals
              </h2>
            </div>
            <Link href="/shop?filter=new">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 text-xs lg:text-sm font-semibold label-accent no-select"
              >
                View all
                <ArrowRight size={12} />
              </motion.button>
            </Link>
          </motion.div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory lg:hidden">
            {newArrivals.map((product, i) => (
              <div key={product.id} className="flex-none w-40 snap-start">
                <ProductCard product={product} index={i} animateEntrance />
              </div>
            ))}
          </div>
          <div className={cn("hidden lg:grid", productGridClass)}>
            {newArrivals.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} animateEntrance />
            ))}
          </div>
        </PageShell>
      )}

      {products[0] && (
      <PageShell as="section" className="pt-10 lg:pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden h-44 lg:h-72"
        >
          <Image
            src={products[0].image}
            alt="Brand Story"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1152px"
          />
          <div className="absolute inset-0 bg-linear-to-r from-blue-950/80 to-transparent" />
          <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-center">
            <p className="text-blue-300 text-xs lg:text-sm font-semibold uppercase tracking-widest mb-2">Our Story</p>
            <h3 className="text-white font-black text-2xl lg:text-4xl leading-tight mb-3">
              Styled for
              <br className="lg:hidden" />
              {" "}Every Moment
            </h3>
            <Link href="/about">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 text-xs lg:text-sm font-bold text-white px-4 py-2 lg:px-5 lg:py-2.5 rounded-full w-fit no-select"
                style={{ background: "rgba(30,58,138,0.55)", border: "1px solid rgba(59,130,246,0.4)" }}
              >
                Discover More
                <ArrowRight size={12} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </PageShell>
      )}
    </div>
  );
}
