import { NextResponse } from "next/server";
import {
  addCartItem,
  clearUserCart,
  getUserCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/cart-service";
import { getSessionUser } from "@/lib/session";
import type { CartLineInput } from "@/types/cart";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function parseQuantity(value: unknown) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  return Math.floor(quantity);
}

function parseGuestItems(value: unknown): CartLineInput[] | null {
  if (!Array.isArray(value)) return null;

  const items: CartLineInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const variantId = (entry as { variantId?: unknown }).variantId;
    const quantity = parseQuantity((entry as { quantity?: unknown }).quantity);
    if (typeof variantId !== "string" || !variantId || quantity === null) {
      return null;
    }
    items.push({ variantId, quantity });
  }

  return items;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const cart = await getUserCart(user.id);
  return NextResponse.json(cart);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body || typeof body !== "object") {
    return badRequest("Invalid request body");
  }

  const payload = body as {
    merge?: unknown;
    variantId?: unknown;
    quantity?: unknown;
  };

  if (payload.merge !== undefined) {
    const guestItems = parseGuestItems(payload.merge);
    if (!guestItems) {
      return badRequest("Invalid merge payload");
    }

    try {
      const cart = await mergeGuestCart(user.id, guestItems);
      return NextResponse.json(cart);
    } catch {
      return NextResponse.json(
        { error: "Unable to merge cart" },
        { status: 500 },
      );
    }
  }

  if (typeof payload.variantId !== "string" || !payload.variantId) {
    return badRequest("variantId is required");
  }

  const quantity = parseQuantity(payload.quantity ?? 1);
  if (quantity === null) {
    return badRequest("quantity must be a positive integer");
  }

  try {
    const cart = await addCartItem(user.id, payload.variantId, quantity);
    return NextResponse.json(cart);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to add cart item";
    if (message === "Variant unavailable") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body || typeof body !== "object") {
    return badRequest("Invalid request body");
  }

  const payload = body as { variantId?: unknown; quantity?: unknown };
  if (typeof payload.variantId !== "string" || !payload.variantId) {
    return badRequest("variantId is required");
  }

  const quantity = parseQuantity(payload.quantity);
  if (quantity === null) {
    return badRequest("quantity must be a positive integer");
  }

  try {
    const cart = await updateCartItemQuantity(
      user.id,
      payload.variantId,
      quantity,
    );
    return NextResponse.json(cart);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update cart item";
    if (message === "Cart item not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const clear = searchParams.get("clear") === "true";
  const variantId = searchParams.get("variantId");

  if (clear) {
    const cart = await clearUserCart(user.id);
    return NextResponse.json(cart);
  }

  if (!variantId) {
    return badRequest("variantId or clear=true is required");
  }

  const cart = await removeCartItem(user.id, variantId);
  return NextResponse.json(cart);
}
