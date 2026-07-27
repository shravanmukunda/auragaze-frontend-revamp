import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/auth-tokens";
import { appOrigin, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body: unknown = await req.json();
    const email =
      body &&
      typeof body === "object" &&
      typeof (body as { email?: unknown }).email === "string"
        ? (body as { email: string }).email.trim().toLowerCase()
        : "";

    // Always 200 to avoid email enumeration.
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { name: true, password: true, email: true },
    });

    if (user?.password) {
      const token = await createAuthToken("reset", email);
      const resetUrl = `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendMail({
          to: email,
          subject: "Reset your AURAGAZE password",
          html: `
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="${resetUrl}">Choose a new password</a></p>
            <p>This link expires in one hour. If you did not request a reset, you can ignore this message.</p>
          `,
        });
      } catch (mailError) {
        console.error("Password reset email failed", mailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json({ ok: true });
  }
}
