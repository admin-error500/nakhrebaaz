import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema=z.object({
  name:z.string().trim().min(2).max(80),
  phone:z.union([z.string().regex(/^[6-9][0-9]{9}$/),z.literal("")]),
});
export async function PATCH(req:Request){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Please sign in"},{status:401});
 const parsed=profileSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Enter a valid name and 10-digit Indian mobile number"},{status:400});
 const saved=await db.user.update({where:{id:user.id},data:{name:parsed.data.name,phone:parsed.data.phone||null},select:{name:true,email:true,phone:true}});
 return NextResponse.json({ok:true,profile:saved});
}
