import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addressInputSchema } from "@/lib/address-validation";
import { NextResponse } from "next/server";
const isId=(id:string)=>/^[0-9a-fA-F]{24}$/.test(id);
type Context={params:Promise<{id:string}>};
export async function PATCH(req:Request,{params}:Context){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Please sign in"},{status:401});
 const {id}=await params;
 if(!isId(id))return NextResponse.json({error:"Invalid address"},{status:400});
 const parsed=addressInputSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(x=>x.message).join("; ")},{status:400});
 try{
  const saved=await db.$transaction(async tx=>{
   const existing=await tx.savedAddress.findFirst({where:{id,userId:user.id}});
   if(!existing)return null;
   const data=parsed.data;
   const count=await tx.savedAddress.count({where:{userId:user.id}});
   const isDefault=data.isDefault||count===1;
   if(isDefault)await tx.savedAddress.updateMany({where:{userId:user.id,isDefault:true},data:{isDefault:false}});
   const address=await tx.savedAddress.update({where:{id},data:{
    tag:data.tag,recipientName:data.recipientName,phone:data.phone,line1:data.line1,line2:data.line2||null,
    landmark:data.landmark||null,city:data.city,state:data.state,pincode:data.pincode,isDefault,
   }});
   if(existing.isDefault&&!isDefault){
    const other=await tx.savedAddress.findFirst({where:{userId:user.id,id:{not:id}},orderBy:{createdAt:"asc"}});
    if(other)await tx.savedAddress.update({where:{id:other.id},data:{isDefault:true}});
   }
   return address;
  });
  if(!saved)return NextResponse.json({error:"Address not found"},{status:404});
  return NextResponse.json({ok:true,address:saved});
 }catch(e){console.error("Edit address failed",e);return NextResponse.json({error:"Could not update address"},{status:500});}
}
export async function DELETE(_req:Request,{params}:Context){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Please sign in"},{status:401});
 const {id}=await params;
 if(!isId(id))return NextResponse.json({error:"Invalid address"},{status:400});
 try{
  const removed=await db.$transaction(async tx=>{
   const existing=await tx.savedAddress.findFirst({where:{id,userId:user.id}});
   if(!existing)return false;
   await tx.savedAddress.delete({where:{id}});
   if(existing.isDefault){
    const next=await tx.savedAddress.findFirst({where:{userId:user.id},orderBy:{createdAt:"asc"}});
    if(next)await tx.savedAddress.update({where:{id:next.id},data:{isDefault:true}});
   }
   return true;
  });
  if(!removed)return NextResponse.json({error:"Address not found"},{status:404});
  return NextResponse.json({ok:true});
 }catch(e){console.error("Delete address failed",e);return NextResponse.json({error:"Could not delete address"},{status:500});}
}
