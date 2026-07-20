import { NextResponse } from "next/server";
import {
  AddressError,
  createUserAddress,
  listUserAddresses,
  parseAddressInput,
} from "@/lib/address-service";
import { getSessionUser } from "@/lib/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const addresses = await listUserAddresses(user.id);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Failed to list addresses", error);
    return NextResponse.json(
      { error: "Unable to load addresses." },
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

  const parsed = parseAddressInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const address = await createUserAddress(user.id, parsed.data);
    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    if (error instanceof AddressError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to create address", error);
    return NextResponse.json(
      { error: "Unable to save address." },
      { status: 500 },
    );
  }
}
