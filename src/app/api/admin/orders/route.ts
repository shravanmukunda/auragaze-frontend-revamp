import { requireAdmin } from "@/lib/admin-auth";
import { listAdminOrders, parseOrderStatus } from "@/lib/admin-order-service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = parseOrderStatus(searchParams.get("status"));
  const query = searchParams.get("q")?.trim();

  if (searchParams.get("status") && !status) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  try {
    const orders = await listAdminOrders({ status, query });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to list admin orders", error);
    return NextResponse.json(
      { error: "Unable to load orders." },
      { status: 500 },
    );
  }
}
