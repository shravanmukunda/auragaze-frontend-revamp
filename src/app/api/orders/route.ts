import { NextResponse } from "next/server";
import { getUserOrders } from "@/lib/checkout-service";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getUserOrders(user.id);
  return NextResponse.json({ orders });
}
