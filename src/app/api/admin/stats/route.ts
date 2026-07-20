import { requireAdmin } from "@/lib/admin-auth";
import { getAdminStats } from "@/lib/admin-stats-service";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to load admin stats", error);
    return NextResponse.json(
      { error: "Unable to load dashboard stats." },
      { status: 500 },
    );
  }
}
