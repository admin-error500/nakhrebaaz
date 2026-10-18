import {db} from "@/lib/db";

export const MERCH_ID="storefront";
export type MerchConfig={
 homepageIds:string[];topIds:string[];newIds:string[];
 shuffleHome:boolean;shuffleTop:boolean;shuffleNew:boolean;
};
export const DEFAULT_MERCH:MerchConfig={
 homepageIds:[],topIds:[],newIds:[],shuffleHome:false,shuffleTop:false,shuffleNew:false,
};
export async function loadMerchandising():Promise<MerchConfig>{
 const s=await db.storefrontMerchandising.findUnique({where:{id:MERCH_ID}});
 return s?{homepageIds:s.homepageIds,topIds:s.topIds,newIds:s.newIds,
 shuffleHome:s.shuffleHome,shuffleTop:s.shuffleTop,shuffleNew:s.shuffleNew}:DEFAULT_MERCH;
}
function dailyScore(id:string){
 const day=new Date().toISOString().slice(0,10);
 let hash=2166136261;
 for(const c of id+day){hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);}
 return hash>>>0;
}
export function curate<T extends {id:string}>(products:T[],ids:string[],shuffle=false,limit?:number):T[]{
 const catalog=new Map(products.map(p=>[p.id,p]));
 const chosen=ids.map(id=>catalog.get(id)).filter((p):p is T=>Boolean(p));
 const result=ids.length?chosen:products.slice();
 if(shuffle)result.sort((a,b)=>dailyScore(a.id)-dailyScore(b.id));
 return typeof limit==="number"?result.slice(0,limit):result;
}
