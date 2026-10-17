import { db } from "@/lib/db";

export const SALE_ID = "global";
export type SaleSettings = {
 enabled: boolean; title: string; subtitle: string; imageUrl: string | null;
 buttonText: string; buttonUrl: string; startsAt: Date | null; endsAt: Date | null;
};
export const DEFAULT_SALE:SaleSettings = {
 enabled:false,title:"NAKHREBAAZ SALE",subtitle:"Limited-time offers on selected styles",
 imageUrl:null,buttonText:"SHOP SALE",buttonUrl:"/#shop",startsAt:null,endsAt:null,
};
export function saleIsLive(settings:SaleSettings,now=new Date()):boolean{
 return settings.enabled && (!settings.startsAt || settings.startsAt<=now) &&
 (!settings.endsAt || settings.endsAt>now);
}
export function salePrice(original:number,percent:number,live:boolean):number{
 const rate=Number.isInteger(percent)&&percent>=1&&percent<=90?percent:0;
 return live && rate>0 ? Math.max(1,Math.round(original*(100-rate)/100)) : original;
}
export async function loadSale(){
 const record=await db.saleCampaign.findUnique({where:{id:SALE_ID}});
 const settings:SaleSettings=record?{
 enabled:record.enabled,title:record.title,subtitle:record.subtitle,imageUrl:record.imageUrl,
 buttonText:record.buttonText,buttonUrl:record.buttonUrl,startsAt:record.startsAt,endsAt:record.endsAt,
 }:DEFAULT_SALE;
 return {settings,live:saleIsLive(settings)};
}
