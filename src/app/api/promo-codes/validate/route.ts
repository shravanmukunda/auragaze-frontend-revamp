import { NextResponse } from "next/server";
import { PromoError, validatePromoCode } from "@/lib/promo-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const record = body as { code?: unknown; subtotal?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const subtotal = Number(record.subtotal);

  if (!code.trim()) {
    return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Valid subtotal is required." }, { status: 400 });
  }

  try {
    const result = await validatePromoCode(code, subtotal);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PromoError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to validate promo code", error);
    return NextResponse.json(
      { error: "Unable to validate promo code." },
      { status: 500 },
    );
  }
}
