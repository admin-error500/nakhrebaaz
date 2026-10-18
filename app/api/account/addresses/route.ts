import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressInputSchema } from "@/lib/address-validation";
import { NextResponse } from "next/server";

export const dynamic="force-dynamic";
export async function GET(){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Please sign in"},{status:401});
 const addresses=await db.savedAddress.findMany({where:{userId:user.id},orderBy:[{isDefault:"desc"},{createdAt:"desc"}]});
 return NextResponse.json({addresses},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(req:Request){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Please sign in"},{status:401});
 const parsed=addressInputSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(x=>x.message).join("; ")},{status:400});
 try{
  const address=await db.$transaction(async tx=>{
   const count=await tx.savedAddress.count({where:{userId:user.id}});
   if(count>=10)throw new Error("You can save up to 10 addresses.");
   const data=parsed.data;
   const isDefault=data.isDefault||count===0;
   if(isDefault)await tx.savedAddress.updateMany({where:{userId:user.id,isDefault:true},data:{isDefault:false}});
   return tx.savedAddress.create({data:{
    userId:user.id,tag:data.tag,recipientName:data.recipientName,phone:data.phone,line1:data.line1,
    line2:data.line2||null,landmark:data.landmark||null,city:data.city,state:data.state,pincode:data.pincode,isDefault,
   }});
  });
  return NextResponse.json({ok:true,address},{status:201});
 }catch(e){
  console.error("Add address failed",e);
  return NextResponse.json({error:e instanceof Error&&e.message==="You can save up to 10 addresses."?e.message:"Could not save address"},{status:409});
 }
}
