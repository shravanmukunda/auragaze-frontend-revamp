import { prisma } from "@/lib/prisma";
import { mapProduct, productRelations } from "@/lib/product-mapper";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [{ id }, { slug: id }],
      },
      include: productRelations,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(mapProduct(product));
  } catch (error) {
    console.error("Failed to load product", error);
    return NextResponse.json(
      { error: "Unable to load product." },
      { status: 500 },
    );
  }
}
