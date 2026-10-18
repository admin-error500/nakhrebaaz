import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { InventoryEditor } from "@/components/inventory-editor";

export const dynamic="force-dynamic";
export default async function EditProductPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f]{24}$/i.test(id))notFound();
 const p=await db.product.findUnique({where:{id},include:{variants:true}});
 if(!p)notFound();
 const product={
  id:p.id,name:p.name,description:p.description,image:p.image,price:p.price,
  category:p.category,festival:p.festival??null,active:p.active,sold:0,
  variants:p.variants.map(v=>({id:v.id,size:v.size,color:v.color,stock:v.stock,sku:v.sku,sold:0})),
 };
 return <>
  <p><Link href="/admin/inventory">← Back to Inventory</Link></p>
  <InventoryEditor products={[product]} totalSold={0} totalAvailable={p.active?p.variants.reduce((n,v)=>n+v.stock,0):0} />
 </>;
}
