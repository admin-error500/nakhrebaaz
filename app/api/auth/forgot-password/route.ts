import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issueResetToken } from "@/lib/password-reset";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().trim().email().max(254) });
const generic = { message: "If an account exists for this email, a password reset link will be sent." };

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await db.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
    if (!user) return NextResponse.json(generic);

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!apiKey || !from || !site) {
      console.error("Password reset mail not configured (RESEND_API_KEY, EMAIL_FROM, NEXT_PUBLIC_SITE_URL)");
      return NextResponse.json(generic);
    }
    const base = new URL(site);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && base.hostname === "localhost")) {
      throw new Error("Invalid NEXT_PUBLIC_SITE_URL configuration");
    }
    const token = await issueResetToken(user.id, user.passwordHash);
    const url = new URL("/reset-password", base);
    url.searchParams.set("token", token);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Reset your NakhreBaaz password",
        html: `<p>We received a request to reset your NakhreBaaz password.</p><p><a href="${url.toString()}">Reset your password</a></p><p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>`,
      }),
    });
    if (!response.ok) console.error("Password reset delivery failed", response.status);
    return NextResponse.json(generic);
  } catch (err) {
    console.error("Password reset request failed", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(generic);
  }
}
