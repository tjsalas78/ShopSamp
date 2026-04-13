import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/resend";
import { generateToken, getTokenExpiry } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = generateToken();
    const expires = getTokenExpiry(1);

    await prisma.passwordResetToken.create({ data: { email, token, expires } });

    const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
    await sendPasswordResetEmail(email, token, baseUrl);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
