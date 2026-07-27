import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth-tokens";
import { appOrigin, sendMail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { name, email, password } = body as Record<string, unknown>;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return NextResponse.json(
        { error: "Name must be between 2 and 80 characters." },
        { status: 400 },
      );
    }

    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
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

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null,
      },
    });

    const token = await createAuthToken("verify", normalizedEmail);
    const verifyUrl = `${appOrigin()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Verify your AURAGAZE account",
        html: `
          <p>Hi ${normalizedName},</p>
          <p>Confirm your email to finish creating your AURAGAZE account.</p>
          <p><a href="${verifyUrl}">Verify email</a></p>
          <p>This link expires in one hour. If you did not sign up, you can ignore this message.</p>
        `,
      });
    } catch (mailError) {
      console.error("Verification email failed", mailError);
      await prisma.user
        .delete({ where: { email: normalizedEmail } })
        .catch(() => {});
      return NextResponse.json(
        {
          error:
            "Account created but we could not send a verification email. Check SMTP settings and try again.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { ok: true, needsVerification: true },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    console.error("Registration failed", error);
    return NextResponse.json(
      { error: "Unable to create your account right now." },
      { status: 500 },
    );
  }
}
