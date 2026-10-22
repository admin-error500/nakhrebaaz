"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";

export function AuthForm({mode}:{mode:"login"|"register"}){
 const router=useRouter();
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [pendingEmail,setPendingEmail]=useState("");
 const [code,setCode]=useState("");
 async function post(url:string,body:object){
  const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const data=await r.json();
  if(!r.ok)throw new Error(data.error||"Please try again");
  return data;
 }
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  const data=Object.fromEntries(new FormData(e.currentTarget));
  try{
   const json=await post("/api/auth/"+mode,data);
   if(mode==="register"&&json.requiresVerification){
    setPendingEmail(String(json.email));
    setMessage("A six-digit verification code has been sent. Check your inbox and spam folder.");
    return;
   }
   router.push("/account");router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Error")}finally{setBusy(false)}
 }
 async function verify(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   await post("/api/auth/verify-email",{email:pendingEmail,code});
   router.push("/account");router.refresh();
  }catch(err){setError(err instanceof Error?err.message:"Verification failed")}finally{setBusy(false)}
 }
 async function resend(){
  setBusy(true);setError("");setMessage("");
  try{
   const data=await post("/api/auth/resend-verification",{email:pendingEmail});
   setMessage(data.message||"Another code has been sent.");
  }catch(err){setError(err instanceof Error?err.message:"Could not resend code")}finally{setBusy(false)}
 }
 return <main className="section auth">
  <div className="eyebrow">WELCOME TO NAKHREBAAZ</div>
  <h1>{pendingEmail?"Verify your email.":mode==="login"?"Welcome back.":"Join the club."}</h1>
  {pendingEmail?
   <>
    <p>We sent a 6-digit code to <strong>{pendingEmail}</strong>. The code expires in 10 minutes.</p>
    <form onSubmit={verify}>
     <label>Verification code<input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\\D/g,"").slice(0,6))} required placeholder="123456"/></label>
     {message&&<p role="status">{message}</p>}
     {error&&<p className="error" role="alert">{error}</p>}
     <button className="btn dark full" disabled={busy||code.length!==6}>{busy?"VERIFYING...":"VERIFY EMAIL & CREATE ACCOUNT"}</button>
    </form>
    <p style={{marginTop:14}}><button className="linkbtn" type="button" onClick={resend} disabled={busy}>Resend code</button> · <button className="linkbtn" type="button" disabled={busy} onClick={()=>{setPendingEmail("");setCode("");setError("");setMessage("")}}>Change email</button></p>
   </>
   :
   <>
    <form onSubmit={submit}>
     {mode==="register"&&<label>Full name<input name="name" required minLength={2}/></label>}
     <label>Email<input type="email" name="email" autoComplete="email" required/></label>
     <label>Password<input type="password" name="password" autoComplete={mode==="register"?"new-password":"current-password"} required minLength={8}/></label>
     {error&&<p className="error" role="alert">{error}</p>}
     <button className="btn dark full" disabled={busy}>{busy?"PLEASE WAIT...":mode==="login"?"SIGN IN":"SEND VERIFICATION CODE"}</button>
    </form>
    {mode==="login"&&<p style={{marginTop:12}}><Link href="/forgot-password">Forgot password?</Link></p>}
    <p>{mode==="login"?<>New here? <Link href="/register">Create an account</Link></>:<>Already a member? <Link href="/login">Sign in</Link></>}</p>
   </>}
 </main>;
}
