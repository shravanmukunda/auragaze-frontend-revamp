export interface PromoValidation {
  code: string;
  description: string | null;
  discount: number;
  subtotal: number;
  totalAfterDiscount: number;
}
