import { requireAdmin } from "@/lib/admin-auth";
import {
  AdminOrderError,
  getAdminOrder,
  parseOrderStatus,
  updateAdminOrderStatus,
} from "@/lib/admin-order-service";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to load admin order", error);
    return NextResponse.json(
      { error: "Unable to load order." },
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

  const statusRaw =
    body && typeof body === "object" && "status" in body
      ? String((body as { status: unknown }).status)
      : "";
  const status = parseOrderStatus(statusRaw);

  if (!status) {
    return NextResponse.json({ error: "Valid status is required." }, { status: 400 });
  }

  try {
    const order = await updateAdminOrderStatus(id, status);
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof AdminOrderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to update order status", error);
    return NextResponse.json(
      { error: "Unable to update order." },
      { status: 500 },
    );
  }
}
