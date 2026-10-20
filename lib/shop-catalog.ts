import {db} from "@/lib/db";
import {loadSale,salePrice} from "@/lib/sale";
import type {Prisma} from "@prisma/client";

export const SHOP_BATCH_SIZE=10;
export const CATEGORIES=["Men","Women","Kids","Accessories"] as const;
export const PRODUCT_CATEGORIES=["Men","Women","Kids","Mugs","Magic Mugs","Keychains","Caps"] as const;
export const GARMENT_TYPES=["T-Shirts","Hoodies","Sweatshirts","Mugs","Keychains","Caps"] as const;
export const FESTIVALS=["Diwali","Holi","Navratri","Raksha Bandhan","Eid","Christmas"] as const;

export type ShopFilters={category?:string;type?:string;festival?:string;q?:string};
export type ShopProduct={
 id:string;name:string;description:string;image:string;category:string;festival:string|null;
 price:number;originalPrice:number;discountPercent:number;stock:number;variantCount:number;
};

export function normalizeShopFilters(query:ShopFilters):ShopFilters{
 const trimmed=query.q?.trim().slice(0,80);
 return {
  ...(CATEGORIES.some(v=>v===query.category)?{category:query.category}:{}),
  ...(GARMENT_TYPES.some(v=>v===query.type)?{type:query.type}:{}),
  ...(FESTIVALS.some(v=>v===query.festival)?{festival:query.festival}:{}),
  ...(trimmed?{q:trimmed}:{}),
 };
}
export function shopWhere(query:ShopFilters):Prisma.ProductWhereInput{
 const filter=normalizeShopFilters(query);
 const conditions:Prisma.ProductWhereInput[]=[];
 if(filter.category){
  conditions.push(filter.category==="Accessories"
   ?{category:{in:["Mugs","Magic Mugs","Keychains","Caps"]}}
   :{category:filter.category});
 }
 if(filter.type){
  conditions.push(filter.type==="Mugs"
   ?{category:{in:["Mugs","Magic Mugs"]}}
   :filter.type==="Keychains"||filter.type==="Caps"
   ?{category:filter.type}
   :{name:{contains:filter.type==="T-Shirts"?"T-Shirt":filter.type==="Hoodies"?"Hoodie":"Sweatshirt",mode:"insensitive"}});
 }
 if(filter.q)conditions.push({name:{contains:filter.q,mode:"insensitive"}});
 return {
  active:true,
  ...(filter.festival?{festival:filter.festival}:{}),
  ...(conditions.length?{AND:conditions}:{}),
 };
}
export async function shopBatch(filters:ShopFilters,cursor?:string){
 const where=shopWhere(filters);
 const sale=await loadSale();
 const products=await db.product.findMany({
  where,
  select:{id:true,name:true,description:true,image:true,price:true,category:true,festival:true,saleDiscountPercent:true,
   variants:{select:{stock:true}}},
  orderBy:[{createdAt:"desc"},{id:"desc"}],
  take:SHOP_BATCH_SIZE+1,
  ...(cursor?{cursor:{id:cursor},skip:1}:{}),
 });
 const hasMore=products.length>SHOP_BATCH_SIZE;
 const visible=products.slice(0,SHOP_BATCH_SIZE);
 const normalized:ShopProduct[]=visible.map(p=>({
  id:p.id,name:p.name,description:p.description,image:p.image,category:p.category,festival:p.festival,
  originalPrice:p.price,discountPercent:sale.live?(p.saleDiscountPercent??0):0,
  price:salePrice(p.price,p.saleDiscountPercent??0,sale.live),
  stock:p.variants.reduce((sum,v)=>sum+v.stock,0),variantCount:p.variants.length,
 }));
 return {products:normalized,nextCursor:hasMore?visible.at(-1)?.id??null:null};
}
