import Razorpay from "razorpay";
import crypto from "crypto";

function getRazorpayKeyId() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new Error("RAZORPAY_KEY_ID is not configured");
  }
  return keyId;
}

function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }
  return keySecret;
}

export function isRazorpayConfigured() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

export function getRazorpayClient() {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  });
}

export function rupeesToPaise(amount: number) {
  return Math.round(amount * 100);
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const expected = crypto
    .createHmac("sha256", getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export type VerifiedRazorpayPayment = {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  status: string;
};

/**
 * Fetches the payment from Razorpay and confirms it belongs to the given
 * order, is captured, and is in INR. Call after signature verification.
 */
export async function fetchVerifiedRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<VerifiedRazorpayPayment> {
  const razorpay = getRazorpayClient();
  const [payment, order] = await Promise.all([
    razorpay.payments.fetch(razorpayPaymentId),
    razorpay.orders.fetch(razorpayOrderId),
  ]);

  if (payment.order_id !== razorpayOrderId) {
    throw new Error("Payment does not belong to the expected Razorpay order");
  }

  const status = String(payment.status);
  const captured =
    payment.captured === true || status === "captured";

  if (!captured) {
    throw new Error(`Payment is not captured (status: ${status})`);
  }

  const currency = String(payment.currency ?? "").toUpperCase();
  if (currency !== "INR") {
    throw new Error(`Unexpected payment currency: ${currency || "unknown"}`);
  }

  const amountPaise = Number(payment.amount);
  const orderAmountPaise = Number(order.amount);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new Error("Invalid payment amount from Razorpay");
  }
  if (!Number.isFinite(orderAmountPaise) || amountPaise !== orderAmountPaise) {
    throw new Error("Payment amount does not match the Razorpay order");
  }

  return {
    paymentId: String(payment.id),
    orderId: String(payment.order_id),
    amountPaise,
    currency,
    status,
  };
}

export { getRazorpayKeyId };
