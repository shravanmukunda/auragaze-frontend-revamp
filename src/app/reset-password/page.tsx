"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import AuthCard from "@/components/AuthCard";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(
    token ? "" : "Reset link is invalid or missing.",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to reset your password.");
        return;
      }

      router.replace("/login?reset=true");
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Pick a strong password you have not used here before."
    >
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
          <span className="mb-2 block text-sm font-semibold">New password</span>
          <span className="relative block">
            <LockKeyhole
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={!token}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Confirm password
          </span>
          <span className="relative block">
            <LockKeyhole
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type={showPassword ? "text" : "password"}
              name="confirm"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={!token}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 disabled:opacity-60"
              placeholder="Repeat password"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || !token}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <LoaderCircle size={17} className="animate-spin" />}
          {submitting ? "Updating…" : "Update password"}
        </button>

        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-bold label-accent">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
