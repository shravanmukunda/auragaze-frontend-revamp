"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import { useCart } from "@/context/CartContext";
import { getProductById, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem, hydrated } = useCart();

  const hasItems = items.length > 0;
  const shipping = !hasItems || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  return (
    <div className={`min-h-screen ${hasItems ? "pb-52" : "pb-28"}`}>
      <TopBar title="Cart" />

      <div className="pt-16 max-w-lg mx-auto px-4">
        {!hydrated ? (
          <div className="py-20 text-center text-sm" style={{ color: "var(--muted)" }}>
            Loading cart...
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <ShoppingBag size={32} className="label-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
              Your cart is empty
            </h2>
            <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--muted)" }}>
              Discover oversized tees and add pieces to your cart.
            </p>
            <Link href="/shop">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-2xl text-sm font-bold btn-gradient no-select"
              >
                Start Shopping
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <>
            <p className="text-xs pt-4 pb-3" style={{ color: "var(--muted)" }}>
              <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                {itemCount}
              </span>{" "}
              {itemCount === 1 ? "item" : "items"}
            </p>

            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;

                  return (
                    <motion.div
                      key={`${item.productId}-${item.colorIndex}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                      className="flex gap-3 p-3 rounded-2xl surface-card"
                    >
                      <Link
                        href={`/product/${product.id}`}
                        className="relative w-20 h-24 flex-none overflow-hidden rounded-xl"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </Link>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <Link href={`/product/${product.id}`}>
                            <h3
                              className="font-bold text-sm leading-tight line-clamp-2 mb-1"
                              style={{ color: "var(--foreground)" }}
                            >
                              {product.name}
                            </h3>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="price-pill">{formatPrice(product.price)}</span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                            >
                              Size {item.size}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 gap-2">
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                updateQuantity(item.productId, item.colorIndex, item.size, item.quantity - 1)
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center no-select"
                              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} style={{ color: "var(--foreground)" }} />
                            </motion.button>
                            <span
                              className="w-6 text-center text-sm font-bold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() =>
                                updateQuantity(item.productId, item.colorIndex, item.size, item.quantity + 1)
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center no-select"
                              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} style={{ color: "var(--foreground)" }} />
                            </motion.button>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                              {formatPrice(product.price * item.quantity)}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeItem(item.productId, item.colorIndex, item.size)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center no-select"
                              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                              aria-label="Remove item"
                            >
                              <Trash2 size={14} className="text-rose-500" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 p-4 rounded-2xl surface-card"
            >
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--foreground)" }}>
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="text-[var(--foreground)]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span style={{ color: shipping === 0 ? "#10b981" : "var(--foreground)" }}>
                    {shipping === 0 ? "Free" : formatPrice(shipping)}
                  </span>
                </div>
                {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
                  <p className="text-[11px] label-accent">
                    Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping
                  </p>
                )}
                <div
                  className="flex justify-between pt-2 mt-2 font-bold"
                  style={{ borderTop: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {hasItems && (
        <div
          className="fixed bottom-[5.75rem] left-0 right-0 z-[45] px-4"
        >
          <div className="max-w-lg mx-auto">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white font-bold btn-gradient no-select shadow-lg"
            >
              Checkout · {formatPrice(total)}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
