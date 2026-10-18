import {currentUser} from "@/lib/auth";
import {getUserOrderPage} from "@/lib/order-pages";
import {db} from "@/lib/db";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const user=await currentUser();
 if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const cursor=new URL(req.url).searchParams.get("cursor")??undefined;
 if(cursor&&!/^[a-f0-9]{24}$/i.test(cursor))return NextResponse.json({error:"Invalid cursor"},{status:400});
 if(cursor){
  const found=await db.order.findFirst({where:{id:cursor,userId:user.id},select:{id:true}});
  if(!found)return NextResponse.json({error:"Order list changed. Refresh and retry."},{status:409});
 }
 try{
  return NextResponse.json(await getUserOrderPage(user.id,cursor),{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){console.error("User orders fetch failed",e);return NextResponse.json({error:"Unable to load orders"},{status:500});}
}
