import { prisma } from "@/lib/prisma";
import { mapOrderDetail, mapOrderSummary } from "@/lib/order-mapper";
import type {
  AdminOrderDetail,
  AdminOrderStatus,
  AdminOrderSummary,
} from "@/types/admin-order";
import { InventoryType, OrderStatus, Prisma } from "@prisma/client";

const orderInclude = {
  items: true,
  user: { select: { name: true, email: true } },
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

export class AdminOrderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdminOrderError";
    this.status = status;
  }
}

function toAdminStatus(status: OrderStatus): AdminOrderStatus {
  return status.toLowerCase() as AdminOrderStatus;
}

function mapAdminOrderSummary(order: OrderRecord): AdminOrderSummary {
  return {
    ...mapOrderSummary(order),
    customerName: order.user.name,
    customerEmail: order.user.email,
  };
}

function allowedNextStatuses(status: OrderStatus): AdminOrderStatus[] {
  return VALID_TRANSITIONS[status].map(toAdminStatus);
}

function mapAdminOrderDetail(order: OrderRecord): AdminOrderDetail {
  return {
    ...mapOrderDetail(order),
    customerName: order.user.name,
    customerEmail: order.user.email,
    allowedNextStatuses: allowedNextStatuses(order.status),
  };
}

function shouldRestoreStock(from: OrderStatus, to: OrderStatus) {
  return (
    to === OrderStatus.CANCELLED &&
    (from === OrderStatus.PENDING || from === OrderStatus.CONFIRMED)
  );
}

async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderRecord["items"],
) {
  for (const item of items) {
    const variant = await tx.productVariant.findFirst({
      where: {
        size: item.size,
        color: item.color,
        product: { name: item.productName },
      },
    });

    if (!variant) {
      throw new AdminOrderError(
        `Unable to restore stock for ${item.productName} (${item.size}, ${item.color}).`,
        409,
      );
    }

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stock: { increment: item.quantity } },
    });

    await tx.inventoryTransaction.create({
      data: {
        variantId: variant.id,
        quantity: item.quantity,
        type: InventoryType.IN,
        note: `Order ${orderId} cancelled — stock restored`,
      },
    });
  }
}

export async function listAdminOrders(params: {
  status?: OrderStatus;
  query?: string;
}) {
  const query = params.query?.trim();

  const where: Prisma.OrderWhereInput = {
    ...(params.status && { status: params.status }),
    ...(query && {
      OR: [
        { id: { contains: query, mode: "insensitive" } },
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
    }),
  };

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapAdminOrderSummary);
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  return order ? mapAdminOrderDetail(order) : null;
}

export function parseOrderStatus(value: string | null): OrderStatus | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase();
  return normalized in OrderStatus
    ? OrderStatus[normalized as keyof typeof OrderStatus]
    : undefined;
}

export async function updateAdminOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new AdminOrderError("Order not found.", 404);
    }

    if (order.status === nextStatus) {
      throw new AdminOrderError("Order is already in that status.");
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(nextStatus)) {
      throw new AdminOrderError(
        `Cannot move order from ${order.status} to ${nextStatus}.`,
      );
    }

    if (shouldRestoreStock(order.status, nextStatus)) {
      await restoreOrderStock(tx, order.id, order.items);
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        ...(nextStatus === OrderStatus.CANCELLED && {
          paymentStatus: "REFUNDED",
        }),
      },
      include: orderInclude,
    });

    return mapAdminOrderDetail(updated);
  });
}
