"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ShoppingBag, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: User },
];

export default function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
        className="glass rounded-2xl px-2 py-2 flex items-center justify-around"
        style={{ boxShadow: "var(--shadow-nav)" }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-4 rounded-xl no-select"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative flex flex-col items-center gap-0.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 -inset-y-1 -inset-x-3 rounded-xl bg-[var(--primary-muted-strong)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "text-[var(--label-accent)]" : "text-[var(--nav-inactive)]"}
                  />
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200 relative",
                    isActive ? "text-[var(--label-accent)]" : "text-[var(--nav-inactive)]"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
