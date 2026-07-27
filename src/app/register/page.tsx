"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import AuthCard from "@/components/AuthCard";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function callbackFrom(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const callbackUrl = callbackFrom(searchParams.get("callbackUrl"));

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        needsVerification?: boolean;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create your account.");
        return;
      }

      setNeedsVerification(true);
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (needsVerification) {
    return (
      <AuthCard
        eyebrow="Check your inbox"
        title="Verify your email"
        description="We sent a confirmation link. Verify your email, then sign in to continue."
      >
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          Link sent to <span className="font-semibold">{email.trim()}</span>. It
          expires in one hour.
        </p>
        <p className="mt-6 text-center text-sm text-muted">
          Ready to sign in?{" "}
          <Link
            href={`/login?email=${encodeURIComponent(email.trim().toLowerCase())}&callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-bold label-accent"
          >
            Go to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="Join the drop"
      title="Create account"
      description="Save your cart, track orders, and get first access to new releases."
    >
      <div className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
          >
            {error}
          </p>
        )}

        <GoogleSignInButton
          callbackUrl={callbackUrl}
          label="Continue with Google"
        />

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <span className="h-px flex-1 bg-(--border)" />
          or
          <span className="h-px flex-1 bg-(--border)" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Name</span>
            <span className="relative block">
              <UserRound
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
                placeholder="Your name"
              />
            </span>
          </label>

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

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Password</span>
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500"
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

          <button
            type="submit"
            disabled={submitting || status === "loading"}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <LoaderCircle size={17} className="animate-spin" />}
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold label-accent"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
