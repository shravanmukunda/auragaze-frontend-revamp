import type { OrderSummary } from "@/types/order";

export function orderStatusLabel(status: OrderSummary["status"]) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function orderStatusTone(status: OrderSummary["status"]) {
  switch (status) {
    case "delivered":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "shipped":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "confirmed":
      return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20";
    case "cancelled":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    default:
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
  }
}
