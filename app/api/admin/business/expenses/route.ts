import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
const schema=z.object({date:z.string().datetime().optional(),category:z.string().trim().min(1).max(80),description:z.string().trim().min(1).max(200),amount:z.number().positive().finite().max(10000000),reference:z.string().max(100).optional()});
export async function POST(req:Request){
 if((await currentUser())?.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
 const p=schema.safeParse(await req.json().catch(()=>null));
 if(!p.success)return NextResponse.json({error:p.error.issues.map(i=>i.message).join("; ")},{status:400});
 try{
 const {amount,...d}=p.data;
 const e=await db.businessExpense.create({data:{...d,date:d.date?new Date(d.date):new Date(),amountPaise:Math.round(amount*100)}});
 return NextResponse.json({ok:true,id:e.id},{status:201});
 }catch(e){console.error(e);return NextResponse.json({error:"Could not save expense"},{status:500});}
}
