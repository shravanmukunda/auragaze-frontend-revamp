"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_BADGES,
  ADMIN_CATEGORIES,
  ADMIN_SUBCATEGORIES,
  DEFAULT_SIZES,
  type AdminProduct,
  type AdminProductInput,
  type AdminProductVariantInput,
} from "@/types/admin-product";
import { cn, formatPrice } from "@/lib/utils";

interface ProductFormProps {
  mode: "create" | "edit";
  initialProduct?: AdminProduct;
}

function emptyVariant(): AdminProductVariantInput {
  return { size: "M", color: "", sku: "", stock: 10 };
}

function buildDefaultVariants(colors: string[], sizes: string[]) {
  const variants: AdminProductVariantInput[] = [];
  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        color,
        size,
        sku: "",
        stock: 10,
      });
    }
  }
  return variants;
}

export default function ProductForm({ mode, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [brand, setBrand] = useState(initialProduct?.brand ?? "AURAGAZE");
  const [description, setDescription] = useState(
    initialProduct?.description ?? "",
  );
  const [category, setCategory] = useState(
    initialProduct?.category ?? ADMIN_CATEGORIES[0].value,
  );
  const [subcategory, setSubcategory] = useState(
    initialProduct?.subcategory ?? ADMIN_SUBCATEGORIES[0].value,
  );
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : "",
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialProduct?.originalPrice ? String(initialProduct.originalPrice) : "",
  );
  const [badge, setBadge] = useState(initialProduct?.badge ?? "");
  const [featuresText, setFeaturesText] = useState(
    initialProduct?.features.join("\n") ?? "",
  );
  const [images, setImages] = useState<string[]>(
    initialProduct?.images.map((image) => image.imageUrl) ?? [""],
  );
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.isFeatured ?? false,
  );
  const [variants, setVariants] = useState<AdminProductVariantInput[]>(
    initialProduct?.variants.length
      ? initialProduct.variants
      : buildDefaultVariants(["Black", "White"], [...DEFAULT_SIZES]),
  );
  const [bulkColors, setBulkColors] = useState("Black, White");
  const [bulkSizes, setBulkSizes] = useState<string[]>([...DEFAULT_SIZES]);

  const totalStock = useMemo(
    () => variants.reduce((sum, variant) => sum + (variant.stock || 0), 0),
    [variants],
  );

  function updateVariant(
    index: number,
    field: keyof AdminProductVariantInput,
    value: string | number,
  ) {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index));
  }

  function addVariant() {
    setVariants((current) => [...current, emptyVariant()]);
  }

  function generateVariants() {
    const colors = bulkColors
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);
    const sizes = bulkSizes.filter(Boolean);
    if (colors.length === 0 || sizes.length === 0) {
      toast.error("Add at least one color and one size.");
      return;
    }
    setVariants(buildDefaultVariants(colors, sizes));
    toast.success(`Generated ${colors.length * sizes.length} variants.`);
  }

  function buildPayload(): AdminProductInput {
    return {
      name: name.trim(),
      brand: brand.trim(),
      description: description.trim(),
      category,
      subcategory,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      badge: badge ? (badge as AdminProductInput["badge"]) : null,
      features: featuresText
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
      images: images.map((image) => image.trim()).filter(Boolean),
      isActive,
      isFeatured,
      variants,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const payload = buildPayload();
    const endpoint =
      mode === "create"
        ? "/api/admin/products"
        : `/api/admin/products/${initialProduct?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Unable to save product.");
        setSubmitting(false);
        return;
      }

      toast.success(
        mode === "create" ? "Product created." : "Product updated.",
      );
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Unable to save product.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-heading text-lg font-bold">Basic information</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">Product name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="admin-input"
              placeholder="Midnight Aura Oversized Tee"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Brand</span>
            <input
              required
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="admin-input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Badge</span>
            <select
              value={badge}
              onChange={(event) => setBadge(event.target.value)}
              className="admin-input"
            >
              <option value="">None</option>
              {ADMIN_BADGES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="admin-input"
            >
              {ADMIN_CATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Subcategory</span>
            <select
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
              className="admin-input"
            >
              {ADMIN_SUBCATEGORIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="admin-input resize-y"
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-sm font-semibold">Features (one per line)</span>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(event) => setFeaturesText(event.target.value)}
              className="admin-input resize-y"
              placeholder={"100% premium cotton\nOversized fit\nPre-shrunk"}
            />
          </label>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <h2 className="font-heading text-lg font-bold">Pricing & status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Price (INR)</span>
            <input
              required
              type="number"
              min="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="admin-input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Original price</span>
            <input
              type="number"
              min="1"
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
              className="admin-input"
            />
          </label>
          <div className="flex items-end gap-6 pb-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) => setIsFeatured(event.target.checked)}
              />
              Featured
            </label>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">Images</h2>
          <button
            type="button"
            onClick={() => setImages((current) => [...current, ""])}
            className="admin-button-secondary"
          >
            <Plus size={16} />
            Add image URL
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {images.map((image, index) => (
            <div key={`image-${index}`} className="flex gap-2">
              <input
                value={image}
                onChange={(event) =>
                  setImages((current) =>
                    current.map((value, imageIndex) =>
                      imageIndex === index ? event.target.value : value,
                    ),
                  )
                }
                className="admin-input"
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() =>
                  setImages((current) =>
                    current.filter((_, imageIndex) => imageIndex !== index),
                  )
                }
                className="admin-icon-button"
                aria-label="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">Variants</h2>
            <p className="text-sm text-[var(--muted)]">
              {variants.length} variants · {totalStock} total units
            </p>
          </div>
          <button type="button" onClick={addVariant} className="admin-button-secondary">
            <Plus size={16} />
            Add row
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4">
          <p className="text-sm font-semibold">Bulk generate</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Colors (comma-separated)
              </span>
              <input
                value={bulkColors}
                onChange={(event) => setBulkColors(event.target.value)}
                className="admin-input"
              />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Sizes
              </span>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_SIZES.map((size) => {
                  const selected = bulkSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setBulkSizes((current) =>
                          selected
                            ? current.filter((value) => value !== size)
                            : [...current, size],
                        )
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        selected
                          ? "bg-[var(--label-accent)] text-white"
                          : "border border-[var(--border)] bg-[var(--surface)]",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={generateVariants}
            className="admin-button-secondary mt-3"
          >
            Generate variants
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Size</th>
                <th>SKU</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, index) => (
                <tr key={variant.id ?? `variant-${index}`}>
                  <td>
                    <input
                      required
                      value={variant.color}
                      onChange={(event) =>
                        updateVariant(index, "color", event.target.value)
                      }
                      className="admin-input"
                    />
                  </td>
                  <td>
                    <input
                      required
                      value={variant.size}
                      onChange={(event) =>
                        updateVariant(index, "size", event.target.value)
                      }
                      className="admin-input"
                    />
                  </td>
                  <td>
                    <input
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(index, "sku", event.target.value)
                      }
                      className="admin-input"
                      placeholder="Auto-generated if empty"
                    />
                  </td>
                  <td>
                    <input
                      required
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(event) =>
                        updateVariant(index, "stock", Number(event.target.value))
                      }
                      className="admin-input"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="admin-icon-button"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          {price ? `Listing price ${formatPrice(Number(price))}` : "Set a price to preview"}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="admin-button-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="admin-button-primary">
            {submitting && <LoaderCircle size={16} className="animate-spin" />}
            {mode === "create" ? "Create product" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
