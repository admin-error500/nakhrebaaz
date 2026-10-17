"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart";

type Price = {variantId:string;price:number;originalPrice:number;discountPercent:number;stock:number;available:boolean};
export function useLiveCartPrices(){
 const {items}=useCart();
 const [prices,setPrices]=useState<Record<string,Price>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const ids=useMemo(()=>items.map(i=>i.variantId).sort().join(","),[items]);
 const reload=useCallback(async(signal?:AbortSignal)=>{
  if(!ids){setPrices({});setError("");setLoading(false);return;}
  setLoading(true);setError("");
  try{
   const res=await fetch("/api/cart/prices",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({variantIds:ids.split(",")}),signal,cache:"no-store"});
   if(!res.ok)throw new Error("Unable to verify current product prices. Please try again.");
   const json=await res.json() as {prices:Price[]};
   if(signal?.aborted)return;
   setPrices(Object.fromEntries(json.prices.map(p=>[p.variantId,p])));
  }catch(e){if(signal?.aborted)return;setError(e instanceof Error?e.message:"Price check failed");}
  finally{if(!signal?.aborted)setLoading(false);}
 },[ids]);
 useEffect(()=>{const ac=new AbortController();void reload(ac.signal);const onFocus=()=>void reload();window.addEventListener("focus",onFocus);return()=>{ac.abort();window.removeEventListener("focus",onFocus);};},[reload]);
 const unavailable=items.some(i=>!prices[i.variantId]||!prices[i.variantId].available||prices[i.variantId].stock<i.quantity);
 const subtotal=items.reduce((sum,i)=>sum+(prices[i.variantId]?.price??0)*i.quantity,0);
 const shipping=subtotal>=1499?0:99;
 return {prices,loading,error,unavailable,subtotal,shipping,total:subtotal+shipping,reload};
}
