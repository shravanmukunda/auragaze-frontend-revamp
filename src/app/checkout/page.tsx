"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import RemoteImage from "@/components/RemoteImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CreditCard, LoaderCircle, MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import PromoCodeForm from "@/components/PromoCodeForm";
import { useCart } from "@/context/CartContext";
import { useShippingSettings } from "@/context/ShippingSettingsContext";
import { setStoredPromoCode, getStoredPromoCode } from "@/lib/promo-storage";
import { loadRazorpayCheckoutScript } from "@/lib/razorpay-checkout";
import { formatPrice, cn } from "@/lib/utils";
import type { SavedAddress } from "@/types/address";
import type { ShippingAddress } from "@/types/order";

const inputClassName =
  "w-full rounded-xl border border-(--border) bg-background py-3 px-4 text-sm outline-none transition focus:border-blue-500";

type PaymentMethod = "cod" | "razorpay";

export default function CheckoutPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const { items, subtotal, hydrated, clearCart } = useCart();
  const { shippingFee, freeShippingThreshold } = useShippingSettings();
  const [submitting, setSubmitting] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [error, setError] = useState("");
  const [saveAddress, setSaveAddress] = useState(true);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
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
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/payments/razorpay/status");
        const data = (await response.json()) as { enabled?: boolean };
        if (!active) return;
        const enabled = Boolean(data.enabled);
        setRazorpayEnabled(enabled);
        if (!enabled) setPaymentMethod("cod");
      } catch {
        if (active) {
          setRazorpayEnabled(false);
          setPaymentMethod("cod");
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const total = Math.max(0, subtotal + shipping - promoDiscount);
  const hasItems = items.length > 0;
  const activePromoCode = promoCode ?? getStoredPromoCode() ?? undefined;

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

  async function completeCheckout(orderId: string) {
    setCheckoutComplete(true);
    setStoredPromoCode(null);
    toast.success("Order placed successfully.");
    router.replace(`/orders/confirmation/${orderId}`);
    void clearCart({ silent: true });
  }

  async function placeCodOrder() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress: form,
        saveAddress,
        promoCode: activePromoCode,
      }),
    });

    const data = (await res.json()) as { orderId?: string; error?: string };
    if (!res.ok || !data.orderId) {
      throw new Error(data.error ?? "Unable to place order. Try again.");
    }

    await completeCheckout(data.orderId);
  }

  async function placeRazorpayOrder() {
    const createRes = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promoCode: activePromoCode }),
    });

    const createData = (await createRes.json()) as {
      razorpayOrderId?: string;
      amount?: number;
      currency?: string;
      keyId?: string;
      error?: string;
    };

    if (!createRes.ok || !createData.razorpayOrderId || !createData.keyId) {
      throw new Error(createData.error ?? "Unable to start payment. Try again.");
    }

    const { razorpayOrderId, keyId, amount, currency } = createData as {
      razorpayOrderId: string;
      keyId: string;
      amount: number;
      currency?: string;
    };

    const scriptLoaded = await loadRazorpayCheckoutScript();
    if (!scriptLoaded || !window.Razorpay) {
      throw new Error("Payment checkout failed to load. Try again.");
    }

    await new Promise<void>((resolve, reject) => {
      const checkoutPayload = {
        shippingAddress: form,
        saveAddress,
        promoCode: activePromoCode,
      };

      const razorpay = new window.Razorpay!({
        key: keyId,
        amount,
        currency: currency ?? "INR",
        name: "AURAGAZE",
        description: "T-shirt order",
        order_id: razorpayOrderId,
        prefill: {
          name: form.name,
          email: session?.user?.email ?? undefined,
          contact: form.phone.replace(/\D/g, "").slice(-10),
        },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...checkoutPayload,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = (await verifyRes.json()) as {
              orderId?: string;
              error?: string;
            };

            if (!verifyRes.ok || !verifyData.orderId) {
              reject(
                new Error(
                  verifyData.error ?? "Payment succeeded but order failed. Contact support.",
                ),
              );
              return;
            }

            await completeCheckout(verifyData.orderId);
            resolve();
          } catch (verifyError) {
            reject(
              verifyError instanceof Error
                ? verifyError
                : new Error("Payment verification failed"),
            );
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment was cancelled"));
          },
        },
      });

      razorpay.open();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (paymentMethod === "cod") {
        await placeCodOrder();
      } else {
        await placeRazorpayOrder();
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to place order. Try again.";
      if (message !== "Payment was cancelled") {
        setError(message);
        toast.error(message);
      }
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

  const submitLabel =
    paymentMethod === "razorpay"
      ? submitting
        ? "Processing payment…"
        : `Pay now · ${formatPrice(total)}`
      : submitting
        ? "Placing order…"
        : `Place order · ${formatPrice(total)}`;

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
                        width={160}
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
              <div className="space-y-2">
                {razorpayEnabled ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      paymentMethod === "razorpay"
                        ? "border-blue-500 bg-blue-500/5"
                        : "border-(--border) bg-background",
                    )}
                  >
                    <CreditCard size={18} className="mt-0.5 shrink-0 label-accent" />
                    <div>
                      <p className="font-semibold">Pay online</p>
                      <p className="text-xs text-muted">
                        UPI, cards, netbanking via Razorpay
                      </p>
                    </div>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition",
                    paymentMethod === "cod"
                      ? "border-blue-500 bg-blue-500/5"
                      : "border-(--border) bg-background",
                  )}
                >
                  <p className="font-semibold">Cash on Delivery</p>
                  <p className="text-xs text-muted">Pay when your order arrives.</p>
                </button>
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
              {submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
