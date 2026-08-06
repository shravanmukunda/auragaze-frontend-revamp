"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { pageShellClass } from "./PageShell";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
}

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/profile", label: "Profile" },
];

export default function TopBar({ title, transparent = false }: TopBarProps) {
  const { itemCount, hydrated } = useCart();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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
        <div className={cn(pageShellClass, "h-14 lg:h-16 flex items-center justify-between gap-3 lg:gap-8")}>
          <div className="flex items-center gap-8 min-w-0">
            <Link href="/" className="no-select min-w-0 shrink-0" aria-label="AURAGAZE home">
              <motion.div whileTap={{ scale: 0.95 }} className="flex items-center">
                {title ? (
                  <>
                    <h1
                      className="font-bold text-base lg:hidden"
                      style={{ color: "var(--foreground)" }}
                    >
                      {title}
                    </h1>
                    <div
                      role="img"
                      aria-label="AURAGAZE"
                      className="hidden lg:block h-10 w-[15rem] bg-[var(--foreground)]"
                      style={{
                        WebkitMaskImage: "url(/logo/logo-wordmark.png)",
                        maskImage: "url(/logo/logo-wordmark.png)",
                        WebkitMaskSize: "contain",
                        maskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "left center",
                        maskPosition: "left center",
                      }}
                    />
                  </>
                ) : (
                  <div
                    role="img"
                    aria-label="AURAGAZE"
                    className="h-9 w-[13rem] sm:h-10 sm:w-[15rem] bg-[var(--foreground)]"
                    style={{
                      WebkitMaskImage: "url(/logo/logo-wordmark.png)",
                      maskImage: "url(/logo/logo-wordmark.png)",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "left center",
                      maskPosition: "left center",
                    }}
                  />
                )}
              </motion.div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-2 rounded-xl text-sm font-semibold transition-colors no-select",
                      isActive
                        ? "text-[var(--label-accent)] bg-[var(--primary-muted-strong)]"
                        : "text-[var(--muted-strong)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/search">
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                className="w-10 h-10 rounded-full glass flex items-center justify-center"
                aria-label="Search"
              >
                <Search size={16} style={{ color: "var(--foreground)" }} />
              </motion.div>
            </Link>
            <Link href="/cart">
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.04 }}
                className="w-10 h-10 rounded-full glass flex items-center justify-center relative"
                aria-label="Cart"
              >
                <ShoppingCart size={16} style={{ color: "var(--foreground)" }} />
                {showBadge && (
                  <span
                    suppressHydrationWarning
                    className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-blue-600 rounded-full text-[9px] lg:text-[10px] text-white font-bold flex items-center justify-center"
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
