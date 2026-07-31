import type { OrderStatus } from "@prisma/client";
import { appOrigin, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const STATUS_COPY: Partial<
  Record<OrderStatus, { subject: string; headline: string; body: string }>
> = {
  CONFIRMED: {
    subject: "Your AURAGAZE order is confirmed",
    headline: "Order confirmed",
    body: "We have confirmed your order and will start preparing it shortly.",
  },
  SHIPPED: {
    subject: "Your AURAGAZE order has shipped",
    headline: "Order shipped",
    body: "Your order is on its way. You can track its status anytime in your account.",
  },
  DELIVERED: {
    subject: "Your AURAGAZE order was delivered",
    headline: "Order delivered",
    body: "Your order has been marked as delivered. We hope you love it.",
  },
  CANCELLED: {
    subject: "Your AURAGAZE order was cancelled",
    headline: "Order cancelled",
    body: "Your order has been cancelled. If you have questions, reply to this email.",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadOrderForEmail(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
}

function orderItemsHtml(
  items: { productName: string; size: string; color: string; quantity: number; price: unknown }[],
) {
  const rows = items
    .map((item) => {
      const price = Number(item.price);
      const lineTotal = price * item.quantity;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${escapeHtml(item.productName)}<br/>
          <span style="color:#666;font-size:13px;">${escapeHtml(item.size)} · ${escapeHtml(item.color)} × ${item.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">
          ${escapeHtml(formatPrice(lineTotal))}
        </td>
      </tr>`;
    })
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table>`;
}

function orderUrl(orderId: string) {
  return `${appOrigin()}/orders/${orderId}`;
}

export async function sendOrderConfirmationEmail(orderId: string) {
  const order = await loadOrderForEmail(orderId);
  if (!order?.user.email) return;

  const name = escapeHtml(order.user.name || "there");
  const total = formatPrice(Number(order.total));
  const paymentLabel =
    order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online";

  try {
    await sendMail({
      to: order.user.email,
      subject: `Order confirmed · ${formatPrice(Number(order.total))}`,
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for shopping at AURAGAZE. We received your order.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(order.id)}<br/>
        <strong>Total:</strong> ${escapeHtml(total)}<br/>
        <strong>Payment:</strong> ${paymentLabel}</p>
        ${orderItemsHtml(order.items)}
        <p style="margin-top:16px;">
          <a href="${orderUrl(order.id)}">View your order</a>
        </p>
      `,
    });
  } catch (error) {
    console.error("Order confirmation email failed", { orderId, error });
  }
}

export async function sendOrderStatusEmail(
  orderId: string,
  status: OrderStatus,
) {
  const copy = STATUS_COPY[status];
  if (!copy) return;

  const order = await loadOrderForEmail(orderId);
  if (!order?.user.email) return;

  const name = escapeHtml(order.user.name || "there");

  try {
    await sendMail({
      to: order.user.email,
      subject: copy.subject,
      html: `
        <p>Hi ${name},</p>
        <p><strong>${escapeHtml(copy.headline)}</strong></p>
        <p>${escapeHtml(copy.body)}</p>
        <p><strong>Order ID:</strong> ${escapeHtml(order.id)}<br/>
        <strong>Total:</strong> ${escapeHtml(formatPrice(Number(order.total)))}</p>
        <p><a href="${orderUrl(order.id)}">View your order</a></p>
      `,
    });
  } catch (error) {
    console.error("Order status email failed", { orderId, status, error });
  }
}
