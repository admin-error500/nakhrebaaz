import {NextResponse} from "next/server";
import {db} from "@/lib/db";
import {signIn} from "@/lib/auth";
import {notifyWelcome} from "@/lib/notifications";
import {z} from "zod";
import {codeMatches,MAX_EMAIL_CODE_ATTEMPTS} from "@/lib/email-verification";

export const runtime="nodejs";
const schema=z.object({email:z.string().trim().email().max(254),code:z.string().regex(/^\\d{6}$/)});
export async function POST(req:Request){
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter the six-digit email code."},{status:400});
 const email=parsed.data.email.toLowerCase(),code=parsed.data.code;
 try{
  const pending=await db.pendingEmailSignup.findUnique({where:{email}});
  if(!pending || pending.expiresAt.getTime()<=Date.now() || pending.attempts>=MAX_EMAIL_CODE_ATTEMPTS){
   return NextResponse.json({error:"Code expired or too many attempts. Request a new code."},{status:400});
  }
  if(!codeMatches(pending.codeHash,email,code)){
   await db.pendingEmailSignup.updateMany({
    where:{id:pending.id,codeHash:pending.codeHash,attempts:{lt:MAX_EMAIL_CODE_ATTEMPTS}},
    data:{attempts:{increment:1}},
   });
   return NextResponse.json({error:"Incorrect code. Please try again."},{status:400});
  }
  const claimed=await db.pendingEmailSignup.deleteMany({
   where:{id:pending.id,codeHash:pending.codeHash,expiresAt:{gt:new Date()},attempts:{lt:MAX_EMAIL_CODE_ATTEMPTS}}
  });
  if(claimed.count!==1)return NextResponse.json({error:"This code has been used or expired. Request another code."},{status:409});
  // The email has been verified; create the actual user only at this point.
  const user=await db.user.create({data:{name:pending.name,email,passwordHash:pending.passwordHash}});
  await signIn(user);
  try{await notifyWelcome({name:user.name,email:user.email})}catch(e){console.error("Welcome notification failed",e)}
  return NextResponse.json({ok:true});
 }catch(err){
  console.error("Email verification failed",err instanceof Error?err.message:"unknown");
  return NextResponse.json({error:"Could not verify email. Please try again."},{status:500});
 }
}
