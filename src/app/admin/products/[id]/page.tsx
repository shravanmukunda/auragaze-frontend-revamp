import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import { getAdminProduct } from "@/lib/admin-product-service";

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { id } = await params;
  const product = await getAdminProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
        >
          <ArrowLeft size={16} />
          Back to products
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--label-accent)]">
          Edit
        </p>
        <h1 className="font-heading text-3xl font-black tracking-tight">
          {product.name}
        </h1>
      </div>
      <ProductForm mode="edit" initialProduct={product} />
    </div>
  );
}
