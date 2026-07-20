import { requireAdmin } from "@/lib/admin-auth";
import { getVariantHistory } from "@/lib/admin-inventory-service";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ variantId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { variantId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam) ? limitParam : 50;

  try {
    const result = await getVariantHistory(variantId, limit);
    if (!result) {
      return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load inventory history", error);
    return NextResponse.json(
      { error: "Unable to load inventory history." },
      { status: 500 },
    );
  }
}
