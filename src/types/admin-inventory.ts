export type InventoryTxnType = "IN" | "OUT" | "ADJUSTMENT";

export const LOW_STOCK_THRESHOLD = 5;

export interface InventoryRow {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  isLowStock: boolean;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  isActive: boolean;
  imageUrl: string | null;
  updatedAt: string;
}

export interface InventoryTransactionRow {
  id: string;
  variantId: string;
  type: InventoryTxnType;
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface InventoryAdjustInput {
  variantId: string;
  type: InventoryTxnType;
  quantity: number;
  note?: string;
}

export interface InventoryAdjustResult {
  variant: InventoryRow;
  transaction: InventoryTransactionRow;
}
