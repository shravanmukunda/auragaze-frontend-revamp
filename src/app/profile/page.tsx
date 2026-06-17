"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  ShoppingBag,
} from "lucide-react";
import TopBar from "@/components/TopBar";

const menuItems = [
  { icon: Package, label: "My Orders", sub: "Track your orders", href: "#", badge: "3" },
  { icon: Heart, label: "Wishlist", sub: "Saved items", href: "#", badge: "7" },
  { icon: MapPin, label: "Addresses", sub: "Manage delivery addresses", href: "#" },
  { icon: CreditCard, label: "Payment Methods", sub: "Cards & wallets", href: "#" },
  { icon: Bell, label: "Notifications", sub: "Alerts & updates", href: "#" },
  { icon: HelpCircle, label: "Help & Support", sub: "FAQs and contact", href: "#" },
];

const stats = [
  { icon: ShoppingBag, label: "Orders", value: "12" },
  { icon: Heart, label: "Wishlist", value: "7" },
  { icon: Star, label: "Reviews", value: "5" },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen pb-28">
      <TopBar title="Profile" />

      <div className="pt-16 max-w-lg mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 pt-6 pb-4"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden" style={{ border: "2px solid var(--primary-border)" }}>
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
                  alt="Profile"
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center" style={{ border: "2px solid var(--background)" }}>
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
            </div>
            <div>
              <h2 className="font-black text-xl" style={{ color: "var(--foreground)" }}>
                Alex Jordan
              </h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                alex@example.com
              </p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold label-accent" style={{ background: "var(--primary-muted)" }}>
                ✦ Premium Member
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {stats.map(({ icon: Icon, label, value }) => (
              <motion.div
                key={label}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <Icon size={18} className="label-accent" />
                <p className="font-black text-lg leading-none" style={{ color: "var(--foreground)" }}>
                  {value}
                </p>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Promo Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-4 mb-5 rounded-2xl overflow-hidden relative h-24"
          style={{
            background: "linear-gradient(135deg, rgba(30,58,138,0.85) 0%, rgba(37,99,235,0.85) 100%)",
          }}
        >
          <div className="absolute inset-0 p-4 flex flex-col justify-center">
            <p className="text-white/80 text-xs font-semibold">Exclusive for you</p>
            <p className="text-white font-black text-lg">Get 20% off your next order</p>
            <p className="text-white/70 text-xs">Use code: <strong>AURA20</strong></p>
          </div>
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-8xl font-black text-white pointer-events-none select-none"
          >
            AG
          </div>
        </motion.div>

        {/* Menu Items */}
        <div className="px-4 flex flex-col gap-2 mb-4">
          {menuItems.map(({ icon: Icon, label, sub, href, badge }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            >
              <Link href={href}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none" style={{ background: "var(--primary-muted)" }}>
                    <Icon size={18} className="label-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      {label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {sub}
                    </p>
                  </div>
                  {badge && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-none">
                      {badge}
                    </span>
                  )}
                  <ChevronRight size={16} style={{ color: "var(--muted)" }} className="flex-none" />
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Sign Out */}
        <div className="px-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-rose-500 font-semibold text-sm no-select"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <LogOut size={16} />
            Sign Out
          </motion.button>
        </div>
      </div>
    </div>
  );
}
