import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
const kinds = ["PURCHASE","SALE","SALES_RETURN","SUPPLIER_RETURN","MATERIAL_PURCHASE","MATERIAL_USE","PRODUCTION"] as const;
const schema=z.object({
 kind:z.enum(kinds),date:z.string().datetime().optional(),reference:z.string().max(100).optional(),
 supplier:z.string().max(120).optional(),channel:z.string().max(80).optional(),
 notes:z.string().max(500).optional(),productName:z.string().trim().min(1).max(150),
 size:z.string().max(30).optional(),color:z.string().max(60).optional(),
 unit:z.enum(["pcs","ml","sheets","meters","kg"]).default("pcs"),
 quantity:z.number().positive().finite().max(1000000),
 unitPrice:z.number().min(0).finite().max(10000000),
 category:z.string().max(70).optional(),condition:z.enum(["SELLABLE","DAMAGED"]).optional(),
});
const money=(value:number)=>Math.round(value*100);
async function admin(){return (await currentUser())?.role==="ADMIN";}
export async function GET(){
 if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});
 const [transactions,expenses]=await Promise.all([
 db.businessTransaction.findMany({orderBy:{date:"desc"},take:500}),
 db.businessExpense.findMany({orderBy:{date:"desc"},take:500})
 ]);
 return NextResponse.json({
 transactions:transactions.map(x=>({...x,date:x.date.toISOString(),createdAt:x.createdAt.toISOString()})),
 expenses:expenses.map(x=>({...x,date:x.date.toISOString(),createdAt:x.createdAt.toISOString()}))
 });
}
export async function POST(req:Request){
 if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>i.message).join("; ")},{status:400});
 const {unitPrice,...v}=parsed.data;
 const unitPricePaise=money(unitPrice);
 try{
 const result=await db.businessTransaction.create({data:{
 ...v, date:v.date?new Date(v.date):new Date(),unitPricePaise,
 totalPaise:Math.round(unitPricePaise*v.quantity)
 }});
 return NextResponse.json({ok:true,id:result.id},{status:201});
 }catch(e){console.error("Business transaction",e);return NextResponse.json({error:"Could not save transaction"},{status:500});}
}
