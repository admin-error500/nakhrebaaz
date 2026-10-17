import { db } from "@/lib/db";
import { loadSale, salePrice } from "@/lib/sale";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic="force-dynamic";
const body=z.object({variantIds:z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1).max(30)});
export async function POST(req:Request){
 const parsed=body.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid cart"},{status:400});
 const {live}=await loadSale();
 const variants=await db.variant.findMany({where:{id:{in:parsed.data.variantIds}},include:{product:true}});
 return NextResponse.json({prices:variants.map(v=>({
  variantId:v.id,available:v.product.active,stock:v.stock,
  price:salePrice(v.product.price,v.product.saleDiscountPercent??0,live),
  originalPrice:v.product.price,discountPercent:live?(v.product.saleDiscountPercent??0):0,
 }))},{headers:{"Cache-Control":"no-store"}});
}
