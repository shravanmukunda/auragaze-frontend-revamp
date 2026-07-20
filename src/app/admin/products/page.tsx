"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import RemoteImage from "@/components/RemoteImage";
import { LoaderCircle, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_CATEGORIES,
  type AdminProduct,
} from "@/types/admin-product";
import { cn, formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (includeInactive) params.set("includeInactive", "true");

    try {
      const response = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to load products.");
        setProducts([]);
        return;
      }
      setProducts(data);
    } catch {
      toast.error("Unable to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, includeInactive, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  async function toggleActive(product: AdminProduct) {
    setTogglingId(product.id);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to update product.");
        return;
      }
      toast.success(
        data.isActive ? "Product activated." : "Product deactivated.",
      );
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? data : item)),
      );
    } catch {
      toast.error("Unable to update product.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--label-accent)]">
            Catalog
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight">
            Products
          </h1>
        </div>
        <Link href="/admin/products/new" className="admin-button-primary">
          <Plus size={16} />
          New product
        </Link>
      </div>

      <div className="surface-card rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, brand, or slug"
              className="admin-input pl-9"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="admin-input"
          >
            <option value="">All categories</option>
            {ADMIN_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-1 text-sm font-semibold">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Show inactive
          </label>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-[var(--muted)]">
            <LoaderCircle size={18} className="animate-spin" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold">No products found</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Try a different search or create a new tee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const image = product.images[0]?.imageUrl;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[var(--surface-hover)]">
                            {image ? (
                              <RemoteImage
                                src={image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {product.brand} · {product.variants.length} variants
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm">{product.subcategory}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {product.category}
                        </p>
                      </td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{product.totalStock}</td>
                      <td>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            product.isActive
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-slate-500/15 text-[var(--muted)]",
                          )}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={togglingId === product.id}
                            onClick={() => toggleActive(product)}
                            className="admin-button-secondary"
                          >
                            {togglingId === product.id ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : product.isActive ? (
                              "Deactivate"
                            ) : (
                              "Activate"
                            )}
                          </button>
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="admin-button-secondary"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
