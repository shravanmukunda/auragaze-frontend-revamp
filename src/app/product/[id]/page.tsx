import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/ProductPageClient";
import { prisma } from "@/lib/prisma";
import { mapProduct, productRelations } from "@/lib/product-mapper";
import { appOrigin } from "@/lib/mail";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ id }, { slug: id }],
    },
    include: productRelations,
  });
  return product ? mapProduct(product) : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);

  if (!product) {
    return {
      title: "Product not found · AURAGAZE",
    };
  }

  const title = product.name;
  const description =
    product.description?.slice(0, 160) ||
    `${product.name} by ${product.brand} — premium streetwear from AURAGAZE.`;
  const url = `${appOrigin()}/product/${product.slug || product.id}`;
  const image = product.image;

  return {
    title,
    description,
    openGraph: {
      title: `${product.name} · AURAGAZE`,
      description,
      type: "website",
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · AURAGAZE`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images,
            brand: { "@type": "Brand", name: product.brand },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: product.price,
              availability:
                product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
      <ProductPageClient id={id} />
    </>
  );
}
