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

export { getRazorpayKeyId };
