"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import ProductCard from "@/components/ProductCard";
import type { StorefrontProduct } from "@/types/product";

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/products?q=${encodeURIComponent(trimmed)}&sort=featured`,
          );
          const data = (await response.json()) as StorefrontProduct[];
          setResults(Array.isArray(data) ? data : []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
          setSearched(true);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Search" />

      <div className="mx-auto max-w-lg px-4 pt-16">
        <label className="relative mb-5 block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tees, brands, categories"
            className="w-full rounded-xl border border-(--border) bg-background py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500"
            autoFocus
          />
        </label>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Searching…
          </div>
        ) : !query.trim() ? (
          <p className="py-16 text-center text-sm text-muted">
            Search by product name, brand, or category.
          </p>
        ) : searched && results.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            No products found for &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoaderCircle className="animate-spin label-accent" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
