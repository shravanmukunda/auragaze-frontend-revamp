import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminPromoError,
  createAdminPromo,
  listAdminPromos,
  parseAdminPromoInput,
} from "@/lib/admin-promo-service";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  try {
    const promos = await listAdminPromos({ query });
    return NextResponse.json(promos);
  } catch (error) {
    console.error("Failed to list promo codes", error);
    return NextResponse.json(
      { error: "Unable to load promo codes." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseAdminPromoInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const promo = await createAdminPromo(parsed.data);
    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    if (error instanceof AdminPromoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to create promo code", error);
    return NextResponse.json(
      { error: "Unable to create promo code." },
      { status: 500 },
    );
  }
}
