"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, Tag, X } from "lucide-react";
import { toast } from "sonner";
import {
  getStoredPromoCode,
  setStoredPromoCode,
} from "@/lib/promo-storage";
import { formatPrice } from "@/lib/utils";
import type { PromoValidation } from "@/types/promo";

interface PromoCodeFormProps {
  subtotal: number;
  onApplied?: (promo: PromoValidation | null) => void;
  compact?: boolean;
}

export default function PromoCodeForm({
  subtotal,
  onApplied,
  compact = false,
}: PromoCodeFormProps) {
  const [input, setInput] = useState("");
  const [applied, setApplied] = useState<PromoValidation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = getStoredPromoCode();
    if (!stored || subtotal <= 0) {
      setApplied(null);
      onApplied?.(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/promo-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: stored, subtotal }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setStoredPromoCode(null);
          setApplied(null);
          onApplied?.(null);
          return;
        }
        setInput(stored);
        setApplied(data as PromoValidation);
        onApplied?.(data as PromoValidation);
      } catch {
        if (!cancelled) {
          setApplied(null);
          onApplied?.(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onApplied, subtotal]);

  async function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = input.trim();
    if (!code) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Invalid promo code.");
        setApplied(null);
        setStoredPromoCode(null);
        onApplied?.(null);
        return;
      }

      const promo = data as PromoValidation;
      setApplied(promo);
      setStoredPromoCode(promo.code);
      onApplied?.(promo);
      toast.success(`${promo.code} applied.`);
    } catch {
      setError("Unable to apply promo code.");
    } finally {
      setSubmitting(false);
    }
  }

  function removePromo() {
    setApplied(null);
    setInput("");
    setError("");
    setStoredPromoCode(null);
    onApplied?.(null);
    toast.success("Promo code removed.");
  }

  if (applied) {
    return (
      <div
        className={
          compact
            ? "rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
            : "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Tag size={16} className="mt-0.5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                {applied.code} applied
              </p>
              {applied.description ? (
                <p className="text-xs text-muted">{applied.description}</p>
              ) : null}
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                You save {formatPrice(applied.discount)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removePromo}
            className="rounded-lg p-1 text-muted"
            aria-label="Remove promo code"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder="Promo code"
          className="w-full rounded-xl border border-(--border) bg-background py-3 px-4 text-sm uppercase outline-none transition focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={submitting || !input.trim() || subtotal <= 0}
          className="shrink-0 rounded-xl border border-(--border) px-4 text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? <LoaderCircle size={16} className="animate-spin" /> : "Apply"}
        </button>
      </div>
      {error ? <p className="text-xs text-rose-500">{error}</p> : null}
      {!compact ? (
        <p className="text-[11px] text-muted">Try code AURA20 for 20% off.</p>
      ) : null}
    </form>
  );
}
