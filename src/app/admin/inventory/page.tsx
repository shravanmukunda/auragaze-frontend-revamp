"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { History, LoaderCircle, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import AdjustStockModal from "@/components/admin/AdjustStockModal";
import InventoryHistoryDrawer from "@/components/admin/InventoryHistoryDrawer";
import RemoteImage from "@/components/RemoteImage";
import {
  LOW_STOCK_THRESHOLD,
  type InventoryAdjustResult,
  type InventoryRow,
} from "@/types/admin-inventory";
import { cn } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null);
  const [historyRow, setHistoryRow] = useState<InventoryRow | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (lowStockOnly) params.set("lowStock", "true");
    if (includeInactive) params.set("includeInactive", "true");

    try {
      const response = await fetch(`/api/admin/inventory?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to load inventory.");
        setRows([]);
        return;
      }
      setRows(data);
    } catch {
      toast.error("Unable to load inventory.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive, lowStockOnly, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInventory();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadInventory]);

  function handleAdjusted(result: InventoryAdjustResult) {
    setRows((current) =>
      current
        .map((row) =>
          row.variantId === result.variant.variantId ? result.variant : row,
        )
        .filter((row) => {
          if (!lowStockOnly) return true;
          return row.stock <= LOW_STOCK_THRESHOLD;
        }),
    );
  }

  const lowStockCount = rows.filter((row) => row.isLowStock).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--label-accent)]">
            Operations
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight">
            Inventory
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Stock by variant · low-stock threshold ≤ {LOW_STOCK_THRESHOLD}
            {!loading && lowStockOnly
              ? ` · ${rows.length} low-stock variants`
              : !loading
                ? ` · ${lowStockCount} low of ${rows.length} shown`
                : null}
          </p>
        </div>
      </div>

      <div className="surface-card rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, brand, SKU, color, size"
              className="admin-input pl-9"
            />
          </label>
          <label className="flex items-center gap-2 px-1 text-sm font-semibold">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
            />
            Low stock only
          </label>
          <label className="flex items-center gap-2 px-1 text-sm font-semibold">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
            />
            Include inactive
          </label>
        </div>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-[var(--muted)]">
            <LoaderCircle size={18} className="animate-spin" />
            Loading inventory…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold">No variants found</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Try clearing filters or creating products first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.variantId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-[var(--surface-hover)]">
                          {row.imageUrl ? (
                            <RemoteImage
                              src={row.imageUrl}
                              alt={row.productName}
                              fill
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${row.productId}`}
                            className="font-semibold hover:text-[var(--label-accent)]"
                          >
                            {row.productName}
                          </Link>
                          <p className="text-xs text-[var(--muted)]">
                            {row.brand}
                            {!row.isActive ? " · inactive" : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium">
                        {row.color} / {row.size}
                      </p>
                    </td>
                    <td>
                      <code className="text-xs">{row.sku}</code>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "font-semibold",
                          row.isLowStock && "text-amber-600",
                        )}
                      >
                        {row.stock}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          row.isLowStock
                            ? "bg-amber-500/15 text-amber-700"
                            : "bg-emerald-500/15 text-emerald-600",
                        )}
                      >
                        {row.isLowStock ? "Low stock" : "Healthy"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setHistoryRow(row)}
                          className="admin-button-secondary"
                          title="View ledger"
                        >
                          <History size={14} />
                          History
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustRow(row)}
                          className="admin-button-primary"
                        >
                          <SlidersHorizontal size={14} />
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adjustRow ? (
        <AdjustStockModal
          row={adjustRow}
          onClose={() => setAdjustRow(null)}
          onAdjusted={handleAdjusted}
        />
      ) : null}

      {historyRow ? (
        <InventoryHistoryDrawer
          row={historyRow}
          onClose={() => setHistoryRow(null)}
        />
      ) : null}
    </div>
  );
}
