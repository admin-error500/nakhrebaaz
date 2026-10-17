import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { matchesCurrentPassword, verifyResetToken } from "@/lib/password-reset";

export const runtime = "nodejs";
const schema = z.object({
  token: z.string().min(10).max(4096),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid new password (8–128 characters)." }, { status: 400 });

  try {
    const { userId, fingerprint } = await verifyResetToken(parsed.data.token);
    const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user || !matchesCurrentPassword(user.passwordHash, fingerprint)) {
      return NextResponse.json({ error: "This reset link is invalid or has already been used." }, { status: 400 });
    }
    const newHash = await bcrypt.hash(parsed.data.password, 12);
    const updated = await db.user.updateMany({
      where: { id: userId, passwordHash: user.passwordHash },
      data: { passwordHash: newHash },
    });
    if (updated.count !== 1) {
      return NextResponse.json({ error: "This reset link has already been used. Request a new one." }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("nb_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ error: "This reset link is invalid or expired. Request a new one." }, { status: 400 });
  }
}
