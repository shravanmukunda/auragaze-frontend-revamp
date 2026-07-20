import type { ProductBadge } from "@prisma/client";

export interface AdminProductVariantInput {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
}

export interface AdminProductInput {
  name: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number | null;
  badge?: ProductBadge | null;
  features?: string[];
  images?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  variants?: AdminProductVariantInput[];
}

export interface AdminProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number | null;
  badge: ProductBadge | null;
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  images: { id: string; imageUrl: string; sortOrder: number }[];
  variants: AdminProductVariant[];
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export const ADMIN_CATEGORIES = [
  { value: "oversized-tees", label: "Oversized Tees" },
] as const;

export const ADMIN_SUBCATEGORIES = [
  { value: "graphic", label: "Graphic" },
  { value: "basics", label: "Basics" },
  { value: "full-sleeve", label: "Full Sleeve" },
] as const;

export const ADMIN_BADGES = [
  { value: "NEW", label: "New" },
  { value: "SALE", label: "Sale" },
  { value: "HOT", label: "Hot" },
  { value: "LIMITED", label: "Limited" },
] as const;

export const DEFAULT_SIZES = ["S", "M", "L", "XL"] as const;
