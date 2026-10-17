"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Please try again.");
      setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send reset link."); }
    finally { setBusy(false); }
  }
  return <main className="section auth">
    <div className="eyebrow">NAKHREBAAZ ACCOUNT RECOVERY</div>
    <h1>Forgot password?</h1>
    <p>Enter your registered email address. We’ll send a secure reset link if the account exists.</p>
    <form onSubmit={submit}>
      <label>Email address<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button className="btn dark full" disabled={busy}>{busy ? "PLEASE WAIT..." : "SEND RESET LINK"}</button>
    </form>
    <p><Link href="/login">← Back to login</Link></p>
  </main>;
}
