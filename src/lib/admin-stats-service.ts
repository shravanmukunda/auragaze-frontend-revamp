import { prisma } from "@/lib/prisma";
import { mapOrderSummary } from "@/lib/order-mapper";
import type { AdminStats } from "@/types/admin-order";
import { LOW_STOCK_THRESHOLD } from "@/types/admin-inventory";
import { OrderStatus } from "@prisma/client";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getAdminStats(): Promise<AdminStats> {
  const today = startOfToday();

  const [revenueAgg, ordersToday, openOrders, lowStockVariants, recentOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED },
          paymentMethod: "COD",
        },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.order.count({
        where: {
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.CONFIRMED,
              OrderStatus.SHIPPED,
            ],
          },
        },
      }),
      prisma.productVariant.count({
        where: {
          stock: { lte: LOW_STOCK_THRESHOLD },
          product: { isActive: true },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

  return {
    revenue: Number(revenueAgg._sum.total ?? 0),
    ordersToday,
    openOrders,
    lowStockVariants,
    recentOrders: recentOrders.map((order) => ({
      ...mapOrderSummary(order),
      customerName: order.user.name,
      customerEmail: order.user.email,
    })),
  };
}
