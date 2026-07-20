"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import type {
  InventoryAdjustResult,
  InventoryRow,
  InventoryTxnType,
} from "@/types/admin-inventory";
import { cn } from "@/lib/utils";

interface AdjustStockModalProps {
  row: InventoryRow;
  onClose: () => void;
  onAdjusted: (result: InventoryAdjustResult) => void;
}

const TYPES: { value: InventoryTxnType; label: string; hint: string }[] = [
  { value: "IN", label: "IN", hint: "Add units (restock)" },
  { value: "OUT", label: "OUT", hint: "Remove units (damage / loss)" },
  {
    value: "ADJUSTMENT",
    label: "ADJUSTMENT",
    hint: "Set absolute stock level",
  },
];

export default function AdjustStockModal({
  row,
  onClose,
  onAdjusted,
}: AdjustStockModalProps) {
  const [type, setType] = useState<InventoryTxnType>("IN");
  const [quantity, setQuantity] = useState("10");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    if (type !== "ADJUSTMENT" && qty <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: row.variantId,
          type,
          quantity: qty,
          note: note.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to adjust stock.");
        return;
      }
      toast.success(`Stock updated to ${data.variant.stock}.`);
      onAdjusted(data as InventoryAdjustResult);
      onClose();
    } catch {
      toast.error("Unable to adjust stock.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--label-accent)]">
              Adjust stock
            </p>
            <h2 className="font-heading text-xl font-bold">{row.productName}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {row.color} / {row.size} · SKU {row.sku} · Current{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {row.stock}
              </span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-icon-button">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setType(option.value);
                  if (option.value === "ADJUSTMENT") {
                    setQuantity(String(row.stock));
                  } else if (quantity === String(row.stock)) {
                    setQuantity("10");
                  }
                }}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-bold",
                  type === option.value
                    ? "border-[var(--label-accent)] bg-[var(--primary-muted)] text-[var(--label-accent)]"
                    : "border-[var(--border)] text-[var(--muted-strong)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)]">
            {TYPES.find((option) => option.value === type)?.hint}
          </p>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">
              {type === "ADJUSTMENT" ? "New stock level" : "Quantity"}
            </span>
            <input
              type="number"
              min={0}
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="admin-input"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Note (optional)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="admin-input"
              placeholder="e.g. Warehouse restock / damaged units"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="admin-button-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="admin-button-primary"
            >
              {submitting && <LoaderCircle size={16} className="animate-spin" />}
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
