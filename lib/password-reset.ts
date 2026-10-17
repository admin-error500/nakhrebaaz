import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

// Keep reset links separate from the normal authentication JWT purpose.
function resetKey(): Uint8Array {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || new TextEncoder().encode(sessionSecret).length < 32) {
    throw new Error("SESSION_SECRET must be configured");
  }
  const digest = createHash("sha256").update("nakhrebaaz-password-reset:v1:").update(sessionSecret).digest();
  return new Uint8Array(digest);
}

const passwordFingerprint = (hash: string) =>
  createHash("sha256").update(hash).digest("hex");

export async function issueResetToken(userId: string, passwordHash: string): Promise<string> {
  return new SignJWT({ passwordFingerprint: passwordFingerprint(passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("nakhrebaaz")
    .setAudience("password-reset")
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(resetKey());
}

export async function verifyResetToken(token: string): Promise<{ userId: string; fingerprint: string }> {
  const { payload } = await jwtVerify(token, resetKey(), {
    issuer: "nakhrebaaz",
    audience: "password-reset",
    algorithms: ["HS256"],
  });
  if (!payload.sub || typeof payload.passwordFingerprint !== "string" || !/^[a-f\d]{64}$/.test(payload.passwordFingerprint)) {
    throw new Error("Invalid password reset token");
  }
  return { userId: payload.sub, fingerprint: payload.passwordFingerprint };
}

export function matchesCurrentPassword(currentHash: string, fingerprint: string): boolean {
  return passwordFingerprint(currentHash) === fingerprint;
}
