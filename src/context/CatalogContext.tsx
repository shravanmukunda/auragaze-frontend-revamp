"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { StorefrontProduct } from "@/types/product";

interface CatalogContextValue {
  products: StorefrontProduct[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProduct: (idOrSlug: string) => StorefrontProduct | undefined;
  getSimilarProducts: (
    product: StorefrontProduct,
    limit?: number,
  ) => StorefrontProduct[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    await Promise.resolve();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products?sort=featured", { signal });
      if (!response.ok) throw new Error("Product request failed");
      const result = (await response.json()) as StorefrontProduct[];
      setProducts(result);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") {
        return;
      }
      setError("Unable to load the catalog. Please try again.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadProducts(controller.signal);
      }
    });
    return () => {
      controller.abort();
    };
  }, [loadProducts]);

  const getProduct = useCallback(
    (idOrSlug: string) =>
      products.find(
        (product) => product.id === idOrSlug || product.slug === idOrSlug,
      ),
    [products],
  );

  const getSimilarProducts = useCallback(
    (product: StorefrontProduct, limit = 6) =>
      products
        .filter(
          (candidate) =>
            candidate.id !== product.id &&
            (candidate.category === product.category ||
              candidate.subcategory === product.subcategory),
        )
        .slice(0, limit),
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      refresh: () => loadProducts(),
      getProduct,
      getSimilarProducts,
    }),
    [error, getProduct, getSimilarProducts, loadProducts, loading, products],
  );

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
