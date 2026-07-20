import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminNewProductPage() {
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
          Create
        </p>
        <h1 className="font-heading text-3xl font-black tracking-tight">
          New product
        </h1>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
