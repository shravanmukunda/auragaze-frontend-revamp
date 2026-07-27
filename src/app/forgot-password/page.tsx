"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Mail } from "lucide-react";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Unable to send a reset email right now.");
        return;
      }

      setSent(true);
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title="Forgot password"
      description="Enter your email and we will send a reset link if an account exists."
    >
      {sent ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            If an account exists for that email, a reset link is on the way. It
            expires in one hour.
          </p>
          <p className="text-center text-sm text-muted">
            <Link href="/login" className="font-bold label-accent">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
            >
              {error}
            </p>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <span className="relative block">
              <Mail
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                placeholder="you@example.com"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoaderCircle size={17} className="animate-spin" />}
            {submitting ? "Sending…" : "Send reset link"}
          </button>

          <p className="text-center text-sm text-muted">
            <Link href="/login" className="font-bold label-accent">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}
