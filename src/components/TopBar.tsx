"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/context/CartContext";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
}

export default function TopBar({ title, transparent = false }: TopBarProps) {
  const { itemCount, hydrated } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showBadge = mounted && hydrated && itemCount > 0;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40"
    >
      <div
        className={transparent ? "" : "glass border-b border-[var(--glass-border)]"}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="no-select">
            <motion.div whileTap={{ scale: 0.95 }}>
              {title ? (
                <h1 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
                  {title}
                </h1>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-xl tracking-wider text-brand">
                    AURAGAZE
                  </span>
                </div>
              )}
            </motion.div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/search">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full glass flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={16} style={{ color: "var(--foreground)" }} />
              </motion.div>
            </Link>
            <Link href="/cart">
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full glass flex items-center justify-center relative"
                aria-label="Cart"
              >
                <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
                {showBadge && (
                  <span
                    suppressHydrationWarning
                    className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-blue-600 rounded-full text-[9px] text-white font-bold flex items-center justify-center"
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </motion.div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
