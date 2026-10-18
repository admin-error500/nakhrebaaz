import { db } from "@/lib/db";
import type { InventoryProduct } from "@/components/inventory-editor";

export type AdminProduct = InventoryProduct & { saleDiscountPercent: number };
export type AdminOrder = {
 id:string;name:string;email:string;total:number;status:string;
 paymentMethod:string;paymentStatus:string;addressJson:string;createdAt:string;
 items:{name:string;size:string;color:string;quantity:number}[];
};

export async function getAdminOrders():Promise<AdminOrder[]>{
 const orders=await db.order.findMany({
  include:{user:{select:{name:true,email:true}},items:true},
  orderBy:{createdAt:"desc"},
 });
 return orders.map(o=>({
  id:o.id,name:o.user.name,email:o.user.email,total:o.total,status:o.status,
  paymentMethod:o.paymentMethod,paymentStatus:o.paymentStatus,addressJson:o.addressJson,
  createdAt:o.createdAt.toISOString(),
  items:o.items.map(i=>({name:i.name,size:i.size,color:i.color,quantity:i.quantity})),
 }));
}

export async function getInventoryData(){
 const [products,orders]=await Promise.all([
  db.product.findMany({include:{variants:true},orderBy:{createdAt:"desc"}}),
  db.order.findMany({select:{
   status:true,paymentMethod:true,paymentStatus:true,
   items:{select:{variantId:true,quantity:true}},
  }}),
 ]);
 const soldByVariant=new Map<string,number>();
 for(const o of orders){
  if(o.status==="CANCELLED" || (o.paymentMethod!=="COD" && o.paymentStatus!=="PAID"))continue;
  for(const item of o.items)soldByVariant.set(item.variantId,(soldByVariant.get(item.variantId)??0)+item.quantity);
 }
 const mapped:AdminProduct[]=products.map(p=>({
  id:p.id,name:p.name,description:p.description,image:p.image,price:p.price,
  category:p.category,festival:p.festival??null,active:p.active,
  saleDiscountPercent:p.saleDiscountPercent??0,
  sold:p.variants.reduce((sum,v)=>sum+(soldByVariant.get(v.id)??0),0),
  variants:p.variants.map(v=>({
   id:v.id,size:v.size,color:v.color,stock:v.stock,sku:v.sku,
   sold:soldByVariant.get(v.id)??0,
  })),
 }));
 return {
  products:mapped,
  totalSold:[...soldByVariant.values()].reduce((sum,n)=>sum+n,0),
  totalAvailable:mapped.reduce((sum,p)=>sum+(p.active?p.variants.reduce((n,v)=>n+v.stock,0):0),0),
 };
}
