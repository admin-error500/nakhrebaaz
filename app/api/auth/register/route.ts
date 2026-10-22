import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import bcrypt from "bcryptjs";
import {z} from "zod";
import {newEmailCode,hashEmailCode,sendSignupCode,EMAIL_CODE_TTL_MS,EMAIL_CODE_COOLDOWN_MS} from "@/lib/email-verification";

export const runtime="nodejs";
const schema=z.object({
 name:z.string().trim().min(2).max(80),
 email:z.string().trim().email().max(254),
 password:z.string().min(8).max(128),
});
export async function POST(req:Request){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter a valid name, email and password (at least 8 characters)."}, {status:400});
 const {name,password}=parsed.data;
 const email=parsed.data.email.toLowerCase();
 try{
  if(await db.user.findUnique({where:{email},select:{id:true}})){
   return NextResponse.json({error:"Email already registered. Please sign in."},{status:409});
  }
  const existing=await db.pendingEmailSignup.findUnique({where:{email}});
  if(existing && Date.now()-existing.lastSentAt.getTime()<EMAIL_CODE_COOLDOWN_MS){
   return NextResponse.json({error:"Please wait 60 seconds before requesting another code."},{status:429});
  }
  const code=newEmailCode(), codeHash=hashEmailCode(email,code);
  const passwordHash=await bcrypt.hash(password,12);
  const pending=await db.pendingEmailSignup.upsert({
   where:{email},
   create:{email,name,passwordHash,codeHash,expiresAt:new Date(Date.now()+EMAIL_CODE_TTL_MS),attempts:0},
   update:{name,passwordHash,codeHash,expiresAt:new Date(Date.now()+EMAIL_CODE_TTL_MS),attempts:0,lastSentAt:new Date()},
  });
  try{
   await sendSignupCode(email,code);
  }catch{
   await db.pendingEmailSignup.deleteMany({where:{id:pending.id,codeHash}});
   return NextResponse.json({error:"Could not send the email code. Please try again."},{status:503});
  }
  return NextResponse.json({ok:true,requiresVerification:true,email,message:"We sent a 6-digit code to your email."});
 }catch(err){
  console.error("Signup verification start failed",err instanceof Error?err.message:"unknown");
  return NextResponse.json({error:"Unable to start signup. Please try again."},{status:500});
 }
}
