"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getProductById } from "@/lib/data";

export interface CartLine {
  productId: string;
  quantity: number;
  colorIndex: number;
  size: string;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (productId: string, quantity?: number, colorIndex?: number, size?: string) => void;
  removeItem: (productId: string, colorIndex: number, size: string) => void;
  updateQuantity: (productId: string, colorIndex: number, size: string, quantity: number) => void;
  clearCart: () => void;
}

const STORAGE_KEY = "auragaze-cart";

const CartContext = createContext<CartContextValue | null>(null);

function matchesLine(
  item: CartLine,
  productId: string,
  colorIndex: number,
  size: string
) {
  return item.productId === productId && item.colorIndex === colorIndex && item.size === size;
}

function sanitizeCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Partial<CartLine>;
      if (!item.productId || typeof item.productId !== "string") return null;

      const product = getProductById(item.productId);
      if (!product) return null;

      const quantity = Number(item.quantity);
      const colorIndex = Number(item.colorIndex ?? 0);
      const size =
        typeof item.size === "string" && product.sizes.includes(item.size)
          ? item.size
          : product.sizes[0];

      return {
        productId: item.productId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
        colorIndex: Number.isFinite(colorIndex) && colorIndex >= 0 ? Math.floor(colorIndex) : 0,
        size,
      };
    })
    .filter((item): item is CartLine => item !== null);
}

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeCart(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (productId: string, quantity = 1, colorIndex = 0, size?: string) => {
      const product = getProductById(productId);
      if (!product) return;

      const resolvedSize = size && product.sizes.includes(size) ? size : product.sizes[0];

      setItems((prev) => {
        const existing = prev.find((item) =>
          matchesLine(item, productId, colorIndex, resolvedSize)
        );

        if (existing) {
          return prev.map((item) =>
            matchesLine(item, productId, colorIndex, resolvedSize)
              ? {
                  ...item,
                  quantity: Math.min(product.stock, item.quantity + quantity),
                }
              : item
          );
        }

        return [
          ...prev,
          {
            productId,
            quantity: Math.min(product.stock, quantity),
            colorIndex,
            size: resolvedSize,
          },
        ];
      });
      setHydrated(true);
    },
    []
  );

  const removeItem = useCallback((productId: string, colorIndex: number, size: string) => {
    setItems((prev) =>
      prev.filter((item) => !matchesLine(item, productId, colorIndex, size))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, colorIndex: number, size: string, quantity: number) => {
      const product = getProductById(productId);
      if (!product) return;

      if (quantity <= 0) {
        removeItem(productId, colorIndex, size);
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          matchesLine(item, productId, colorIndex, size)
            ? { ...item, quantity: Math.min(product.stock, quantity) }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = getProductById(item.productId);
        return sum + (product?.price ?? 0) * item.quantity;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, itemCount, subtotal, hydrated, addItem, removeItem, updateQuantity, clearCart]
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
