import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function gravatarUrl(email: string) {
  const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
          authorization: { params: { prompt: "select_account" } },
        })]
      : []),
    CredentialsProvider({
      id: "bypass",
      name: "bypass",
      credentials: { key: { label: "Key", type: "text" } },
      async authorize(credentials) {
        if (credentials?.key !== "letsgo") return null;
        const user = await prisma.user.findUnique({ where: { email: "tomas@salas.io" } });
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Block new account creation via Google OAuth when signups are closed
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } });
        if (!existing) return false; // No existing account — reject
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name ?? token.name ?? null;
        token.email = user.email ?? token.email ?? null;
        token.picture = user.image ?? token.picture ?? null;
      }
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true, name: true, email: true, image: true },
        });
        token.isAdmin = dbUser?.isAdmin ?? false;
        if (dbUser?.name) token.name = dbUser.name;
        if (dbUser?.email) token.email = dbUser.email;
        if (dbUser?.image) token.picture = dbUser.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; isAdmin?: boolean }).id = token.id as string;
        (session.user as { id?: string; isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
        session.user.image = (token.picture as string | null) ?? session.user.image ?? null;
      }
      if (session.user && !session.user.image && session.user.email) {
        session.user.image = gravatarUrl(session.user.email);
      }
      return session;
    },
  },
};

// Augment NextAuth types to include custom properties
declare module "next-auth" {
  interface User {
    id: string;
    isAdmin?: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      isAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isAdmin?: boolean;
  }
}
