import { NextResponse } from "next/server";
import {
  AddressError,
  deleteUserAddress,
  parseAddressInput,
  setDefaultAddress,
  updateUserAddress,
} from "@/lib/address-service";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body && typeof body === "object" && "isDefault" in body) {
    const record = body as { isDefault?: unknown };
    if (record.isDefault === true && Object.keys(record).length === 1) {
      try {
        const address = await setDefaultAddress(user.id, id);
        return NextResponse.json(address);
      } catch (error) {
        if (error instanceof AddressError) {
          return NextResponse.json(
            { error: error.message },
            { status: error.status },
          );
        }
        return NextResponse.json(
          { error: "Unable to update address." },
          { status: 500 },
        );
      }
    }
  }

  const parsed = parseAddressInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const address = await updateUserAddress(user.id, id, parsed.data);
    return NextResponse.json(address);
  } catch (error) {
    if (error instanceof AddressError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to update address", error);
    return NextResponse.json(
      { error: "Unable to update address." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await context.params;

  try {
    await deleteUserAddress(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AddressError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to delete address", error);
    return NextResponse.json(
      { error: "Unable to delete address." },
      { status: 500 },
    );
  }
}
