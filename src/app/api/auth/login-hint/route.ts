import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`login-hint:${ip}`, 20, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "TooManyAttempts" },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "InvalidCredentials" }, { status: 400 });
    }

    const { email, password } = body as Record<string, unknown>;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(normalizedEmail) || typeof password !== "string") {
      return NextResponse.json({ error: "InvalidCredentials" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { password: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "InvalidCredentials" }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({ error: "OAuthAccount" }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "EmailNotVerified" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "InvalidCredentials" }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "InvalidCredentials" }, { status: 400 });
    }
    console.error("Login hint failed", error);
    return NextResponse.json({ error: "InvalidCredentials" }, { status: 500 });
  }
}
