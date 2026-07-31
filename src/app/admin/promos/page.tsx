"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminPromo, AdminPromoInput } from "@/types/admin-settings";
import { cn, formatPrice } from "@/lib/utils";

const emptyForm: AdminPromoInput = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderAmount: 0,
  maxDiscount: null,
  isActive: true,
  usageLimit: null,
  expiresAt: null,
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<AdminPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminPromoInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const loadPromos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());

    try {
      const response = await fetch(`/api/admin/promos?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to load promo codes.");
        setPromos([]);
        return;
      }
      setPromos(data);
    } catch {
      toast.error("Unable to load promo codes.");
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPromos();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadPromos]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(promo: AdminPromo) {
    setEditingId(promo.id);
    setForm({
      code: promo.code,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      minOrderAmount: promo.minOrderAmount,
      maxDiscount: promo.maxDiscount,
      isActive: promo.isActive,
      usageLimit: promo.usageLimit,
      expiresAt: promo.expiresAt,
    });
    setShowForm(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      description: form.description || null,
      maxDiscount: form.maxDiscount ?? null,
      usageLimit: form.usageLimit ?? null,
      expiresAt: form.expiresAt || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/admin/promos/${editingId}` : "/api/admin/promos",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to save promo code.");
        return;
      }
      toast.success(editingId ? "Promo updated." : "Promo created.");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadPromos();
    } catch {
      toast.error("Unable to save promo code.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(promo: AdminPromo) {
    try {
      const response = await fetch(`/api/admin/promos/${promo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to update promo.");
        return;
      }
      setPromos((current) =>
        current.map((item) => (item.id === promo.id ? data : item)),
      );
      toast.success(data.isActive ? "Promo activated." : "Promo deactivated.");
    } catch {
      toast.error("Unable to update promo.");
    }
  }

  async function removePromo(promo: AdminPromo) {
    if (!window.confirm(`Delete promo ${promo.code}?`)) return;
    try {
      const response = await fetch(`/api/admin/promos/${promo.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Unable to delete promo.");
        return;
      }
      toast.success("Promo deleted.");
      setPromos((current) => current.filter((item) => item.id !== promo.id));
    } catch {
      toast.error("Unable to delete promo.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--label-accent)]">
            Marketing
          </p>
          <h1 className="font-heading text-3xl font-black tracking-tight">
            Promo codes
          </h1>
        </div>
        <button type="button" onClick={startCreate} className="admin-button-primary">
          <Plus size={16} />
          New promo
        </button>
      </div>

      <div className="surface-card rounded-2xl p-4">
        <label className="relative block max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by code or description"
            className="admin-input pl-9"
          />
        </label>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="surface-card space-y-4 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold">
              {editingId ? "Edit promo" : "Create promo"}
            </h2>
            <button
              type="button"
              className="admin-button-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Code</span>
              <input
                required
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Type</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as AdminPromoInput["type"],
                  }))
                }
                className="admin-input"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">
                Value {form.type === "PERCENTAGE" ? "(%)" : "(₹)"}
              </span>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    value: Number(event.target.value),
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Min order (₹)</span>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderAmount: Number(event.target.value),
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Max discount (₹, optional)</span>
              <input
                type="number"
                min={0}
                value={form.maxDiscount ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxDiscount:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Usage limit (optional)</span>
              <input
                type="number"
                min={1}
                value={form.usageLimit ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usageLimit:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="font-semibold">Description</span>
              <input
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Expires at (optional)</span>
              <input
                type="datetime-local"
                value={toDatetimeLocal(form.expiresAt ?? null)}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : null,
                  }))
                }
                className="admin-input"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>

          <button type="submit" disabled={saving} className="admin-button-primary">
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {editingId ? "Save changes" : "Create promo"}
          </button>
        </form>
      )}

      <div className="surface-card overflow-x-auto rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--muted)]">
            <LoaderCircle size={16} className="animate-spin" />
            Loading promo codes…
          </div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--muted)]">
            No promo codes yet.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <div className="font-semibold">{promo.code}</div>
                    {promo.description ? (
                      <div className="text-xs text-[var(--muted)]">
                        {promo.description}
                      </div>
                    ) : null}
                  </td>
                  <td>{promo.type === "PERCENTAGE" ? "Percent" : "Fixed"}</td>
                  <td>
                    {promo.type === "PERCENTAGE"
                      ? `${promo.value}%`
                      : formatPrice(promo.value)}
                    {promo.maxDiscount != null
                      ? ` · max ${formatPrice(promo.maxDiscount)}`
                      : ""}
                  </td>
                  <td>
                    {promo.usedCount}
                    {promo.usageLimit != null ? ` / ${promo.usageLimit}` : ""}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        promo.isActive
                          ? "bg-[var(--primary-muted)] text-[var(--label-accent)]"
                          : "bg-[var(--surface-hover)] text-[var(--muted)]",
                      )}
                    >
                      {promo.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => startEdit(promo)}
                        aria-label={`Edit ${promo.code}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-button-secondary"
                        onClick={() => void toggleActive(promo)}
                      >
                        {promo.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button"
                        onClick={() => void removePromo(promo)}
                        aria-label={`Delete ${promo.code}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
