export interface StorefrontProductVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
}

export interface StorefrontProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  image: string;
  images: string[];
  rating: number;
  reviews: number;
  description: string;
  features: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  badge?: "new" | "sale" | "hot" | "limited";
  isFavorite?: boolean;
  isFeatured: boolean;
  createdAt: string;
  variants: StorefrontProductVariant[];
}
