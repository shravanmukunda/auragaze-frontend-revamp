import { NextRequest, NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";
import { appOrigin } from "@/lib/mail";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const loginUrl = new URL("/login", appOrigin());

  if (!token) {
    loginUrl.searchParams.set("error", "InvalidVerification");
    return NextResponse.redirect(loginUrl);
  }

  const email = await consumeAuthToken("verify", token);
  if (!email) {
    loginUrl.searchParams.set("error", "InvalidVerification");
    return NextResponse.redirect(loginUrl);
  }

  await prisma.user.updateMany({
    where: { email },
    data: { emailVerified: new Date() },
  });

  loginUrl.searchParams.set("verified", "true");
  loginUrl.searchParams.set("email", email);
  return NextResponse.redirect(loginUrl);
}
