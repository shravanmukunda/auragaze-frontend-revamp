import { NextResponse } from "next/server";
import {
  WishlistError,
  addWishlistItem,
  getUserWishlistIds,
  getUserWishlistProducts,
  removeWishlistItem,
} from "@/lib/wishlist-service";
import { getSessionUser } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const includeProducts = searchParams.get("products") === "true";

  try {
    if (includeProducts) {
      const products = await getUserWishlistProducts(user.id);
      return NextResponse.json({ products });
    }

    const productIds = await getUserWishlistIds(user.id);
    return NextResponse.json({ productIds });
  } catch (error) {
    console.error("Failed to load wishlist", error);
    return NextResponse.json(
      { error: "Unable to load wishlist." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const productId =
    body && typeof body === "object" && "productId" in body
      ? String((body as { productId: unknown }).productId).trim()
      : "";

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  try {
    const result = await addWishlistItem(user.id, productId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof WishlistError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to add wishlist item", error);
    return NextResponse.json(
      { error: "Unable to update wishlist." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId")?.trim();

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  try {
    await removeWishlistItem(user.id, productId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WishlistError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to remove wishlist item", error);
    return NextResponse.json(
      { error: "Unable to update wishlist." },
      { status: 500 },
    );
  }
}
