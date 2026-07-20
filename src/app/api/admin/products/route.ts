import { requireAdmin } from "@/lib/admin-auth";
import {
  createAdminProduct,
  listAdminProducts,
  parseAdminProductInput,
} from "@/lib/admin-product-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const products = await listAdminProducts({
      query,
      category,
      includeInactive,
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to list admin products", error);
    return NextResponse.json(
      { error: "Unable to load products." },
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

  const parsed = parseAdminProductInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await createAdminProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "A variant SKU or product slug already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Unable to create product." },
      { status: 500 },
    );
  }
}
