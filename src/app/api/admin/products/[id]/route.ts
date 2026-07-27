import { requireAdmin } from "@/lib/admin-auth";
import {
  deactivateAdminProduct,
  getAdminProduct,
  parseAdminProductInput,
  setAdminProductActive,
  updateAdminProduct,
} from "@/lib/admin-product-service";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const product = await getAdminProduct(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to load admin product", error);
    return NextResponse.json(
      { error: "Unable to load product." },
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

  if (body && typeof body === "object" && "isActive" in body) {
    const record = body as { isActive?: unknown };
    if (typeof record.isActive === "boolean" && Object.keys(record).length === 1) {
      try {
        const product = await setAdminProductActive(id, record.isActive);
        return NextResponse.json(product);
      } catch {
        return NextResponse.json({ error: "Product not found." }, { status: 404 });
      }
    }
  }

  const parsed = parseAdminProductInput(body);
  if (parsed.error || !parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await updateAdminProduct(id, parsed.data);
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error(`Failed to update product ${id}`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A variant SKU already exists." },
          { status: 409 },
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error:
              "One of the variants no longer exists. Refresh the page and try again.",
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const product = await deactivateAdminProduct(id);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}
