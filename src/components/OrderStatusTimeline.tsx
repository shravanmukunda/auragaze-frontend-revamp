"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderSummary } from "@/types/order";

const STEPS = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

function stepIndex(status: OrderSummary["status"]) {
  if (status === "cancelled") return -1;
  return STEPS.findIndex((step) => step.key === status);
}

interface OrderStatusTimelineProps {
  status: OrderSummary["status"];
}

export default function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const activeIndex = stepIndex(status);
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div
        className="rounded-2xl px-4 py-3 text-sm font-semibold text-rose-500"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        This order was cancelled.
      </div>
    );
  }

  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((step, index) => {
        const complete = activeIndex > index;
        const current = activeIndex === index;

        return (
          <li key={step.key} className="flex flex-col items-center gap-2 text-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border",
                complete || current
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
              )}
            >
              {complete ? <Check size={14} /> : <Circle size={10} fill="currentColor" />}
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                current ? "text-[var(--foreground)]" : "text-[var(--muted)]",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
