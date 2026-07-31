import { NextResponse } from "next/server";
import { CheckoutError, placeOrder } from "@/lib/checkout-service";
import {
  fetchVerifiedRazorpayPayment,
  isRazorpayConfigured,
  verifyRazorpayPaymentSignature,
} from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import type { ShippingAddress } from "@/types/order";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseShippingAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<ShippingAddress>;
  if (
    typeof record.name !== "string" ||
    typeof record.line1 !== "string" ||
    typeof record.city !== "string" ||
    typeof record.state !== "string" ||
    typeof record.postalCode !== "string" ||
    typeof record.phone !== "string"
  ) {
    return null;
  }

  return {
    name: record.name,
    label: typeof record.label === "string" ? record.label : "Home",
    line1: record.line1,
    line2: typeof record.line2 === "string" ? record.line2 : undefined,
    city: record.city,
    state: record.state,
    postalCode: record.postalCode,
    phone: record.phone,
  };
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payments are not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const payload = body as {
    shippingAddress?: unknown;
    saveAddress?: unknown;
    promoCode?: unknown;
    razorpay_order_id?: unknown;
    razorpay_payment_id?: unknown;
    razorpay_signature?: unknown;
  };

  const shippingAddress = parseShippingAddress(payload.shippingAddress);
  if (!shippingAddress) {
    return NextResponse.json(
      { error: "Valid shippingAddress is required" },
      { status: 400 },
    );
  }

  const razorpayOrderId =
    typeof payload.razorpay_order_id === "string"
      ? payload.razorpay_order_id.trim()
      : "";
  const razorpayPaymentId =
    typeof payload.razorpay_payment_id === "string"
      ? payload.razorpay_payment_id.trim()
      : "";
  const razorpaySignature =
    typeof payload.razorpay_signature === "string"
      ? payload.razorpay_signature.trim()
      : "";

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json(
      { error: "Incomplete Razorpay payment response" },
      { status: 400 },
    );
  }

  const valid = verifyRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  );

  if (!valid) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  let paidAmountPaise: number;
  try {
    const payment = await fetchVerifiedRazorpayPayment(
      razorpayOrderId,
      razorpayPaymentId,
    );
    paidAmountPaise = payment.amountPaise;
  } catch (error) {
    console.error("Razorpay payment fetch/validate failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm payment with Razorpay",
      },
      { status: 400 },
    );
  }

  try {
    const result = await placeOrder(user.id, shippingAddress, {
      saveAddress: payload.saveAddress === true,
      promoCode:
        typeof payload.promoCode === "string" ? payload.promoCode : undefined,
      paymentMethod: "RAZORPAY",
      paymentStatus: "PAID",
      razorpayOrderId,
      razorpayPaymentId,
      expectedPaidAmountPaise: paidAmountPaise,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Razorpay verify failed:", error);
    return NextResponse.json(
      { error: "Unable to complete order after payment" },
      { status: 500 },
    );
  }
}
