"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function callbackFrom(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/profile";
}

function authErrorMessage(code: string | null) {
  switch (code) {
    case "OAuthAccount":
      return "This account uses Google Sign-In.";
    case "EmailNotVerified":
      return "Verify your email before signing in. Check your inbox for the link.";
    case "TooManyAttempts":
      return "Too many attempts. Try again later.";
    case "OAuthAccountNotLinked":
      return "This email is already registered. Sign in with your usual method.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Google sign-in failed. Try again or use email and password.";
    case "InvalidVerification":
      return "That verification link is invalid or expired.";
    case "Configuration":
      return "Sign-in is not configured yet. Ask the store admin to finish setup.";
    default:
      return code ? "Unable to sign in. Please try again." : "";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(
    authErrorMessage(searchParams.get("error")),
  );
  const [submitting, setSubmitting] = useState(false);
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
      const hintResponse = await fetch("/api/auth/login-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const hint = (await hintResponse.json()) as { error?: string };

      if (!hintResponse.ok) {
        setError(
          authErrorMessage(hint.error ?? null) ||
            "Email or password is incorrect.",
        );
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(
          authErrorMessage(result?.error ?? null) ||
            "Email or password is incorrect.",
        );
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Member access"
      title="Welcome back"
      description="Sign in to manage your cart, orders, and upcoming drops."
    >
      <div className="space-y-4">
        {searchParams.get("verified") === "true" && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            Email verified. You can sign in now.
          </p>
        )}

        {searchParams.get("reset") === "true" && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            Password updated. Sign in with your new password.
          </p>
        )}

        {searchParams.get("registered") === "true" && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            Account created. Check your email to verify before signing in.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500"
          >
            {error}
          </p>
        )}

        <GoogleSignInButton callbackUrl={callbackUrl} />

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <span className="h-px flex-1 bg-(--border)" />
          or
          <span className="h-px flex-1 bg-(--border)" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">Password</span>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold label-accent"
              >
                Forgot password?
              </Link>
            </div>
            <span className="relative block">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-(--border) bg-background py-3 pl-10 pr-11 text-sm outline-none transition focus:border-blue-500"
                placeholder="Your password"
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to AURAGAZE?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold label-accent"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
