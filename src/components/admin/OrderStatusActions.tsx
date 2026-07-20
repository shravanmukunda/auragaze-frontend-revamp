"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/lib/order-status";
import type { AdminOrderDetail, AdminOrderStatus } from "@/types/admin-order";
import { cn } from "@/lib/utils";

interface OrderStatusActionsProps {
  order: AdminOrderDetail;
}

const ACTION_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Mark pending",
  confirmed: "Confirm order",
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

export default function OrderStatusActions({ order }: OrderStatusActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<AdminOrderStatus | null>(null);

  async function updateStatus(status: AdminOrderStatus) {
    setUpdating(status);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to update order.");
        return;
      }
      toast.success(`Order marked as ${orderStatusLabel(status)}.`);
      router.refresh();
    } catch {
      toast.error("Unable to update order.");
    } finally {
      setUpdating(null);
    }
  }

  if (order.allowedNextStatuses.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
          orderStatusTone(order.status),
        )}
      >
        {orderStatusLabel(order.status)}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {order.allowedNextStatuses.map((status) => (
        <button
          key={status}
          type="button"
          disabled={updating !== null}
          onClick={() => updateStatus(status)}
          className={cn(
            status === "cancelled" ? "admin-button-secondary" : "admin-button-primary",
            status === "cancelled" && "text-rose-600",
          )}
        >
          {updating === status && (
            <LoaderCircle size={14} className="animate-spin" />
          )}
          {ACTION_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
