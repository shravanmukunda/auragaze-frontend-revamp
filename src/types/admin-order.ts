import type { OrderDetail, OrderSummary } from "@/types/order";

export type AdminOrderStatus = OrderSummary["status"];

export interface AdminOrderSummary extends OrderSummary {
  customerName: string;
  customerEmail: string;
}

export interface AdminOrderDetail extends OrderDetail {
  customerName: string;
  customerEmail: string;
  allowedNextStatuses: AdminOrderStatus[];
}

export interface AdminStats {
  revenue: number;
  ordersToday: number;
  openOrders: number;
  lowStockVariants: number;
  recentOrders: AdminOrderSummary[];
}
