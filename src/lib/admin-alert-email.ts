import { appOrigin, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { LOW_STOCK_THRESHOLD } from "@/types/admin-inventory";
import { formatPrice } from "@/lib/utils";

function adminInbox() {
  return process.env.ADMIN_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendNewOrderAdminAlert(orderId: string) {
  const to = adminInbox();
  if (!to) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
  if (!order) return;

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const adminUrl = `${appOrigin()}/admin/orders/${order.id}`;

  try {
    await sendMail({
      to,
      subject: `New order · ${formatPrice(Number(order.total))}`,
      html: `
        <p>A new order was placed on AURAGAZE.</p>
        <p>
          <strong>Order:</strong> ${escapeHtml(order.id)}<br/>
          <strong>Customer:</strong> ${escapeHtml(order.user.name)} (${escapeHtml(order.user.email)})<br/>
          <strong>Items:</strong> ${itemCount}<br/>
          <strong>Total:</strong> ${escapeHtml(formatPrice(Number(order.total)))}<br/>
          <strong>Payment:</strong> ${escapeHtml(order.paymentMethod)} / ${escapeHtml(order.paymentStatus)}
        </p>
        <p><a href="${adminUrl}">Open in admin</a></p>
      `,
    });
  } catch (error) {
    console.error("New order admin alert failed", { orderId, error });
  }
}

export async function maybeSendLowStockAlert(variantIds: string[]) {
  const to = adminInbox();
  if (!to || variantIds.length === 0) return;

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [...new Set(variantIds)] },
      stock: { lte: LOW_STOCK_THRESHOLD },
      product: { isActive: true },
    },
    include: {
      product: { select: { name: true } },
    },
  });

  if (variants.length === 0) return;

  const rows = variants
    .map(
      (variant) =>
        `<li>${escapeHtml(variant.product.name)} · ${escapeHtml(variant.size)} / ${escapeHtml(variant.color)} — <strong>${variant.stock}</strong> left (SKU ${escapeHtml(variant.sku)})</li>`,
    )
    .join("");

  try {
    await sendMail({
      to,
      subject: `Low stock alert · ${variants.length} variant${variants.length === 1 ? "" : "s"}`,
      html: `
        <p>The following variants are at or below the low-stock threshold (${LOW_STOCK_THRESHOLD}):</p>
        <ul>${rows}</ul>
        <p><a href="${appOrigin()}/admin/inventory">Open inventory</a></p>
      `,
    });
  } catch (error) {
    console.error("Low stock admin alert failed", { variantIds, error });
  }
}
