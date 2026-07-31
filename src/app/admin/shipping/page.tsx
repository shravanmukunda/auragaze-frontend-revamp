"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { ShippingSettings } from "@/types/admin-settings";
import { formatPrice } from "@/lib/utils";

export default function AdminShippingSettingsPage() {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [shippingFee, setShippingFee] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/admin/settings/shipping");
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error ?? "Unable to load shipping settings.");
          return;
        }
        if (!active) return;
        setSettings(data);
        setShippingFee(String(data.shippingFee));
        setFreeShippingThreshold(String(data.freeShippingThreshold));
      } catch {
        toast.error("Unable to load shipping settings.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings/shipping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: Number(shippingFee),
          freeShippingThreshold: Number(freeShippingThreshold),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to save shipping settings.");
        return;
      }
      setSettings(data);
      toast.success("Shipping settings saved.");
    } catch {
      toast.error("Unable to save shipping settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--muted)]">
        <LoaderCircle size={16} className="animate-spin" />
        Loading shipping settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--label-accent)]">
          Store
        </p>
        <h1 className="font-heading text-3xl font-black tracking-tight">
          Shipping
        </h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--muted-strong)]">
          Flat shipping fee and free-shipping threshold applied at cart and
          checkout.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="surface-card max-w-lg space-y-4 rounded-2xl p-5"
      >
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">Shipping fee (₹)</span>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={shippingFee}
            onChange={(event) => setShippingFee(event.target.value)}
            className="admin-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-semibold">Free shipping threshold (₹)</span>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={freeShippingThreshold}
            onChange={(event) => setFreeShippingThreshold(event.target.value)}
            className="admin-input"
          />
        </label>

        {settings ? (
          <p className="text-xs text-[var(--muted)]">
            Current: {formatPrice(settings.shippingFee)} shipping · free over{" "}
            {formatPrice(settings.freeShippingThreshold)}
          </p>
        ) : null}

        <button type="submit" disabled={saving} className="admin-button-primary">
          {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
          Save shipping
        </button>
      </form>
    </div>
  );
}
