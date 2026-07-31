import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminPromoError,
  deleteAdminPromo,
  getAdminPromo,
  parseAdminPromoInput,
  setAdminPromoActive,
  updateAdminPromo,
} from "@/lib/admin-promo-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const promo = await getAdminPromo(id);
    if (!promo) {
      return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
    }
    return NextResponse.json(promo);
  } catch (error) {
    console.error("Failed to load promo code", error);
    return NextResponse.json(
      { error: "Unable to load promo code." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    body &&
    typeof body === "object" &&
    "isActive" in body &&
    Object.keys(body as object).length === 1
  ) {
    try {
      const promo = await setAdminPromoActive(
        id,
        (body as { isActive: unknown }).isActive === true,
      );
      return NextResponse.json(promo);
    } catch (error) {
      if (error instanceof AdminPromoError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      console.error("Failed to toggle promo code", error);
      return NextResponse.json(
        { error: "Unable to update promo code." },
        { status: 500 },
      );
    }
  }

  const parsed = parseAdminPromoInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const promo = await updateAdminPromo(id, parsed.data);
    return NextResponse.json(promo);
  } catch (error) {
    if (error instanceof AdminPromoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to update promo code", error);
    return NextResponse.json(
      { error: "Unable to update promo code." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    await deleteAdminPromo(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AdminPromoError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to delete promo code", error);
    return NextResponse.json(
      { error: "Unable to delete promo code." },
      { status: 500 },
    );
  }
}
