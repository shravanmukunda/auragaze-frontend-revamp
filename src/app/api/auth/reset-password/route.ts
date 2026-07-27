import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { token, password } = body as Record<string, unknown>;
    const resetToken = typeof token === "string" ? token.trim() : "";

    if (!resetToken) {
      return NextResponse.json(
        { error: "Reset link is invalid or expired." },
        { status: 400 },
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters." },
        { status: 400 },
      );
    }

    const email = await consumeAuthToken("reset", resetToken);
    if (!email) {
      return NextResponse.json(
        { error: "Reset link is invalid or expired." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await prisma.user.updateMany({
      where: { email, password: { not: null } },
      data: {
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Unable to reset password for this account." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    console.error("Reset password failed", error);
    return NextResponse.json(
      { error: "Unable to reset your password right now." },
      { status: 500 },
    );
  }
}
