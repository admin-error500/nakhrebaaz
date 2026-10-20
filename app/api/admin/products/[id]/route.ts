import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const idSchema = z.string().regex(/^[a-fA-F0-9]{24}$/);
const variantSchema = z.object({
  id: idSchema.optional(),
  size: z.string().trim().min(1),
  color: z.string().trim().min(1),
  stock: z.number().int().min(0),
  sku: z.string().trim().min(3),
});
const schema = z.object({
  name: z.string().trim().min(3),
  description: z.string().trim().min(5),
  category: z.enum(['Men','Women','Kids','Mugs','Magic Mugs','Keychains']),
  festival: z.enum(['Diwali','Holi','Navratri','Raksha Bandhan','Eid','Christmas']).nullable(),
  image: z.string().url().refine(v=>v.startsWith('https://'),'Image URL must start with https://'),
  price: z.number().int().min(1),
  active: z.boolean(),
  variants: z.array(variantSchema).min(1),
}).superRefine((p,ctx)=>{
  const skus=new Set<string>(), combinations=new Set<string>(), ids=new Set<string>();
  p.variants.forEach((v,i)=>{
    const sku=v.sku.toLowerCase(), combination=v.size.toLowerCase()+'|'+v.color.toLowerCase();
    if(skus.has(sku))ctx.addIssue({code:'custom',path:['variants',i,'sku'],message:'Duplicate SKU'});
    if(combinations.has(combination))ctx.addIssue({code:'custom',path:['variants',i],message:'Duplicate size/color'});
    if(v.id && ids.has(v.id))ctx.addIssue({code:'custom',path:['variants',i,'id'],message:'Duplicate variant'});
    skus.add(sku);combinations.add(combination);if(v.id)ids.add(v.id);
  });
});
type Ctx={params:Promise<{id:string}>};
function failed(e:unknown){
  if(e instanceof z.ZodError)return NextResponse.json({error:e.issues.map(i=>i.message).join('; ')},{status:400});
  if(e instanceof Prisma.PrismaClientKnownRequestError && e.code==='P2002')return NextResponse.json({error:'Duplicate SKU or size/color.'},{status:409});
  console.error('Admin product change failed',e);
  return NextResponse.json({error:'Unable to modify product. Retry or inspect server logs.'},{status:500});
}
export async function PATCH(req:Request,{params}:Ctx){
  if((await currentUser())?.role!=='ADMIN')return NextResponse.json({error:'Forbidden'},{status:403});
  const {id}=await params;
  if(!idSchema.safeParse(id).success)return NextResponse.json({error:'Invalid product ID'},{status:400});
  try{
    const data=schema.parse(await req.json());
    await db.$transaction(async tx=>{
      const old=await tx.product.findUnique({where:{id},include:{variants:true}});
      if(!old)throw new Error('Product not found');
      const ownIds=new Set(old.variants.map(v=>v.id));
      if(data.variants.some(v=>v.id && !ownIds.has(v.id)))throw new Error('Unknown variant ID');
      const retained=new Set(data.variants.filter(v=>v.id).map(v=>v.id!));
      const removed=old.variants.filter(v=>!retained.has(v.id));
      for(const v of removed){
        if(await tx.orderItem.count({where:{variantId:v.id}})>0)throw new Error('Cannot remove size/color linked to an order. Set stock to 0 instead.');
      }
      // Products with historic order items remain addressable, even when hidden.
      await tx.product.update({where:{id},data:{
        name:data.name,description:data.description,category:data.category,
        festival:data.festival,image:data.image,price:data.price,active:data.active,
      }});
      for(const v of data.variants.filter(v=>v.id)){
        await tx.variant.update({where:{id:v.id!},data:{size:v.size,color:v.color,stock:v.stock,sku:v.sku}});
      }
      for(const v of removed)await tx.variant.delete({where:{id:v.id}});
      for(const v of data.variants.filter(v=>!v.id)){
        await tx.variant.create({data:{productId:id,size:v.size,color:v.color,stock:v.stock,sku:v.sku}});
      }
    });
    return NextResponse.json({success:true});
  }catch(e){
    if(e instanceof Error && (/linked to an order|Unknown variant ID|Product not found/.test(e.message)))return NextResponse.json({error:e.message},{status:409});
    return failed(e);
  }
}
export async function DELETE(_req:Request,{params}:Ctx){
  if((await currentUser())?.role!=='ADMIN')return NextResponse.json({error:'Forbidden'},{status:403});
  const {id}=await params;
  if(!idSchema.safeParse(id).success)return NextResponse.json({error:'Invalid product ID'},{status:400});
  try{
    const result=await db.$transaction(async tx=>{
      const p=await tx.product.findUnique({where:{id},include:{variants:true}});
      if(!p)throw new Error('Product not found');
      const ids=p.variants.map(v=>v.id);
      const ordered=ids.length>0 && (await tx.orderItem.count({where:{variantId:{in:ids}}}))>0;
      if(ordered){
        await tx.product.update({where:{id},data:{active:false}});
        return {success:true,archived:true,message:'Product archived, hidden from storefront; past orders preserved.'};
      }
      await tx.variant.deleteMany({where:{productId:id}});
      await tx.product.delete({where:{id}});
      return {success:true,archived:false,message:'Product deleted permanently.'};
    });
    return NextResponse.json(result);
  }catch(e){
    if(e instanceof Error && e.message==='Product not found')return NextResponse.json({error:e.message},{status:404});
    return failed(e);
  }
}
