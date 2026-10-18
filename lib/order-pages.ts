import {db} from "@/lib/db";
export const USER_PAGE_SIZE=10;
export const ADMIN_PAGE_SIZE=20;
export type OrderCard={
 id:string;total:number;status:string;paymentStatus:string;paymentMethod:string;createdAt:string;
 items:{id:string;name:string;size:string;color:string;quantity:number;productId:string|null}[];
};
export async function getUserOrderPage(userId:string,cursor?:string){
 const data=await db.order.findMany({
  where:{userId},include:{items:{include:{variant:{select:{productId:true}}}}},
  orderBy:[{createdAt:"desc"},{id:"desc"}],take:USER_PAGE_SIZE+1,
  ...(cursor?{cursor:{id:cursor},skip:1}:{}),
 });
 const hasMore=data.length>USER_PAGE_SIZE,orders=data.slice(0,USER_PAGE_SIZE);
 const result:OrderCard[]=orders.map(o=>({
  id:o.id,total:o.total,status:o.status,paymentStatus:o.paymentStatus,paymentMethod:o.paymentMethod,
  createdAt:o.createdAt.toISOString(),
  items:o.items.map(i=>({id:i.id,name:i.name,size:i.size,color:i.color,quantity:i.quantity,productId:i.variant?.productId??null})),
 }));
 return {orders:result,nextCursor:hasMore?orders.at(-1)?.id??null:null};
}
