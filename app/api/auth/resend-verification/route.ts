import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {z} from "zod";
import {newEmailCode,hashEmailCode,sendSignupCode,EMAIL_CODE_TTL_MS,EMAIL_CODE_COOLDOWN_MS} from "@/lib/email-verification";

export const runtime="nodejs";
const schema=z.object({email:z.string().trim().email().max(254)});
export async function POST(req:Request){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter a valid email."},{status:400});
 const email=parsed.data.email.toLowerCase();
 try{
  const pending=await db.pendingEmailSignup.findUnique({where:{email}});
  if(!pending)return NextResponse.json({error:"No pending signup found. Please register again."},{status:404});
  if(Date.now()-pending.lastSentAt.getTime()<EMAIL_CODE_COOLDOWN_MS)
   return NextResponse.json({error:"Wait 60 seconds before resending a code."},{status:429});
  const code=newEmailCode(),codeHash=hashEmailCode(email,code);
  const result=await db.pendingEmailSignup.updateMany({
   where:{id:pending.id,lastSentAt:{lt:new Date(Date.now()-EMAIL_CODE_COOLDOWN_MS)},codeHash:pending.codeHash},
   data:{codeHash,expiresAt:new Date(Date.now()+EMAIL_CODE_TTL_MS),lastSentAt:new Date(),attempts:0},
  });
  if(result.count!==1)return NextResponse.json({error:"Please wait before requesting another code."},{status:429});
  try{await sendSignupCode(email,code)}catch{
   return NextResponse.json({error:"Could not send the code. Please try again later."},{status:503});
  }
  return NextResponse.json({ok:true,message:"A new verification code has been sent."});
 }catch(err){
  console.error("Resend OTP failed",err instanceof Error?err.message:"unknown");
  return NextResponse.json({error:"Unable to resend the code."},{status:500});
 }
}
