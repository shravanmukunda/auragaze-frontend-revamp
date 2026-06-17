"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Star,
  Share2,
  ShoppingCart,
  Package,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { getProductById, getSimilarProducts } from "@/lib/data";
import { cn, formatPrice, getDiscountPercent } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { addItem } = useCart();
  const product = getProductById(id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [isFav, setIsFav] = useState(product?.isFavorite ?? false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product?.sizes[0] ?? "M");
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
          Product not found
        </p>
        <Link href="/shop">
          <button className="px-6 py-3 rounded-2xl text-white text-sm font-semibold btn-gradient">
            Back to Shop
          </button>
        </Link>
      </div>
    );
  }

  const similarProducts = getSimilarProducts(product, 6);

  const handleAddToCart = () => {
    addItem(product.id, qty, selectedColor, selectedSize);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen pb-44">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--glass-border)]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full glass flex items-center justify-center no-select"
          >
            <ArrowLeft size={18} style={{ color: "var(--foreground)" }} />
          </motion.button>

          <span className="font-semibold text-sm truncate mx-3" style={{ color: "var(--foreground)" }}>
            {product.name}
          </span>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFav(!isFav)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center no-select"
            >
              <Heart
                size={16}
                className={isFav ? "fill-rose-500 text-rose-500" : ""}
                style={{ color: isFav ? undefined : "var(--foreground)" }}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full glass flex items-center justify-center no-select"
            >
              <Share2 size={16} style={{ color: "var(--foreground)" }} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Hero Image */}
        <div className="relative h-80 pt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
                priority
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-[72px] left-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white uppercase"
                style={{
                  background: product.badge === "sale" ? "#ef4444" : product.badge === "hot" ? "#f97316" : product.badge === "limited" ? "#f59e0b" : "#2563eb",
                }}
              >
                {product.badge === "sale" && product.originalPrice
                  ? `${getDiscountPercent(product.price, product.originalPrice)}% Off`
                  : product.badge}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {product.images.length > 1 && (
          <div className="flex gap-2 px-4 -mt-2 mb-2">
            {product.images.map((img, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200",
                  selectedImage === i ? "border-blue-500" : "border-transparent opacity-60"
                )}
              >
                <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="64px" />
              </motion.button>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="px-4 pt-2">
          {/* Brand & Name */}
          <p className="text-[11px] font-semibold label-accent uppercase tracking-widest mb-1">
            {product.brand}
          </p>
          <h1 className="text-2xl font-black mb-2 leading-tight" style={{ color: "var(--foreground)" }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {product.rating}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              ({product.reviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl font-black" style={{ color: "var(--foreground)" }}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg line-through" style={{ color: "var(--muted)" }}>
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-rose-500">
                  Save {formatPrice(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>

          {/* Color Options */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
              Color — <span style={{ color: "var(--foreground)" }}>Option {selectedColor + 1}</span>
            </p>
            <div className="flex gap-3">
              {product.colors.map((color, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setSelectedColor(i)}
                  className={cn(
                    "w-9 h-9 rounded-full border-2 transition-all duration-200",
                    selectedColor === i ? "border-blue-500 scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Size Options */}
          <div className="mb-5">
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
              Size — <span style={{ color: "var(--foreground)" }}>{selectedSize}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <motion.button
                  key={size}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "min-w-10 px-3 h-9 rounded-xl text-xs font-bold transition-all duration-200 no-select",
                    selectedSize === size ? "filter-chip-active" : "filter-chip-inactive"
                  )}
                >
                  {size}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quantity & Stock */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-1">
              <p className="text-xs mr-3" style={{ color: "var(--muted)" }}>Qty</p>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center no-select"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span style={{ color: "var(--foreground)" }} className="text-lg font-bold leading-none">−</span>
              </motion.button>
              <span className="w-8 text-center font-bold text-sm" style={{ color: "var(--foreground)" }}>
                {qty}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center no-select"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span style={{ color: "var(--foreground)" }} className="text-lg font-bold leading-none">+</span>
              </motion.button>
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                product.stock <= 5 ? "text-orange-600 bg-orange-100 dark:bg-orange-950" : "text-emerald-600 bg-emerald-100 dark:bg-emerald-950"
              )}
            >
              {product.stock <= 5 ? `Only ${product.stock} left!` : "In Stock"}
            </span>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {product.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-none" style={{ background: "var(--primary-muted)" }}>
                  <Check size={10} className="label-accent" />
                </div>
                <span className="text-[11px] font-medium leading-tight" style={{ color: "var(--foreground)" }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div
            className="mb-6 rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="w-full flex items-center justify-between px-4 py-3.5 no-select"
            >
              <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                Description
              </span>
              {descExpanded ? (
                <ChevronUp size={16} style={{ color: "var(--muted)" }} />
              ) : (
                <ChevronDown size={16} style={{ color: "var(--muted)" }} />
              )}
            </button>
            <AnimatePresence>
              {descExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {product.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!descExpanded && (
              <p className="px-4 pb-4 text-sm leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                {product.description}
              </p>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {[
              { icon: Package, label: "Free Shipping", sub: `Orders ${formatPrice(FREE_SHIPPING_THRESHOLD)}+` },
              { icon: Zap, label: "Fast Delivery", sub: "2-3 days" },
              { icon: Shield, label: "1 Year Warranty", sub: "Guaranteed" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 p-3 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Icon size={18} className="label-accent" />
                <p className="text-[10px] font-bold leading-tight" style={{ color: "var(--foreground)" }}>{label}</p>
                <p className="text-[9px]" style={{ color: "var(--muted)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="px-4 mb-6">
            <div className="mb-4">
              <p className="text-[11px] font-semibold label-accent uppercase tracking-widest mb-0.5">
                You May Also Like
              </p>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                Similar Products
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
              {similarProducts.map((p, i) => (
                <div key={p.id} className="flex-none w-44 snap-start">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div
        className="fixed bottom-[5.75rem] left-0 right-0 z-[45] px-4"
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="flex-none w-14 h-14 rounded-2xl flex items-center justify-center no-select"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <Heart
              size={20}
              className={isFav ? "fill-rose-500 text-rose-500" : ""}
              style={{ color: isFav ? undefined : "var(--foreground)" }}
              onClick={() => setIsFav(!isFav)}
            />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold no-select overflow-hidden relative btn-gradient"
            style={{
              background: addedToCart
                ? "linear-gradient(135deg, #10b981, #059669)"
                : undefined,
              boxShadow: addedToCart
                ? "0 4px 20px rgba(16,185,129,0.4)"
                : undefined,
              transition: "background 0.4s ease, box-shadow 0.4s ease",
            }}
          >
            <AnimatePresence mode="wait">
              {addedToCart ? (
                <motion.div
                  key="added"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <Check size={18} />
                  Added to Cart!
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart · {formatPrice(product.price * qty)}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
