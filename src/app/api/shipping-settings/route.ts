import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/shipping-settings";

export async function GET() {
  try {
    const settings = await getShippingSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load shipping settings", error);
    return NextResponse.json(
      { error: "Unable to load shipping settings." },
      { status: 500 },
    );
  }
}
