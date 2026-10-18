import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {MERCH_ID} from "@/lib/merchandising";
import {NextResponse} from "next/server";
import {z} from "zod";

const ids=z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(100);
const schema=z.object({
 homepageIds:ids.max(6),topIds:ids,newIds:ids,
 shuffleHome:z.boolean(),shuffleTop:z.boolean(),shuffleNew:z.boolean(),
}).superRefine((data,ctx)=>{
 for(const field of ["homepageIds","topIds","newIds"] as const){
  if(new Set(data[field]).size!==data[field].length)
   ctx.addIssue({code:"custom",path:[field],message:"Duplicate product"});
 }
});
export async function PUT(req:Request){
 const user=await currentUser();
 if(user?.role!=="ADMIN")return NextResponse.json({error:"Admin access required"},{status:403});
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>i.message).join("; ")},{status:400});
 const c=parsed.data,all=[...new Set([...c.homepageIds,...c.topIds,...c.newIds])];
 const count=await db.product.count({where:{id:{in:all},active:true}});
 if(count!==all.length)return NextResponse.json({error:"Only active products can be featured. Refresh and retry."},{status:409});
 await db.storefrontMerchandising.upsert({where:{id:MERCH_ID},create:{id:MERCH_ID,...c},update:c});
 return NextResponse.json({ok:true});
}
