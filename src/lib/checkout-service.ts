import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/data";
import { mapOrderDetail, mapOrderSummary } from "@/lib/order-mapper";
import { reservePromoCode } from "@/lib/promo-service";
import type { CheckoutResult, ShippingAddress } from "@/types/order";

export class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

function validateShippingAddress(address: ShippingAddress): ShippingAddress {
  const name = address.name?.trim();
  const line1 = address.line1?.trim();
  const city = address.city?.trim();
  const state = address.state?.trim();
  const postalCode = address.postalCode?.trim();
  const phone = address.phone?.trim();

  if (!name || name.length < 2) {
    throw new CheckoutError("Enter a valid recipient name");
  }
  if (!line1 || line1.length < 5) {
    throw new CheckoutError("Enter a complete street address");
  }
  if (!city || city.length < 2) {
    throw new CheckoutError("Enter a valid city");
  }
  if (!state || state.length < 2) {
    throw new CheckoutError("Enter a valid state");
  }
  if (!postalCode || !/^\d{6}$/.test(postalCode)) {
    throw new CheckoutError("Enter a valid 6-digit postal code");
  }
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    throw new CheckoutError("Enter a valid phone number");
  }

  return {
    name,
    label: address.label?.trim() || "Home",
    line1,
    line2: address.line2?.trim() || undefined,
    city,
    state,
    postalCode,
    phone,
  };
}

export async function placeOrder(
  userId: string,
  rawAddress: ShippingAddress,
  options?: { saveAddress?: boolean; promoCode?: string },
): Promise<CheckoutResult> {
  const shippingAddress = validateShippingAddress(rawAddress);

  const order = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new CheckoutError("Your cart is empty", 400);
    }

    for (const item of cart.items) {
      const product = item.variant.product;
      if (!product.isActive) {
        throw new CheckoutError(`${product.name} is no longer available`, 409);
      }
      if (item.variant.stock < item.quantity) {
        throw new CheckoutError(
          `Only ${item.variant.stock} left for ${product.name} (${item.variant.size})`,
          409,
        );
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.product.price) * item.quantity,
      0,
    );
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    let discount = 0;
    let promoCode: string | undefined;
    if (options?.promoCode?.trim()) {
      const promo = await reservePromoCode(options.promoCode, subtotal, tx);
      discount = promo.discount;
      promoCode = promo.code;
    }

    const total = subtotal + shippingFee - discount;

    const createdOrder = await tx.order.create({
      data: {
        userId,
        subtotal,
        shippingFee,
        discount,
        promoCode,
        total,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "PENDING",
        shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
        items: {
          create: cart.items.map((item) => ({
            productName: item.variant.product.name,
            size: item.variant.size,
            color: item.variant.color,
            quantity: item.quantity,
            price: item.variant.product.price,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of cart.items) {
      const updated = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          stock: { gte: item.quantity },
        },
        data: {
          stock: { decrement: item.quantity },
        },
      });

      if (updated.count === 0) {
        throw new CheckoutError(
          `Insufficient stock for ${item.variant.product.name} (${item.variant.size})`,
          409,
        );
      }

      await tx.inventoryTransaction.create({
        data: {
          variantId: item.variantId,
          quantity: item.quantity,
          type: "OUT",
          note: `Order ${createdOrder.id}`,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (options?.saveAddress) {
      const existingDefault = await tx.address.findFirst({
        where: { userId, isDefault: true },
        select: { id: true },
      });

      await tx.address.create({
        data: {
          userId,
          label: shippingAddress.label,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          phone: shippingAddress.phone,
          isDefault: !existingDefault,
        },
      });
    }

    return createdOrder;
  });

  return {
    orderId: order.id,
    total: Number(order.total),
  };
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map(mapOrderSummary);
}

export async function getUserOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) return null;
  return mapOrderDetail(order);
}
