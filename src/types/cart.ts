export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface EnrichedCartLine {
  id: string;
  variantId: string;
  quantity: number;
  productId: string;
  productSlug: string;
  productName: string;
  brand: string;
  image: string;
  price: number;
  size: string;
  color: string;
  stock: number;
}

export interface CartSummary {
  items: EnrichedCartLine[];
  itemCount: number;
  subtotal: number;
}
