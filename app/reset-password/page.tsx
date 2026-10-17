"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to reset password.");
      setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Please request a new reset link."); }
    finally { setBusy(false); }
  }
  if (!token) return <p role="alert">Missing reset token. <Link href="/forgot-password">Request a new link</Link>.</p>;
  if (success) return <p role="status">Password updated. <Link href="/login">Sign in with your new password →</Link></p>;
  return <form onSubmit={submit}>
    <label>New password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
    <label>Confirm new password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="btn dark full" disabled={busy}>{busy ? "UPDATING..." : "RESET PASSWORD"}</button>
  </form>;
}

export default function ResetPasswordPage() {
  return <main className="section auth">
    <div className="eyebrow">NAKHREBAAZ ACCOUNT RECOVERY</div>
    <h1>Reset your password.</h1>
    <Suspense fallback={<p>Loading reset form...</p>}><ResetForm /></Suspense>
    <p><Link href="/login">← Back to login</Link></p>
  </main>;
}
