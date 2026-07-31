import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getShippingSettings,
  parseShippingSettingsInput,
  SettingsError,
  updateShippingSettings,
} from "@/lib/shipping-settings";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const settings = await getShippingSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to load admin shipping settings", error);
    return NextResponse.json(
      { error: "Unable to load shipping settings." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseShippingSettingsInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const settings = await updateShippingSettings(parsed.data);
    return NextResponse.json(settings);
  } catch (error) {
    if (error instanceof SettingsError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Failed to update shipping settings", error);
    return NextResponse.json(
      { error: "Unable to update shipping settings." },
      { status: 500 },
    );
  }
}
