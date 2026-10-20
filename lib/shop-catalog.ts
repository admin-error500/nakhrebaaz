import {db} from "@/lib/db";
import {loadSale,salePrice} from "@/lib/sale";
import {shopWhere} from "./shop-filters.mjs";
import type {ShopFilters} from "./shop-filters.mjs";

export {
 CATEGORIES,CLOTHING_TYPES,ACCESSORY_TYPES,GARMENT_TYPES,FESTIVALS,
 normalizeShopFilters,shopWhere,shopQueryParams,shopHref,categoryHref,typeHref,searchHref
} from "./shop-filters.mjs";
export type {ShopFilters} from "./shop-filters.mjs";

export const SHOP_BATCH_SIZE=10;
export const PRODUCT_CATEGORIES=["Men","Women","Kids","Mugs","Magic Mugs","Keychains","Caps"] as const;

export type ShopProduct={
 id:string;name:string;description:string;image:string;category:string;festival:string|null;
 price:number;originalPrice:number;discountPercent:number;stock:number;variantCount:number;
};

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
