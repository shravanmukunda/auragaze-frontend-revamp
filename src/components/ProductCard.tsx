"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3 }}
      className="group"
    >
      <Link href={`/product/${product.id}`} className="block">
        {/* Photo card */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        </div>

        {/* Name & price below the image */}
        <div className="mt-2.5 space-y-1.5">
          <span className="price-pill">{formatPrice(product.price)}</span>
          <h3
            className="font-bold text-sm leading-snug line-clamp-2"
            style={{ color: "var(--foreground)" }}
          >
            {product.name}
          </h3>
        </div>
      </Link>
    </motion.div>
  );
}
