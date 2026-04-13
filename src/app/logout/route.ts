import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const isSecure = process.env.NODE_ENV === "production";

  const cookiesToClear = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Secure-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "impersonating",
  ];

  // Try to delete DB session for both cookie variants
  for (const name of ["next-auth.session-token", "__Secure-next-auth.session-token"]) {
    const token = req.cookies.get(name)?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { sessionToken: token } }).catch(() => {});
    }
  }

  const res = NextResponse.redirect(new URL("/login", req.url));

  for (const name of cookiesToClear) {
    const secure = name.startsWith("__Secure-") || isSecure;
    // Set expired cookie with matching attributes to force browser to clear it
    res.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
  }

  return res;
}
