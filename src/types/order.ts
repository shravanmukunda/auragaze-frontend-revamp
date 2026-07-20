export interface ShippingAddress {
  name: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface OrderLine {
  id: string;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderSummary {
  id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cod" | "online_stub";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  shippingFee: number;
  discount: number;
  promoCode?: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderDetail extends OrderSummary {
  shippingAddress: ShippingAddress;
  items: OrderLine[];
}

export interface CheckoutResult {
  orderId: string;
  total: number;
}
