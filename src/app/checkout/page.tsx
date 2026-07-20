"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import RemoteImage from "@/components/RemoteImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoaderCircle, MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import PromoCodeForm from "@/components/PromoCodeForm";
import { useCart } from "@/context/CartContext";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/data";
import { setStoredPromoCode, getStoredPromoCode } from "@/lib/promo-storage";
import { formatPrice, cn } from "@/lib/utils";
import type { SavedAddress } from "@/types/address";
import type { ShippingAddress } from "@/types/order";

const inputClassName =
  "w-full rounded-xl border border-(--border) bg-background py-3 px-4 text-sm outline-none transition focus:border-blue-500";

export default function CheckoutPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [error, setError] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [form, setForm] = useState<ShippingAddress>({
    name: "",
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/addresses");
        const data = (await response.json()) as { addresses?: SavedAddress[] };
        if (!active) return;
        const addresses = data.addresses ?? [];
        setSavedAddresses(addresses);
        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      } catch {
        if (active) setSavedAddresses([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.name) {
      setForm((current) => ({
        ...current,
        name: current.name || session.user.name || "",
      }));
    }
  }, [session?.user?.name, status]);

  useEffect(() => {
    if (selectedAddressId === "new") return;
    const address = savedAddresses.find((item) => item.id === selectedAddressId);
    if (!address) return;

    setForm((current) => ({
      ...current,
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phone,
    }));
    setSaveAddress(false);
  }, [savedAddresses, selectedAddressId]);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal + shipping - promoDiscount);
  const hasItems = items.length > 0;

  const disabled = useMemo(
    () => submitting || !hasItems || status !== "authenticated",
    [submitting, hasItems, status],
  );

  useEffect(() => {
    if (checkoutComplete) return;
    if (hydrated && !hasItems && status === "authenticated") {
      router.replace("/cart");
    }
  }, [checkoutComplete, hasItems, hydrated, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: form,
          saveAddress,
          promoCode: promoCode ?? getStoredPromoCode() ?? undefined,
        }),
      });

      const data = (await res.json()) as { orderId?: string; error?: string };
      if (!res.ok || !data.orderId) {
        const message = data.error ?? "Unable to place order. Try again.";
        setError(message);
        toast.error(message);
        return;
      }

      setCheckoutComplete(true);
      setStoredPromoCode(null);
      toast.success("Order placed successfully.");
      router.replace(`/orders/confirmation/${data.orderId}`);
      void clearCart({ silent: true });
    } catch {
      const message = "Unable to place order. Try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin label-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <TopBar title="Checkout" />

      <div className="mx-auto max-w-lg px-4 pt-16">
        {!hasItems ? (
          <div className="py-20 text-center">
            <p className="mb-4 text-sm text-muted">Your cart is empty.</p>
            <Link href="/shop" className="btn-gradient rounded-xl px-5 py-3 text-sm font-bold">
              Continue shopping
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="surface-card rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-2">
                <MapPin size={18} className="label-accent" />
                <h2 className="font-bold text-sm">Delivery address</h2>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {savedAddresses.map((address) => (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                        selectedAddressId === address.id
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-(--border) bg-background",
                      )}
                    >
                      <p className="font-semibold">{address.label}</p>
                      <p className="mt-1 text-xs text-muted">
                        {address.line1}, {address.city}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddressId("new");
                      setSaveAddress(true);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                      selectedAddressId === "new"
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-(--border) bg-background",
                    )}
                  >
                    Use a new address
                  </button>
                </div>
              ) : null}

              <div className="space-y-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-muted">
                    Full name
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="Recipient name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-muted">
                    Address line 1
                  </span>
                  <input
                    required
                    value={form.line1}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, line1: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="House no., street, area"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-muted">
                    Address line 2 (optional)
                  </span>
                  <input
                    value={form.line2 ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, line2: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="Landmark, apartment, etc."
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-muted">
                      City
                    </span>
                    <input
                      required
                      value={form.city}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, city: event.target.value }))
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-muted">
                      State
                    </span>
                    <input
                      required
                      value={form.state}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, state: event.target.value }))
                      }
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-muted">
                      Postal code
                    </span>
                    <input
                      required
                      inputMode="numeric"
                      pattern="\d{6}"
                      value={form.postalCode}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          postalCode: event.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      className={inputClassName}
                      placeholder="6 digits"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-muted">
                      Phone
                    </span>
                    <input
                      required
                      inputMode="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      className={inputClassName}
                      placeholder="+91..."
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(event) => setSaveAddress(event.target.checked)}
                    className="rounded border-(--border)"
                    disabled={selectedAddressId !== "new"}
                  />
                  Save this address for next time
                </label>
              </div>
            </section>

            <section className="surface-card rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-2">
                <Package size={18} className="label-accent" />
                <h2 className="font-bold text-sm">Order items</h2>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="relative h-16 w-14 flex-none overflow-hidden rounded-xl">
                      <RemoteImage
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold">{item.productName}</p>
                      <p className="text-xs text-muted">
                        Size {item.size} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="surface-card rounded-2xl p-4">
              <h2 className="mb-3 font-bold text-sm">Promo code</h2>
              <PromoCodeForm
                subtotal={subtotal}
                compact
                withinForm
                onApplied={(promo) => {
                  setPromoDiscount(promo?.discount ?? 0);
                  setPromoCode(promo?.code ?? null);
                }}
              />
            </section>

            <section className="surface-card rounded-2xl p-4">
              <div className="mb-4 flex items-center gap-2">
                <Truck size={18} className="label-accent" />
                <h2 className="font-bold text-sm">Payment & shipping</h2>
              </div>
              <div className="rounded-xl border border-(--border) bg-background px-4 py-3 text-sm">
                <p className="font-semibold">Cash on Delivery</p>
                <p className="text-xs text-muted">Pay when your order arrives.</p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {promoDiscount > 0 ? (
                  <div className="flex justify-between text-emerald-600">
                    <span>Promo{promoCode ? ` (${promoCode})` : ""}</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                ) : null}
                <div
                  className="flex justify-between border-t border-(--border) pt-2 font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="btn-gradient flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <LoaderCircle size={18} className="animate-spin" />}
              {submitting ? "Placing order…" : `Place order · ${formatPrice(total)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
