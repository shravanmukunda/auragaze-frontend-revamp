"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCatalog } from "@/context/CatalogContext";
import type { CartLineInput, EnrichedCartLine } from "@/types/cart";
import type { StorefrontProduct } from "@/types/product";

interface CartContextValue {
  items: EnrichedCartLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  syncing: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  clearCart: (options?: { silent?: boolean }) => Promise<void>;
}

const STORAGE_KEY = "auragaze-cart";

const CartContext = createContext<CartContextValue | null>(null);

interface LegacyCartLine {
  productId: string;
  quantity: number;
  colorIndex: number;
  size: string;
}

function buildEnrichedLine(
  product: StorefrontProduct,
  variant: StorefrontProduct["variants"][number],
  quantity: number,
): EnrichedCartLine {
  return {
    id: variant.id,
    variantId: variant.id,
    quantity,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    brand: product.brand,
    image: product.image,
    price: product.price,
    size: variant.size,
    color: variant.color,
    stock: variant.stock,
  };
}

function findProductForVariant(
  products: StorefrontProduct[],
  variantId: string,
) {
  for (const product of products) {
    const variant = product.variants.find(
      (candidate) => candidate.id === variantId,
    );
    if (variant) {
      return { product, variant };
    }
  }
  return null;
}

function legacyLineToVariantId(
  entry: LegacyCartLine,
  products: StorefrontProduct[],
) {
  const product = products.find(
    (candidate) => candidate.id === entry.productId,
  );
  if (!product) return null;

  const color = product.colors[entry.colorIndex] ?? product.colors[0];
  const variant = product.variants.find(
    (candidate) =>
      candidate.color === color && candidate.size === entry.size,
  );
  return variant?.id ?? null;
}

function sanitizeGuestLines(
  raw: unknown,
  products: StorefrontProduct[],
): CartLineInput[] {
  if (!Array.isArray(raw)) return [];

  const merged = new Map<string, number>();

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Partial<CartLineInput & LegacyCartLine>;
    let variantId = record.variantId;
    const quantity = Number(record.quantity);

    if (
      !variantId &&
      typeof record.productId === "string" &&
      typeof record.size === "string"
    ) {
      variantId =
        legacyLineToVariantId(
          {
            productId: record.productId,
            quantity: Number.isFinite(quantity) ? quantity : 1,
            colorIndex: Number(record.colorIndex ?? 0),
            size: record.size,
          },
          products,
        ) ?? undefined;
    }

    if (!variantId || !Number.isFinite(quantity) || quantity <= 0) continue;

    merged.set(
      variantId,
      (merged.get(variantId) ?? 0) + Math.floor(quantity),
    );
  }

  return [...merged.entries()].map(([variantId, qty]) => ({
    variantId,
    quantity: qty,
  }));
}

function enrichGuestLines(
  lines: CartLineInput[],
  products: StorefrontProduct[],
): EnrichedCartLine[] {
  const enriched: EnrichedCartLine[] = [];

  for (const line of lines) {
    const match = findProductForVariant(products, line.variantId);
    if (!match || match.variant.stock <= 0) continue;

    const quantity = Math.min(line.quantity, match.variant.stock);
    if (quantity <= 0) continue;

    enriched.push(
      buildEnrichedLine(match.product, match.variant, quantity),
    );
  }

  return enriched;
}

function loadGuestLines(products: StorefrontProduct[]): CartLineInput[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeGuestLines(JSON.parse(raw), products);
  } catch {
    return [];
  }
}

async function readCartResponse(res: Response) {
  if (!res.ok) {
    try {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Cart request failed");
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Cart request failed");
    }
  }
  return res.json() as Promise<{
    items: EnrichedCartLine[];
    itemCount: number;
    subtotal: number;
  }>;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { products, loading: catalogLoading } = useCatalog();
  const [items, setItems] = useState<EnrichedCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const authSyncedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      if (authSyncedRef.current) return;

      const rawGuest = localStorage.getItem(STORAGE_KEY);
      const hasGuestCart = !!rawGuest && rawGuest !== "[]";
      if (hasGuestCart && catalogLoading) return;

      let active = true;
      queueMicrotask(() => {
        void (async () => {
          setSyncing(true);
          try {
            const guestLines = hasGuestCart
              ? loadGuestLines(products)
              : [];
            const res =
              guestLines.length > 0
                ? await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ merge: guestLines }),
                  })
                : await fetch("/api/cart");

            const cart = await readCartResponse(res);
            if (!active) return;

            setItems(cart.items);
            localStorage.removeItem(STORAGE_KEY);
            authSyncedRef.current = true;
          } catch {
            if (active) setItems([]);
          } finally {
            if (active) {
              setHydrated(true);
              setSyncing(false);
            }
          }
        })();
      });

      return () => {
        active = false;
      };
    }

    authSyncedRef.current = false;

    if (catalogLoading) return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const guestLines = loadGuestLines(products);
      setItems(enrichGuestLines(guestLines, products));
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [status, catalogLoading, products]);

  useEffect(() => {
    if (status === "authenticated" || !hydrated) return;

    const lines = items.map(({ variantId, quantity }) => ({
      variantId,
      quantity,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [items, hydrated, status]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      if (status === "authenticated") {
        setSyncing(true);
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, quantity }),
          });
          const cart = await readCartResponse(res);
          setItems(cart.items);
          toast.success(quantity > 1 ? `${quantity} items added to cart.` : "Added to cart.");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to update cart.",
          );
        } finally {
          setSyncing(false);
        }
        return;
      }

      const match = findProductForVariant(products, variantId);
      if (!match) {
        toast.error("This variant is no longer available.");
        return;
      }
      if (match.variant.stock <= 0) {
        toast.error("This variant is out of stock.");
        return;
      }

      let added = false;
      let cappedAtStock = false;
      setItems((prev) => {
        const existing = prev.find((item) => item.variantId === variantId);
        const combined = (existing?.quantity ?? 0) + quantity;
        const capped = Math.min(match.variant.stock, combined);
        added = !existing;
        cappedAtStock = capped < combined;
        const enriched = buildEnrichedLine(
          match.product,
          match.variant,
          capped,
        );

        if (existing) {
          return prev.map((item) =>
            item.variantId === variantId ? enriched : item,
          );
        }

        return [...prev, enriched];
      });
      setHydrated(true);
      if (cappedAtStock) {
        toast.error("Only the available stock was added to your cart.");
      } else if (added) {
        toast.success("Added to cart.");
      } else {
        toast.success("Cart updated.");
      }
    },
    [products, status],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (status === "authenticated") {
        setSyncing(true);
        try {
          const res = await fetch(
            `/api/cart?variantId=${encodeURIComponent(variantId)}`,
            { method: "DELETE" },
          );
          const cart = await readCartResponse(res);
          setItems(cart.items);
          toast.success("Removed from cart.");
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to remove item.",
          );
        } finally {
          setSyncing(false);
        }
        return;
      }

      setItems((prev) =>
        prev.filter((item) => item.variantId !== variantId),
      );
      toast.success("Removed from cart.");
    },
    [status],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(variantId);
        return;
      }

      if (status === "authenticated") {
        setSyncing(true);
        try {
          const res = await fetch("/api/cart", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId, quantity }),
          });
          const cart = await readCartResponse(res);
          setItems(cart.items);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to update quantity.",
          );
        } finally {
          setSyncing(false);
        }
        return;
      }

      const match = findProductForVariant(products, variantId);
      if (!match) {
        toast.error("This variant is no longer available.");
        return;
      }

      const capped = Math.min(match.variant.stock, quantity);
      if (capped <= 0) {
        await removeItem(variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.variantId === variantId
            ? buildEnrichedLine(match.product, match.variant, capped)
            : item,
        ),
      );
      if (capped < quantity) {
        toast.error("Quantity was adjusted to match available stock.");
      }
    },
    [products, removeItem, status],
  );

  const clearCart = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (status === "authenticated") {
      setSyncing(true);
      try {
        const res = await fetch("/api/cart?clear=true", { method: "DELETE" });
        const cart = await readCartResponse(res);
        setItems(cart.items);
        if (!silent) {
          toast.success("Cart cleared.");
        }
      } catch (error) {
        if (!silent) {
          toast.error(
            error instanceof Error ? error.message : "Unable to clear cart.",
          );
        }
      } finally {
        setSyncing(false);
      }
      return;
    }

    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
    if (!silent) {
      toast.success("Cart cleared.");
    }
  }, [status]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      hydrated,
      syncing,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      hydrated,
      syncing,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
