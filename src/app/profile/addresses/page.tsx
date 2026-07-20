"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import type { AddressInput, SavedAddress } from "@/types/address";
import { cn } from "@/lib/utils";

const emptyForm: AddressInput = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

const inputClassName =
  "w-full rounded-xl border border-(--border) bg-background py-3 px-4 text-sm outline-none transition focus:border-blue-500";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddressInput>(emptyForm);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/addresses");
      const data = (await response.json()) as { addresses?: SavedAddress[] };
      setAddresses(data.addresses ?? []);
    } catch {
      setAddresses([]);
      toast.error("Unable to load addresses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setShowForm(true);
  }

  function startEdit(address: SavedAddress) {
    setEditingId(address.id);
    setForm({
      label: address.label,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        editingId ? `/api/addresses/${editingId}` : "/api/addresses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to save address.");
        return;
      }

      toast.success(editingId ? "Address updated." : "Address saved.");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadAddresses();
    } catch {
      toast.error("Unable to save address.");
    } finally {
      setSubmitting(false);
    }
  }

  async function setDefault(addressId: string) {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Unable to update default address.");
        return;
      }
      toast.success("Default address updated.");
      await loadAddresses();
    } catch {
      toast.error("Unable to update default address.");
    }
  }

  async function removeAddress(addressId: string) {
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Unable to delete address.");
        return;
      }
      toast.success("Address deleted.");
      await loadAddresses();
    } catch {
      toast.error("Unable to delete address.");
    }
  }

  return (
    <div className="min-h-screen pb-6">
      <TopBar title="Addresses" />

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-16">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Manage delivery addresses for checkout.</p>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-(--border) px-3 py-2 text-xs font-semibold"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="surface-card space-y-3 rounded-2xl p-4">
            <h2 className="font-bold text-sm">
              {editingId ? "Edit address" : "New address"}
            </h2>
            <input
              required
              value={form.label}
              onChange={(event) =>
                setForm((current) => ({ ...current, label: event.target.value }))
              }
              className={inputClassName}
              placeholder="Label (Home, Work)"
            />
            <input
              required
              value={form.line1}
              onChange={(event) =>
                setForm((current) => ({ ...current, line1: event.target.value }))
              }
              className={inputClassName}
              placeholder="Address line 1"
            />
            <input
              value={form.line2 ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, line2: event.target.value }))
              }
              className={inputClassName}
              placeholder="Address line 2 (optional)"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({ ...current, city: event.target.value }))
                }
                className={inputClassName}
                placeholder="City"
              />
              <input
                required
                value={form.state}
                onChange={(event) =>
                  setForm((current) => ({ ...current, state: event.target.value }))
                }
                className={inputClassName}
                placeholder="State"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                placeholder="Postal code"
              />
              <input
                required
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className={inputClassName}
                placeholder="Phone"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
              />
              Set as default address
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 rounded-xl border border-(--border) py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
              >
                {submitting && <LoaderCircle size={16} className="animate-spin" />}
                Save
              </button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <LoaderCircle size={18} className="animate-spin" />
            Loading addresses…
          </div>
        ) : addresses.length === 0 ? (
          <div className="surface-card rounded-2xl p-8 text-center">
            <MapPin size={28} className="mx-auto mb-3 label-accent" />
            <p className="font-semibold">No saved addresses</p>
            <p className="mt-1 text-sm text-muted">
              Add one to speed up checkout next time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="surface-card rounded-2xl p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{address.label}</p>
                    {address.isDefault ? (
                      <span className="mt-1 inline-flex rounded-full bg-(--primary-muted) px-2 py-0.5 text-[10px] font-semibold label-accent">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    className="rounded-lg p-2 text-rose-500"
                    aria-label="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-muted-strong">{address.line1}</p>
                {address.line2 ? (
                  <p className="text-sm text-muted-strong">{address.line2}</p>
                ) : null}
                <p className="text-sm text-muted-strong">
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="mt-1 text-sm text-muted">{address.phone}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(address)}
                    className="rounded-xl border border-(--border) px-3 py-2 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      onClick={() => setDefault(address.id)}
                      className={cn(
                        "rounded-xl border border-(--border) px-3 py-2 text-xs font-semibold",
                      )}
                    >
                      Make default
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/profile" className="block text-center text-sm font-semibold label-accent">
          Back to profile
        </Link>
      </div>
    </div>
  );
}
