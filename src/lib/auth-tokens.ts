import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export type AuthTokenPurpose = "verify" | "reset";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function identifierFor(purpose: AuthTokenPurpose, email: string) {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

export async function createAuthToken(
  purpose: AuthTokenPurpose,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = identifierFor(purpose, normalizedEmail);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumeAuthToken(
  purpose: AuthTokenPurpose,
  token: string,
) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (!record.identifier.startsWith(`${purpose}:`)) return null;
  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return null;
  }

  await prisma.verificationToken.delete({ where: { token } });

  return record.identifier.slice(purpose.length + 1);
}
