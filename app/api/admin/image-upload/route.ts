import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
const LIMIT=5*1024*1024;
const allowed=new Map([
  ["image/jpeg",{extension:"jpg",magic:[0xff,0xd8,0xff]}],
  ["image/png",{extension:"png",magic:[0x89,0x50,0x4e,0x47]}],
  ["image/webp",{extension:"webp",magic:[0x52,0x49,0x46,0x46]}],
]);

export async function POST(req:Request){
 const user=await currentUser();
 if(user?.role!=="ADMIN")return NextResponse.json({error:"Forbidden"},{status:403});
 const cloud=process.env.CLOUDINARY_CLOUD_NAME;
 const key=process.env.CLOUDINARY_API_KEY;
 const secret=process.env.CLOUDINARY_API_SECRET;
 if(!cloud||!key||!secret)return NextResponse.json({error:"Image upload storage is not configured"},{status:503});
 const form=await req.formData().catch(()=>null);
 const file=form?.get("file");
 if(!(file instanceof File))return NextResponse.json({error:"Choose an image file"},{status:400});
 const kind=allowed.get(file.type);
 if(!kind||file.size<1||file.size>LIMIT)return NextResponse.json({error:"Use JPG, PNG or WebP image under 5 MB"},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(!kind.magic.every((v,i)=>bytes[i]===v)||(file.type==="image/webp"&&String.fromCharCode(...bytes.slice(8,12))!=="WEBP")){
   return NextResponse.json({error:"Invalid image file"},{status:400});
 }
 const timestamp=Math.floor(Date.now()/1000).toString();
 const folder="nakhrebaaz/products";
 const publicId=`product_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
 const signString=`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`;
 const signature=createHash("sha1").update(signString).digest("hex");
 const upload=new FormData();
 upload.set("file",new Blob([bytes],{type:file.type}),`product.${kind.extension}`);
 upload.set("api_key",key);upload.set("timestamp",timestamp);
 upload.set("folder",folder);upload.set("public_id",publicId);upload.set("signature",signature);
 try{
  const result=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,{method:"POST",body:upload,cache:"no-store"});
  const json=await result.json().catch(()=>null) as {secure_url?:unknown;error?:{message?:string}}|null;
  if(!result.ok||typeof json?.secure_url!=="string"||!json.secure_url.startsWith("https://")){
    console.error("Cloudinary upload failed",result.status,json?.error?.message);
    return NextResponse.json({error:"Image hosting failed. Check Cloudinary configuration."},{status:502});
  }
  return NextResponse.json({url:json.secure_url});
 }catch(e){console.error("Image upload network failure",e);return NextResponse.json({error:"Image service unavailable"},{status:502});}
}
