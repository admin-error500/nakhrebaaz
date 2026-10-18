import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {getAdminOrderPage} from "@/lib/admin-data";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 const user=await currentUser();
 if(user?.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
 const p=new URL(req.url).searchParams;
 const cursor=p.get("cursor")??undefined;
 const filter=p.get("status")??"ALL";
 const search=p.get("q")??"";
 if(cursor&&!/^[a-f0-9]{24}$/i.test(cursor))return NextResponse.json({error:"Invalid cursor"},{status:400});
 if(cursor&&!(await db.order.findUnique({where:{id:cursor},select:{id:true}})))return NextResponse.json({error:"Page changed. Reload orders."},{status:409});
 try{return NextResponse.json(await getAdminOrderPage({cursor,filter,search}),{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error("Admin order pagination",e);return NextResponse.json({error:"Could not fetch orders"},{status:500});}
}
