"use client";

import Link from "next/link";
import { pageShellClass } from "./PageShell";
import { cn } from "@/lib/utils";

const shopLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/wishlist", label: "Wishlist" },
];

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/refund", label: "Refund" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function Footer() {
  return (
    <footer className="mt-8 pt-5 pb-28 lg:mt-16 lg:pt-12 lg:pb-12 border-t border-[var(--border)]">
      <div className={cn(pageShellClass, "flex flex-col gap-2.5 lg:gap-10")}>
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <div className="min-w-0">
            <p className="font-heading font-black text-sm tracking-[0.18em] leading-none" style={{ color: "var(--foreground)" }}>
              AURAGAZE
            </p>
            <p className="text-[10px] mt-1 truncate" style={{ color: "var(--muted)" }}>
              Dress With Intention
            </p>
          </div>
          <div className="flex items-center gap-3">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 text-[10px] font-semibold label-accent uppercase tracking-widest no-select"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-4 gap-10">
          <div className="col-span-2">
            <p className="font-heading font-black text-2xl tracking-[0.18em] leading-none" style={{ color: "var(--foreground)" }}>
              AURAGAZE
            </p>
            <p className="mt-3 text-sm max-w-sm" style={{ color: "var(--muted)" }}>
              Dress With Intention. Premium oversized tees and streetwear, curated for every moment.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 label-accent">Shop</p>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium hover:text-[var(--label-accent)] transition-colors"
                    style={{ color: "var(--muted-strong)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 label-accent">Legal</p>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium hover:text-[var(--label-accent)] transition-colors"
                    style={{ color: "var(--muted-strong)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[10px] lg:text-xs leading-relaxed lg:pt-2 lg:border-t lg:border-[var(--border)]" style={{ color: "var(--muted)" }}>
          &copy; {new Date().getFullYear()} AURAGAZE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
