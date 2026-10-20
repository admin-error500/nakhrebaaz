import {db} from "@/lib/db";
import {shopBatch,normalizeShopFilters,shopWhere} from "@/lib/shop-catalog";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
const objectId=/^[a-f0-9]{24}$/i;
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;
 const cursor=params.get("cursor")??undefined;
 if(cursor&&!objectId.test(cursor))return NextResponse.json({error:"Invalid page cursor"},{status:400});
 const filters=normalizeShopFilters({
  category:params.get("category")??undefined,type:params.get("type")??undefined,
  festival:params.get("festival")??undefined,q:params.get("q")??undefined,
 });
 // Check cursor belongs to the active filtered catalogue, rather than allowing a mismatched cursor.
 if(cursor){
  const existing=await db.product.findFirst({where:{...shopWhere(filters),id:cursor},select:{id:true}});
  if(!existing)return NextResponse.json({error:"Products changed. Refresh the catalogue."},{status:409});
 }
 try{
  const data=await shopBatch(filters,cursor);
  return NextResponse.json(data,{headers:{"Cache-Control":"no-store"}});
 }catch(e){
  console.error("Shop page load failed",e);
  return NextResponse.json({error:"Unable to load more products"},{status:500});
 }
}
