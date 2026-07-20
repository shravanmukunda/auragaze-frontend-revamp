"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  iconSize?: number;
  variant?: "glass" | "plain";
}

export default function WishlistButton({
  productId,
  className,
  iconSize = 16,
  variant = "glass",
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist, hydrated } = useWishlist();
  const active = hydrated && isWishlisted(productId);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleWishlist(productId);
      }}
      className={cn(
        "flex items-center justify-center no-select",
        variant === "glass" &&
          "h-10 w-10 rounded-full glass",
        className,
      )}
    >
      <Heart
        size={iconSize}
        className={active ? "fill-rose-500 text-rose-500" : ""}
        style={{ color: active ? undefined : "var(--foreground)" }}
      />
    </motion.button>
  );
}
