import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import type { AuthOptions } from "next-auth";
import { rateLimit } from "./rate-limit";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const ROLE_REFRESH_MS = 5 * 60 * 1000;

function headerValue(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  name: string,
) {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name) ?? undefined;
  }
  const value = (headers as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? value[0] : value;
}

const providers: AuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  Credentials({
    credentials: {
      email: {},
      password: {},
    },

    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = String(credentials.email).trim().toLowerCase();
      const forwarded = headerValue(req?.headers, "x-forwarded-for");
      const realIp = headerValue(req?.headers, "x-real-ip");
      const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

      const limited = rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
      if (!limited.ok) return null;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      if (!user.password) {
        throw new Error("OAuthAccount");
      }

      if (!user.emailVerified) {
        throw new Error("EmailNotVerified");
      }

      const validPassword = await bcrypt.compare(
        String(credentials.password),
        user.password,
      );

      if (!validPassword) return null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        image: user.image,
      };
    },
  }),
);

export const authConfig: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },

  jwt: {
    maxAge: SESSION_MAX_AGE,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers,

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.updateMany({
          where: {
            email: user.email.toLowerCase(),
            emailVerified: null,
          },
          data: {
            emailVerified: new Date(),
            ...(user.image ? { image: user.image } : {}),
            ...(user.name ? { name: user.name } : {}),
          },
        });
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        if ("role" in user && user.role) {
          token.role = user.role;
        } else if (user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "CUSTOMER";
        } else {
          token.role = "CUSTOMER";
        }
        token.roleCheckedAt = Date.now();
        return token;
      }

      const shouldRefresh =
        trigger === "update" ||
        typeof token.roleCheckedAt !== "number" ||
        Date.now() - token.roleCheckedAt > ROLE_REFRESH_MS;

      if (shouldRefresh && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
        }
        token.roleCheckedAt = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
      }

      return session;
    },
  },
};
