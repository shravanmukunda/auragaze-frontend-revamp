"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface WishlistContextValue {
  productIds: string[];
  count: number;
  hydrated: boolean;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (status !== "authenticated") {
      setProductIds([]);
      setHydrated(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/wishlist");
      const data = (await response.json()) as {
        productIds?: string[];
        error?: string;
      };
      if (!response.ok) {
        setProductIds([]);
        return;
      }
      setProductIds(data.productIds ?? []);
    } catch {
      setProductIds([]);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [status]);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  const isWishlisted = useCallback(
    (productId: string) => productIds.includes(productId),
    [productIds],
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (status !== "authenticated") {
        toast.error("Sign in to save items to your wishlist.");
        return false;
      }

      const wishlisted = productIds.includes(productId);

      try {
        const response = await fetch(
          wishlisted
            ? `/api/wishlist?productId=${encodeURIComponent(productId)}`
            : "/api/wishlist",
          {
            method: wishlisted ? "DELETE" : "POST",
            headers: wishlisted ? undefined : { "Content-Type": "application/json" },
            body: wishlisted ? undefined : JSON.stringify({ productId }),
          },
        );

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "Unable to update wishlist.");
          return wishlisted;
        }

        setProductIds((current) =>
          wishlisted
            ? current.filter((id) => id !== productId)
            : [productId, ...current],
        );

        toast.success(wishlisted ? "Removed from wishlist." : "Saved to wishlist.");
        return !wishlisted;
      } catch {
        toast.error("Unable to update wishlist.");
        return wishlisted;
      }
    },
    [productIds, status],
  );

  const value = useMemo(
    () => ({
      productIds,
      count: productIds.length,
      hydrated,
      loading,
      isWishlisted,
      toggleWishlist,
      refresh: loadWishlist,
    }),
    [hydrated, isWishlisted, loadWishlist, loading, productIds, toggleWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
