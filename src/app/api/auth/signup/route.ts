import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SIGNUPS_OPEN = true;

export async function POST(req: NextRequest) {
  if (!SIGNUPS_OPEN) {
    return NextResponse.json({ error: "Signups are currently closed." }, { status: 403 });
  }

  try {
    const { firstName, lastName, email, password, confirmPassword, timezone } = await req.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const name = `${firstName.trim()} ${lastName.trim()}`;
    await prisma.user.create({
      data: { name, email, hashedPassword, timezone: timezone ?? null },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
