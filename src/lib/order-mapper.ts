import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import type { OrderDetail, OrderLine, OrderSummary, ShippingAddress } from "@/types/order";

function mapOrderStatus(status: OrderStatus): OrderSummary["status"] {
  return status.toLowerCase() as OrderSummary["status"];
}

function mapPaymentMethod(method: PaymentMethod): OrderSummary["paymentMethod"] {
  return method.toLowerCase() as OrderSummary["paymentMethod"];
}

function mapPaymentStatus(status: PaymentStatus): OrderSummary["paymentStatus"] {
  return status.toLowerCase() as OrderSummary["paymentStatus"];
}

function mapOrderLine(item: OrderItem): OrderLine {
  const price = Number(item.price);
  return {
    id: item.id,
    productName: item.productName,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    price,
    lineTotal: price * item.quantity,
  };
}

function parseShippingAddress(value: unknown): ShippingAddress {
  const record = (value ?? {}) as Partial<ShippingAddress>;
  return {
    name: String(record.name ?? ""),
    label: String(record.label ?? "Home"),
    line1: String(record.line1 ?? ""),
    line2: record.line2 ? String(record.line2) : undefined,
    city: String(record.city ?? ""),
    state: String(record.state ?? ""),
    postalCode: String(record.postalCode ?? ""),
    phone: String(record.phone ?? ""),
  };
}

export function mapOrderSummary(
  order: Order & { items: OrderItem[] },
): OrderSummary {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: order.id,
    status: mapOrderStatus(order.status),
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    paymentStatus: mapPaymentStatus(order.paymentStatus),
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discount: Number(order.discount),
    promoCode: order.promoCode ?? undefined,
    total: Number(order.total),
    itemCount,
    createdAt: order.createdAt.toISOString(),
  };
}

export function mapOrderDetail(
  order: Order & { items: OrderItem[] },
): OrderDetail {
  return {
    ...mapOrderSummary(order),
    shippingAddress: parseShippingAddress(order.shippingAddress),
    items: order.items.map(mapOrderLine),
  };
}
