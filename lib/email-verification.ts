import {createHmac,randomInt,timingSafeEqual} from "node:crypto";

export const EMAIL_CODE_TTL_MS = 10*60*1000;
export const EMAIL_CODE_COOLDOWN_MS = 60*1000;
export const MAX_EMAIL_CODE_ATTEMPTS = 5;

function otpSecret(){
 const secret=process.env.EMAIL_VERIFICATION_SECRET || process.env.SESSION_SECRET;
 if(!secret || secret.length<32)throw new Error("Set EMAIL_VERIFICATION_SECRET (32+ characters) or SESSION_SECRET");
 return secret;
}
export function newEmailCode(){
 return randomInt(0,1000000).toString().padStart(6,"0");
}
export function hashEmailCode(email:string,code:string){
 return createHmac("sha256",otpSecret()).update(email+"\u0000"+code).digest("hex");
}
export function codeMatches(actualHash:string,email:string,code:string){
 const expected=Buffer.from(hashEmailCode(email,code),"hex");
 const actual=Buffer.from(actualHash,"hex");
 return actual.length===expected.length && timingSafeEqual(actual,expected);
}
export async function sendSignupCode(email:string,code:string){
 const key=process.env.RESEND_API_KEY;
 const from=process.env.EMAIL_FROM;
 if(!key||!from)throw new Error("Email delivery is not configured");
 const result=await fetch("https://api.resend.com/emails",{
  method:"POST",
  headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
  body:JSON.stringify({
   from,to:[email],subject:"Verify your NakhreBaaz account",
   text:`Your NakhreBaaz verification code is ${code}. It expires in 10 minutes. If you didn't sign up, ignore this email.`,
   html:`<div style="font-family:Arial,sans-serif"><h2>Verify your NakhreBaaz email</h2><p>Use this 6-digit code to finish creating your account:</p><p style="font-weight:bold;font-size:28px;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you didn't sign up, ignore this email.</p></div>`
  })
 });
 if(!result.ok){console.error("Signup OTP email failed",result.status);throw new Error("Unable to deliver verification email");}
}
