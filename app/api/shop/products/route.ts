import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {shopBatch,normalizeShopFilters} from "@/lib/shop-catalog";
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
  const existing=await db.product.findFirst({where:{id:cursor,active:true,
   ...(filters.category?{category:filters.category}:{}),
   ...(filters.festival?{festival:filters.festival}:{}),
   ...(filters.type?{name:{contains:filters.type==="T-Shirts"?"T-Shirt":filters.type==="Hoodies"?"Hoodie":"Sweatshirt",mode:"insensitive" as const}}:{}),
   ...(filters.q?{AND:[{name:{contains:filters.q,mode:"insensitive" as const}}]}:{}),
  },select:{id:true}});
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
