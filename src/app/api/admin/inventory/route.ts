import { requireAdmin } from "@/lib/admin-auth";
import {
  InventoryError,
  adjustInventory,
  listInventory,
  parseAdjustInput,
} from "@/lib/admin-inventory-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const includeInactive = searchParams.get("includeInactive") === "true";

  try {
    const rows = await listInventory({
      query,
      lowStockOnly,
      includeInactive,
    });
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to list inventory", error);
    return NextResponse.json(
      { error: "Unable to load inventory." },
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

  const parsed = parseAdjustInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await adjustInventory(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InventoryError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to adjust inventory", error);
    return NextResponse.json(
      { error: "Unable to adjust inventory." },
      { status: 500 },
    );
  }
}
