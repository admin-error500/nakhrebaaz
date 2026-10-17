import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SALE_ID } from "@/lib/sale";
import { NextResponse } from "next/server";
import { z } from "zod";

const date=z.string().datetime({offset:true}).nullable();
const campaign=z.object({
 enabled:z.boolean(), title:z.string().trim().min(3).max(90),
 subtitle:z.string().trim().max(180),
 imageUrl:z.union([z.string().url().refine(x=>x.startsWith("https://")),z.literal("")]).nullable(),
 buttonText:z.string().trim().min(2).max(40),
 buttonUrl:z.string().trim().startsWith("/").max(300).refine(x=>x.startsWith("/")&&!x.startsWith("//")&&!x.includes("\\")&&!/[\r\n]/.test(x),"Use an internal site path"),
 startsAt:date,endsAt:date,
}).superRefine((c,ctx)=>{
 if(c.startsAt&&c.endsAt&&new Date(c.endsAt)<=new Date(c.startsAt))
 ctx.addIssue({code:"custom",message:"Sale end must be after start",path:["endsAt"]});
});
const rate=z.number().int().min(0).max(90);
const request=z.object({
 campaign,discounts:z.array(z.object({
 productId:z.string().regex(/^[a-f0-9]{24}$/i),percent:rate,
 })).max(500),
}).superRefine((d,ctx)=>{
 const ids=d.discounts.map(x=>x.productId);
 if(new Set(ids).size!==ids.length)ctx.addIssue({code:"custom",message:"Duplicate product",path:["discounts"]});
});
export async function PUT(req:Request){
 if((await currentUser())?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});
 const parsed=request.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(x=>x.message).join("; ")},{status:400});
 const {campaign:c,discounts}=parsed.data;
 try{
  const ids=discounts.map(x=>x.productId);
  const existing=await db.product.count({where:{id:{in:ids}}});
  if(existing!==ids.length)return NextResponse.json({error:"Some products no longer exist. Refresh and retry."},{status:409});
  if(c.enabled && !discounts.some(x=>x.percent>0) && !(await db.product.count({where:{saleDiscountPercent:{gt:0}}})>0 && discounts.length===0)){
   return NextResponse.json({error:"Select at least one product discount before enabling a sale."},{status:400});
  }
  await db.$transaction(async tx=>{
   await tx.saleCampaign.upsert({
    where:{id:SALE_ID},
    create:{id:SALE_ID,enabled:c.enabled,title:c.title,subtitle:c.subtitle,
      imageUrl:c.imageUrl||null,buttonText:c.buttonText,buttonUrl:c.buttonUrl,
      startsAt:c.startsAt?new Date(c.startsAt):null,endsAt:c.endsAt?new Date(c.endsAt):null},
    update:{enabled:c.enabled,title:c.title,subtitle:c.subtitle,
      imageUrl:c.imageUrl||null,buttonText:c.buttonText,buttonUrl:c.buttonUrl,
      startsAt:c.startsAt?new Date(c.startsAt):null,endsAt:c.endsAt?new Date(c.endsAt):null},
   });
   // Group products by discount to reduce write operations within the transaction.
   const groups=new Map<number,string[]>();
   for(const item of discounts){
    groups.set(item.percent,[...(groups.get(item.percent)??[]),item.productId]);
   }
   for(const [percent,productIds] of groups){
    await tx.product.updateMany({where:{id:{in:productIds}},data:{saleDiscountPercent:percent}});
   }
  },{maxWait:10000,timeout:20000});
  return NextResponse.json({ok:true,message:"Sale settings saved"});
 }catch(e){console.error("Sale settings update",e);return NextResponse.json({error:"Could not save sale settings"},{status:500});}
}
