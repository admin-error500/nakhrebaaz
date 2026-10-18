import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {getInventoryPage} from "@/lib/admin-data";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:Request){
 if((await currentUser())?.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
 const cursor=new URL(req.url).searchParams.get("cursor")??undefined;
 if(cursor&&!/^[a-f0-9]{24}$/i.test(cursor))return NextResponse.json({error:"Invalid cursor"},{status:400});
 if(cursor&&!(await db.product.findUnique({where:{id:cursor},select:{id:true}})))return NextResponse.json({error:"Page changed. Reload inventory."},{status:409});
 try{return NextResponse.json(await getInventoryPage(cursor),{headers:{"Cache-Control":"no-store"}});}
 catch(e){console.error("Admin inventory pagination",e);return NextResponse.json({error:"Could not fetch inventory"},{status:500});}
}
